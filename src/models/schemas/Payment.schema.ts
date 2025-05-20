import { ObjectId } from 'mongodb'
import { PaymentStatus } from './Booking.schema'

interface PaymentType {
  _id?: ObjectId
  booking_id: ObjectId
  user_id: ObjectId
  amount: number
  payment_method: PaymentMethod
  transaction_id?: string
  order_id?: string
  bank_code?: string
  card_type?: string
  payment_time?: Date
  status: PaymentStatus
  admin_note?: string
  error?: string
  payment_url?: string
  created_at?: Date
  updated_at?: Date
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  NET_BANKING = 'net_banking',
  UPI = 'upi',
  WALLET = 'wallet',
  CASH = 'cash',
  VNPAY = 'vnpay'
}

export default class Payment {
  _id?: ObjectId
  booking_id: ObjectId
  user_id: ObjectId
  amount: number
  payment_method: PaymentMethod
  transaction_id: string
  order_id: string
  bank_code: string
  card_type: string
  payment_time: Date
  status: PaymentStatus
  admin_note: string
  error: string
  payment_url: string
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    booking_id,
    user_id,
    amount,
    payment_method,
    transaction_id,
    order_id,
    bank_code,
    card_type,
    payment_time,
    status,
    admin_note,
    error,
    payment_url,
    created_at,
    updated_at
  }: PaymentType) {
    const date = new Date()
    this._id = _id
    this.booking_id = booking_id
    this.user_id = user_id
    this.amount = amount
    this.payment_method = payment_method
    this.transaction_id = transaction_id || ''
    this.order_id = order_id || ''
    this.bank_code = bank_code || ''
    this.card_type = card_type || ''
    this.payment_time = payment_time || date
    this.status = status || PaymentStatus.PENDING
    this.admin_note = admin_note || ''
    this.error = error || ''
    this.payment_url = payment_url || ''
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
