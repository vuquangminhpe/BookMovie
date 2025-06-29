import { ObjectId } from 'mongodb'

interface PartnerType {
  _id?: ObjectId
  name: string
  email: string
  phone: string
  company_name: string
  theater_id: ObjectId
  status: PartnerStatus
  created_at?: Date
  updated_at?: Date
}

export enum PartnerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export default class Partner {
  _id?: ObjectId
  name: string
  email: string
  phone: string
  company_name: string
  theater_id: ObjectId
  status: PartnerStatus
  created_at: Date
  updated_at: Date

  constructor({ _id, name, email, phone, company_name, theater_id, status, created_at, updated_at }: PartnerType) {
    const date = new Date()
    this._id = _id
    this.name = name
    this.email = email
    this.phone = phone
    this.company_name = company_name
    this.theater_id = theater_id
    this.status = status || PartnerStatus.ACTIVE
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
