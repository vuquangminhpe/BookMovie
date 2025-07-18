import { TokenType, UserVerifyStatus } from '../constants/enums'
import { RegisterReqBody, UpdateMeReqBody } from '../models/request/User.request'
import User, { UserRole } from '../models/schemas/User.schema'
import { hashPassword } from '../utils/crypto'
import { signToken } from '../utils/jwt'
import databaseService from './database.services'
import { ObjectId } from 'bson'
import { USERS_MESSAGES } from '../constants/messages'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import axios from 'axios'
import { config } from 'dotenv'
import { generateVerificationCode, sendVerificationCode, setupVerificationExpiration, sendPasswordResetLink } from '../utils/sendmail'
import { envConfig } from '../constants/config'
import valkeyService from './valkey.services'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PROMPT_CHAT } from '../constants/prompt'
import { extractContentAndInsertToDB } from '../utils/utils'
import tempRegisterService from './temp-register.services'

config()
class UserService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        user_type: TokenType.AccessToken,
        verify
      },
      privateKey: envConfig.privateKey_access_token as string,
      optional: {
        expiresIn: envConfig.expiresIn_access_token
      }
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        user_type: TokenType.RefreshToken,
        verify
      },
      privateKey: envConfig.privateKey_refresh_token as string,

      optional: {
        expiresIn: envConfig.expiresIn_refresh_token
      }
    })
  }
  private forgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        user_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: envConfig.secretOnPublicKey_Forgot as string,

      optional: {
        expiresIn: envConfig.expiresIn_forgot_token
      }
    })
  }
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        user_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: envConfig.secretOnPublicKey_Email as string,

      optional: {
        expiresIn: envConfig.expiresIn_email_token
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async verifyRegistrationCode(email: string, code: string) {
    // Kiểm tra code có đúng và còn hạn không
    const isValid = tempRegisterService.verifyCode(email, code)

    if (!isValid) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.VERIFICATION_CODE_INVALID_OR_EXPIRED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Lấy dữ liệu đăng ký đã lưu tạm
    const registrationData = tempRegisterService.getVerifiedRegistrationData(email)

    if (!registrationData) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.VERIFICATION_DATA_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Tạo ID người dùng mới
    const user_id = new ObjectId()

    // Lưu thông tin người dùng vào database
    await databaseService.users.insertOne(
      new User({
        ...registrationData,
        _id: user_id,
        role: UserRole.Customer,
        password: hashPassword(registrationData.password),
        verify: UserVerifyStatus.Verified, // Đánh dấu đã xác thực
        date_of_birth: registrationData.date_of_birth ? new Date(registrationData.date_of_birth) : null,
        verify_code_expires_at: null,
        email_verify_code: ''
      })
    )

    // Xóa dữ liệu đăng ký tạm thời
    tempRegisterService.removePendingRegistration(email)

    // Tạo token cho người dùng
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Verified
    })

    // Lưu refresh token
    await databaseService.refreshToken.insertOne({
      user_id: new ObjectId(user_id),
      token: refresh_token,
      created_at: new Date()
    })

    return {
      access_token,
      refresh_token,
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Verified
    }
  }

  async checkRegistrationStatus(email: string) {
    // Kiểm tra trạng thái đăng ký
    const pendingRegistration = tempRegisterService.getPendingRegistration(email)

    if (!pendingRegistration) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.VERIFICATION_DATA_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra hết hạn
    const isExpired = tempRegisterService.isRegistrationExpired(email)
    const timeRemaining = tempRegisterService.getExpirationTimeRemaining(email)

    return {
      email,
      is_expired: isExpired,
      time_remaining_seconds: timeRemaining
    }
  }
  async register(payload: RegisterReqBody) {
    // Kiểm tra email đã tồn tại chưa
    const emailExists = await this.checkUsersExists(payload.email)
    if (emailExists) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY
      })
    }

    // Tạo mã xác thực 6 chữ số
    const verificationCode = generateVerificationCode()

    // Lưu thông tin đăng ký vào bộ nhớ tạm thời
    tempRegisterService.storePendingRegistration(
      payload.email,
      {
        ...payload,
        role: UserRole.Customer,
        address: payload.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        phone: payload.phone || ''
      },
      verificationCode
    )

    // Gửi mã xác thực qua email
    const emailSent = await sendVerificationCode(payload.email, verificationCode)

    if (!emailSent) {
      console.error(`Failed to send verification email to ${payload.email}`)
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_VERIFICATION_FAILED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    return {
      message: USERS_MESSAGES.VERIFICATION_CODE_SENT,
      email: payload.email
    }
  }
  async refreshToken(user_id: string, verify: UserVerifyStatus, refresh_token: string) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify })
    ])

    await valkeyService.deleteRefreshToken(refresh_token)

    const expiryInSeconds = envConfig.token_expiry_seconds || 604800
    await valkeyService.storeRefreshToken(user_id, new_refresh_token, expiryInSeconds)

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
  async checkUsersExists(email: string) {
    const result = await databaseService.users.findOne({
      email: email
    })
    return Boolean(result)
  }
  private async getOauthGoogleToken(code: string) {
    const body = new URLSearchParams({
      code,
      client_id: envConfig.client_id!,
      client_secret: envConfig.client_secret!,
      redirect_uri: envConfig.redirect_uri!,
      grant_type: 'authorization_code'
    })

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      family_name: string
      picture: string
    }
  }
  async oauth(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne({ email: userInfo.email })
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify as UserVerifyStatus
      })

      const expiryInSeconds = envConfig.token_expiry_seconds || 604800
      await valkeyService.storeRefreshToken(user._id.toString(), refresh_token, expiryInSeconds)

      return {
        access_token,
        newUser: 0,
        verify: user.verify
      }
    } else {
      const password = crypto.randomUUID()
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password,
        role: UserRole.Customer
      })
      return {
        ...data,
        newUser: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: verify
    })

    await databaseService.refreshToken.insertOne({
      _id: new ObjectId(),
      user_id: new ObjectId(user_id),
      token: refresh_token,
      created_at: new Date()
    })

    return access_token
  }
  async logout(refresh_token: string) {
    await valkeyService.deleteRefreshToken(refresh_token)

    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }
  async verifyEmailWithCode(email: string, code: string) {
    // Tìm user theo email và mã xác thực
    const user = await databaseService.users.findOne({
      email,
      email_verify_code: code
    })

    if (!user) {
      throw new ErrorWithStatus({
        message: 'Invalid verification code',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Kiểm tra mã có hết hạn chưa
    if (user.verify_code_expires_at && user.verify_code_expires_at < new Date()) {
      throw new ErrorWithStatus({
        message: 'Verification code has expired',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Cập nhật user thành đã xác thực
    await databaseService.users.updateOne(
      { _id: user._id },
      {
        $set: {
          email_verify_code: '',
          verify_code_expires_at: null,
          verify: UserVerifyStatus.Verified
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    // Tạo token để đăng nhập
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user._id.toString(),
      verify: UserVerifyStatus.Verified
    })

    // Lưu refresh token
    const expiryInSeconds = envConfig.token_expiry_seconds || 604800
    await valkeyService.storeRefreshToken(user._id.toString(), refresh_token, expiryInSeconds)

    return {
      access_token,
      refresh_token
    }
  }
  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token: '',
          verify: UserVerifyStatus.Verified
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })

    const expiryInSeconds = envConfig.token_expiry_seconds || 604800
    await valkeyService.storeRefreshToken(user_id, refresh_token, expiryInSeconds)

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    // Tạo mã xác thực mới
    const verificationCode = generateVerificationCode()

    // Tính thời gian hết hạn mới (2 phút từ hiện tại)
    const expirationTime = new Date(Date.now() + 2 * 60 * 1000)

    // Lấy thông tin user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Cập nhật mã xác thực mới
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_code: verificationCode,
          verify_code_expires_at: expirationTime
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    // Gửi mã mới qua email
    const emailSent = await sendVerificationCode(user.email, verificationCode)

    if (!emailSent) {
      console.error(`Failed to resend verification email to ${user.email}`)
      throw new ErrorWithStatus({
        message: 'Failed to send verification email',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    // Thiết lập hẹn giờ xóa mã xác thực mới khi hết hạn
    setupVerificationExpiration(user_id, expirationTime)

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.forgotPasswordToken({ user_id, verify: verify })
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    // Gửi email với link reset password
    const emailSent = await sendPasswordResetLink(user.email, forgot_password_token)
    
    if (!emailSent) {
      console.error(`Failed to send password reset email to ${user.email}`)
      throw new ErrorWithStatus({
        message: 'Failed to send password reset email',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }
  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return user
  }
  async getProfileByUserName(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }
  async getProfileByUserId(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async searchUsersByName(name: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit
      // Tìm kiếm người dùng với name khớp (không phân biệt hoa thường)
      const users = await databaseService.users
        .find(
          {
            name: { $regex: name, $options: 'i' } // Tìm kiếm không phân biệt hoa thường
          },
          {
            projection: {
              _id: 1,
              name: 1,
              username: 1,
              email: 1,
              avatar: 1
            }
          }
        )
        .skip(skip)
        .limit(limit)
        .toArray()

      // Đếm tổng số người dùng khớp với tìm kiếm
      const totalUsers = await databaseService.users.countDocuments({
        name: { $regex: name, $options: 'i' }
      })

      return {
        users,
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      return { users: [], total: 0, page, limit, totalPages: 0 }
    }
  }

  async changePassword(user_id: string, new_password: string) {
    const changePassword = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return changePassword
  }
  async chatWithGemini(count: number) {
    const apiKey = process.env.GERMINI_API_KEY
    const genAI = new GoogleGenerativeAI(apiKey as string)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(PROMPT_CHAT(count))

    const response = await result.response
    const aiResponseText = response.text()

    return await extractContentAndInsertToDB(aiResponseText)
  }
  async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit
    const users = await databaseService.users
      .find(
        {},
        {
          projection: {
            _id: 1,
            name: 1,
            username: 1,
            email: 1,
            avatar: 1
          }
        }
      )
      .skip(skip)
      .limit(limit)
      .toArray()

    const totalUsers = await databaseService.users.countDocuments({})

    return {
      users,
      total: totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit)
    }
  }
}

const usersService = new UserService()
export default usersService
