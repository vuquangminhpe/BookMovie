import { ObjectId } from 'mongodb'

interface CouponUsageType {
  _id?: ObjectId
  user_id: ObjectId
  coupon_id: ObjectId
  booking_id: ObjectId
  discount_amount: number
  used_at?: Date
  created_at?: Date
  updated_at?: Date
}

export default class CouponUsage {
  _id?: ObjectId
  user_id: ObjectId
  coupon_id: ObjectId
  booking_id: ObjectId
  discount_amount: number
  used_at: Date
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    user_id,
    coupon_id,
    booking_id,
    discount_amount,
    used_at,
    created_at,
    updated_at
  }: CouponUsageType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.coupon_id = coupon_id
    this.booking_id = booking_id
    this.discount_amount = discount_amount
    this.used_at = used_at || date
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
