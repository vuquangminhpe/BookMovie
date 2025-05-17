// src/utils/sendmail.ts
import { Resend } from 'resend'
import { config } from 'dotenv'
import { envConfig } from '../constants/config'
import databaseService from '../services/database.services'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '../constants/enums'
import { Server } from 'socket.io'

config()

// Khởi tạo Resend với API key
const resendApiKey = process.env.RESEND_API_KEY
const resend = new Resend(resendApiKey)

// Kiểm tra API key
if (!resendApiKey) {
  console.error('❌ RESEND_API_KEY chưa được cấu hình. Vui lòng thêm API key vào file .env hoặc config.')
}

// Địa chỉ email người gửi

// Tạo mã xác thực ngẫu nhiên 6 chữ số
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hàm gửi email cơ bản bằng Resend
export const sendEmail = async (
  toAddress: string,
  subject: string,
  htmlBody: string,
  textBody: string = ''
): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: toAddress,
      subject: subject,
      html: htmlBody,
      text: textBody || htmlBody.replace(/<[^>]*>/g, '')
    })

    if (error) {
      console.error('❌ Lỗi gửi email:', error)
      return false
    }

    console.log('✅ Email gửi thành công:', data?.id)
    return true
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error)
    return false
  }
}

// Template HTML cho mã xác thực
const verificationCodeTemplate = `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f5f7fb;
        color: #333;
        line-height: 1.6;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eaeaea;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #4b7bec;
        margin-bottom: 10px;
      }

      .content {
        padding: 30px 20px;
      }

      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
      }

      .verification-code {
        text-align: center;
        font-size: 32px;
        letter-spacing: 5px;
        font-weight: bold;
        color: #4b7bec;
        margin: 30px 0;
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 4px;
        border: 1px dashed #dee2e6;
      }

      .timer {
        text-align: center;
        color: #e74c3c;
        font-weight: bold;
        margin: 20px 0;
      }

      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eaeaea;
        color: #6c757d;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Your App Name</div>
        <h2>Email Verification</h2>
      </div>

      <div class="content">
        <h3 class="greeting">Hello {{name}},</h3>
        <p>Thank you for registering. To complete your registration, please use the verification code below:</p>
        
        <div class="verification-code">{{code}}</div>
        
        <div class="timer">This code will expire in 2 minutes.</div>
        
        <p>If you did not request this verification, please ignore this email.</p>
      </div>

      <div class="footer">
        <p>© 2025 Your App Name. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`

// Gửi mã xác thực đến email người dùng
export const sendVerificationCode = async (toAddress: string, code: string): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'User'
  const subject = 'Your Verification Code'

  const htmlBody = verificationCodeTemplate.replace('{{name}}', name).replace('{{code}}', code)

  return await sendEmail(toAddress, subject, htmlBody)
}

// Server-side check only for code expiration, no socket events needed

// Xử lý hết hạn mã xác thực - Server side only
export const setupVerificationExpiration = (user_id: string, expirationTime: Date) => {
  const timeUntilExpiration = expirationTime.getTime() - Date.now()

  if (timeUntilExpiration <= 0) return

  setTimeout(async () => {
    // Kiểm tra nếu người dùng vẫn chưa xác thực
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })

    if (user && user.verify === UserVerifyStatus.Unverified) {
      // Xóa hoặc vô hiệu hóa mã xác thực
      await databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_code: '',
            verify_code_expires_at: null
          }
        }
      )

      console.log(`Verification code for user ${user_id} has expired and been invalidated`)
    }
  }, timeUntilExpiration)
}

// Hàm gửi mã đặt lại mật khẩu
export const sendPasswordResetCode = async (toAddress: string, code: string): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'User'
  const subject = 'Password Reset Code'

  const htmlBody = verificationCodeTemplate
    .replace('{{name}}', name)
    .replace('{{code}}', code)
    .replace('Email Verification', 'Password Reset')
    .replace('To complete your registration', 'To reset your password')

  return await sendEmail(toAddress, subject, htmlBody)
}

// Xác minh kết nối Resend
export const verifyResendConnection = async (): Promise<boolean> => {
  try {
    // Kiểm tra API key bằng cách gửi email đến địa chỉ không tồn tại
    // Sẽ kích hoạt lỗi nhưng vẫn có thể xác minh kết nối
    await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: 'verify@example.com',
      subject: 'API Connection Test',
      html: '<p>This is a test email to verify API connectivity.</p>'
    })
    console.log('✅ Kết nối Resend API thành công')
    return true
  } catch (error: any) {
    // Kiểm tra xem lỗi có phải do API key không hợp lệ
    if (error?.statusCode === 401) {
      console.error('❌ API key không hợp lệ. Vui lòng kiểm tra lại.')
      return false
    }

    // Nếu lỗi khác (ví dụ: email không hợp lệ) nhưng API key hợp lệ
    if (error?.statusCode === 422) {
      console.log('✅ API key hợp lệ, nhưng địa chỉ email thử nghiệm không hợp lệ.')
      return true
    }

    console.error('❌ Lỗi kết nối Resend API:', error)
    return false
  }
}

// Kiểm tra kết nối khi import module
verifyResendConnection().catch((err) => {
  console.error('❌ Lỗi xác minh kết nối Resend:', err)
})
