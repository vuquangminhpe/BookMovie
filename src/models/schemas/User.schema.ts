import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '../../constants/enums'

export enum UserRole {
  Customer = 'customer',
  Staff = 'staff',
  Admin = 'admin'
}

export default class UserType {
  _id?: ObjectId
  password: string
  created_at?: Date
  updated_at?: Date
  email: string
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  role: UserRole
  email_verify_code?: string
  verify_code_expires_at: Date | null
  name?: string
  date_of_birth?: Date | null
  username?: string
  avatar?: string
  address?: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
  phone?: string

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id
    this.email = user.email
    this.password = user.password
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.role = user.role || UserRole.Customer
    this.date_of_birth = user.date_of_birth
    this.username = user.username || ''
    this.avatar = user.avatar || ''
    this.name = user.name || ''
    this.address = user.address || {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
    this.phone = user.phone || ''
    this.email_verify_code = user.email_verify_code || ''
    this.verify_code_expires_at = user.verify_code_expires_at || null
  }
}
