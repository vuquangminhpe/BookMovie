import { ObjectId } from 'mongodb'

export enum CouponTypes {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount'
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired'
}

export enum CouponApplicableTo {
  ALL = 'all',
  MOVIE = 'movie',
  THEATER = 'theater'
}

interface CouponType {
  _id?: ObjectId
  code: string
  description: string
  type: CouponTypes
  value: number // Percentage or fixed amount
  min_purchase?: number
  max_discount?: number
  start_date: Date
  end_date: Date
  status: CouponStatus
  usage_limit?: number
  usage_count: number
  applicable_to: CouponApplicableTo
  applicable_ids?: ObjectId[] // Movie IDs or Theater IDs
  created_at?: Date
  updated_at?: Date
}

export default class Coupon {
  _id?: ObjectId
  code: string
  description: string
  type: CouponTypes
  value: number
  min_purchase: number
  max_discount: number
  start_date: Date
  end_date: Date
  status: CouponStatus
  usage_limit: number
  usage_count: number
  applicable_to: CouponApplicableTo
  applicable_ids: ObjectId[]
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    code,
    description,
    type,
    value,
    min_purchase,
    max_discount,
    start_date,
    end_date,
    status,
    usage_limit,
    usage_count,
    applicable_to,
    applicable_ids,
    created_at,
    updated_at
  }: CouponType) {
    const date = new Date()
    this._id = _id
    this.code = code
    this.description = description
    this.type = type
    this.value = value
    this.min_purchase = min_purchase || 0
    this.max_discount = max_discount || 0
    this.start_date = start_date
    this.end_date = end_date
    this.status = status || CouponStatus.INACTIVE
    this.usage_limit = usage_limit || 0
    this.usage_count = usage_count || 0
    this.applicable_to = applicable_to || CouponApplicableTo.ALL
    this.applicable_ids = applicable_ids || []
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
