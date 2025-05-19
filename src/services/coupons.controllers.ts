import { ObjectId } from 'mongodb'
import Coupon, { CouponApplicableTo, CouponStatus, CouponTypes } from '../models/schemas/Coupon.schema'
import CouponUsage from '../models/schemas/CouponUsage.schema'
import databaseService from './database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { COUPON_MESSAGES } from '../constants/messages'

class CouponService {
  async createCoupon(payload: {
    code: string
    description: string
    type: CouponTypes
    value: number
    min_purchase?: number
    max_discount?: number
    start_date: string
    end_date: string
    status?: CouponStatus
    usage_limit?: number
    applicable_to?: CouponApplicableTo
    applicable_ids?: string[]
  }) {
    // Validate coupon code uniqueness
    const existingCoupon = await databaseService.coupons.findOne({ code: payload.code.toUpperCase() })
    if (existingCoupon) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_CODE_ALREADY_EXISTS,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Validate date range
    const startDate = new Date(payload.start_date)
    const endDate = new Date(payload.end_date)

    if (endDate <= startDate) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.INVALID_DATE_RANGE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Validate coupon value based on type
    if (payload.type === CouponTypes.PERCENTAGE && (payload.value <= 0 || payload.value > 100)) {
      throw new ErrorWithStatus({
        message: 'Percentage value must be between 1 and 100',
        status: HTTP_STATUS.BAD_REQUEST
      })
    } else if (payload.type === CouponTypes.FIXED_AMOUNT && payload.value <= 0) {
      throw new ErrorWithStatus({
        message: 'Fixed amount must be greater than 0',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Convert applicable_ids to ObjectIds if provided
    let applicableIds: ObjectId[] = []
    if (payload.applicable_ids && payload.applicable_ids.length > 0) {
      applicableIds = payload.applicable_ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))

      // Validate applicable_ids based on applicable_to
      if (payload.applicable_to === CouponApplicableTo.MOVIE) {
        // Check if all movie IDs exist
        const movieCount = await databaseService.movies.countDocuments({
          _id: { $in: applicableIds }
        })

        if (movieCount !== applicableIds.length) {
          throw new ErrorWithStatus({
            message: 'One or more movie IDs are invalid',
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      } else if (payload.applicable_to === CouponApplicableTo.THEATER) {
        // Check if all theater IDs exist
        const theaterCount = await databaseService.theaters.countDocuments({
          _id: { $in: applicableIds }
        })

        if (theaterCount !== applicableIds.length) {
          throw new ErrorWithStatus({
            message: 'One or more theater IDs are invalid',
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      }
    }

    const coupon_id = new ObjectId()

    await databaseService.coupons.insertOne(
      new Coupon({
        _id: coupon_id,
        code: payload.code.toUpperCase(),
        description: payload.description,
        type: payload.type,
        value: payload.value,
        min_purchase: payload.min_purchase,
        max_discount: payload.max_discount,
        start_date: startDate,
        end_date: endDate,
        status: payload.status || CouponStatus.ACTIVE,
        usage_limit: payload.usage_limit,
        usage_count: 0,
        applicable_to: payload.applicable_to || CouponApplicableTo.ALL,
        applicable_ids: applicableIds
      })
    )

    return { coupon_id: coupon_id.toString() }
  }

  async getCoupons(query: {
    page?: string
    limit?: string
    status?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    active_only?: string
  }) {
    const {
      page = '1',
      limit = '10',
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      active_only = 'false'
    } = query

    const filter: any = {}

    // Filter by status
    if (status && Object.values(CouponStatus).includes(status as CouponStatus)) {
      filter.status = status
    }

    // Filter for active coupons only
    if (active_only === 'true') {
      const now = new Date()
      filter.status = CouponStatus.ACTIVE
      filter.start_date = { $lte: now }
      filter.end_date = { $gte: now }

      filter.$or = [{ usage_limit: 0 }, { $expr: { $gt: ['$usage_limit', '$usage_count'] } }]
    }

    // Search in code and description
    if (search) {
      filter.$or = [{ code: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count
    const totalCoupons = await databaseService.coupons.countDocuments(filter)

    // Get coupons with pagination
    const coupons = await databaseService.coupons.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    return {
      coupons,
      total: totalCoupons,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalCoupons / limitNum)
    }
  }

  async getCouponById(coupon_id: string) {
    if (!ObjectId.isValid(coupon_id)) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.INVALID_COUPON_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const coupon = await databaseService.coupons.findOne({ _id: new ObjectId(coupon_id) })

    if (!coupon) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return coupon
  }

  async getCouponByCode(code: string) {
    const coupon = await databaseService.coupons.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return coupon
  }

  async updateCoupon(
    coupon_id: string,
    payload: {
      description?: string
      type?: CouponTypes
      value?: number
      min_purchase?: number
      max_discount?: number
      start_date?: string
      end_date?: string
      status?: CouponStatus
      usage_limit?: number
      applicable_to?: CouponApplicableTo
      applicable_ids?: string[]
    }
  ) {
    if (!ObjectId.isValid(coupon_id)) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.INVALID_COUPON_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const coupon = await databaseService.coupons.findOne({ _id: new ObjectId(coupon_id) })

    if (!coupon) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updateData: any = {}

    if (payload.description !== undefined) updateData.description = payload.description

    if (payload.type !== undefined) {
      // Validate coupon type
      if (!Object.values(CouponTypes).includes(payload.type)) {
        throw new ErrorWithStatus({
          message: COUPON_MESSAGES.INVALID_COUPON_TYPE,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      updateData.type = payload.type
    }

    if (payload.value !== undefined) {
      // Validate value based on type
      const type = payload.type || coupon.type

      if (type === CouponTypes.PERCENTAGE && (payload.value <= 0 || payload.value > 100)) {
        throw new ErrorWithStatus({
          message: 'Percentage value must be between 1 and 100',
          status: HTTP_STATUS.BAD_REQUEST
        })
      } else if (type === CouponTypes.FIXED_AMOUNT && payload.value <= 0) {
        throw new ErrorWithStatus({
          message: 'Fixed amount must be greater than 0',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      updateData.value = payload.value
    }

    if (payload.min_purchase !== undefined) updateData.min_purchase = payload.min_purchase
    if (payload.max_discount !== undefined) updateData.max_discount = payload.max_discount

    // Handle date updates
    let startDate = coupon.start_date
    let endDate = coupon.end_date

    if (payload.start_date) {
      startDate = new Date(payload.start_date)
      updateData.start_date = startDate
    }

    if (payload.end_date) {
      endDate = new Date(payload.end_date)
      updateData.end_date = endDate
    }

    // Validate date range
    if (endDate <= startDate) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.INVALID_DATE_RANGE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (payload.status !== undefined) {
      // Validate status
      if (!Object.values(CouponStatus).includes(payload.status)) {
        throw new ErrorWithStatus({
          message: COUPON_MESSAGES.INVALID_COUPON_STATUS,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      updateData.status = payload.status
    }

    if (payload.usage_limit !== undefined) updateData.usage_limit = payload.usage_limit

    if (payload.applicable_to !== undefined) {
      // Validate applicable_to
      if (!Object.values(CouponApplicableTo).includes(payload.applicable_to)) {
        throw new ErrorWithStatus({
          message: 'Invalid applicable_to value',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      updateData.applicable_to = payload.applicable_to
    }

    // Handle applicable_ids
    if (payload.applicable_ids !== undefined) {
      const applicableIds = payload.applicable_ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))

      const applicableTo = payload.applicable_to || coupon.applicable_to

      // Validate applicable_ids based on applicable_to
      if (applicableTo === CouponApplicableTo.MOVIE && applicableIds.length > 0) {
        // Check if all movie IDs exist
        const movieCount = await databaseService.movies.countDocuments({
          _id: { $in: applicableIds }
        })

        if (movieCount !== applicableIds.length) {
          throw new ErrorWithStatus({
            message: 'One or more movie IDs are invalid',
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      } else if (applicableTo === CouponApplicableTo.THEATER && applicableIds.length > 0) {
        // Check if all theater IDs exist
        const theaterCount = await databaseService.theaters.countDocuments({
          _id: { $in: applicableIds }
        })

        if (theaterCount !== applicableIds.length) {
          throw new ErrorWithStatus({
            message: 'One or more theater IDs are invalid',
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
      }

      updateData.applicable_ids = applicableIds
    }

    // Update coupon
    await databaseService.coupons.updateOne(
      { _id: new ObjectId(coupon_id) },
      {
        $set: updateData,
        $currentDate: { updated_at: true }
      }
    )

    return { coupon_id }
  }

  async deleteCoupon(coupon_id: string) {
    if (!ObjectId.isValid(coupon_id)) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.INVALID_COUPON_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const coupon = await databaseService.coupons.findOne({ _id: new ObjectId(coupon_id) })

    if (!coupon) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if coupon has been used
    const usageCount = await databaseService.couponUsages.countDocuments({ coupon_id: new ObjectId(coupon_id) })

    if (usageCount > 0) {
      // If coupon has been used, just mark it as inactive
      await databaseService.coupons.updateOne(
        { _id: new ObjectId(coupon_id) },
        {
          $set: { status: CouponStatus.INACTIVE },
          $currentDate: { updated_at: true }
        }
      )
    } else {
      // If coupon has not been used, delete it
      await databaseService.coupons.deleteOne({ _id: new ObjectId(coupon_id) })
    }

    return { coupon_id }
  }

  async validateCoupon(
    code: string,
    user_id: string,
    booking_data: {
      movie_id: string
      theater_id: string
      total_amount: number
    }
  ) {
    // Get coupon by code
    const coupon = await databaseService.coupons.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if coupon is active
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_INACTIVE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check date validity
    const now = new Date()

    if (now < coupon.start_date) {
      throw new ErrorWithStatus({
        message: 'Coupon is not yet active',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (now > coupon.end_date) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_EXPIRED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check usage limit
    if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_USAGE_LIMIT_REACHED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if user has already used this coupon
    const userUsage = await databaseService.couponUsages.findOne({
      user_id: new ObjectId(user_id),
      coupon_id: coupon._id
    })

    if (userUsage) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_ALREADY_USED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check minimum purchase
    if (coupon.min_purchase > 0 && booking_data.total_amount < coupon.min_purchase) {
      throw new ErrorWithStatus({
        message: `${COUPON_MESSAGES.COUPON_MIN_PURCHASE_NOT_MET} (Min: ${coupon.min_purchase})`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check applicable_to constraints
    if (coupon.applicable_to === CouponApplicableTo.MOVIE && coupon.applicable_ids.length > 0) {
      const movieId = new ObjectId(booking_data.movie_id)

      if (!coupon.applicable_ids.some((id) => id.equals(movieId))) {
        throw new ErrorWithStatus({
          message: COUPON_MESSAGES.COUPON_NOT_APPLICABLE,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    } else if (coupon.applicable_to === CouponApplicableTo.THEATER && coupon.applicable_ids.length > 0) {
      const theaterId = new ObjectId(booking_data.theater_id)

      if (!coupon.applicable_ids.some((id) => id.equals(theaterId))) {
        throw new ErrorWithStatus({
          message: COUPON_MESSAGES.COUPON_NOT_APPLICABLE,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Calculate discount
    let discountAmount = 0

    if (coupon.type === CouponTypes.PERCENTAGE) {
      discountAmount = (booking_data.total_amount * coupon.value) / 100

      // Apply max_discount if set
      if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount
      }
    } else if (coupon.type === CouponTypes.FIXED_AMOUNT) {
      discountAmount = coupon.value

      // Cap discount at total amount
      if (discountAmount > booking_data.total_amount) {
        discountAmount = booking_data.total_amount
      }
    }

    return {
      coupon,
      discount_amount: Math.floor(discountAmount) // Round down to avoid fractions
    }
  }

  async applyCoupon(code: string, user_id: string, booking_id: string, discount_amount: number) {
    // Get coupon by code
    const coupon = await databaseService.coupons.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      throw new ErrorWithStatus({
        message: COUPON_MESSAGES.COUPON_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Create usage record
    const usage_id = new ObjectId()

    await databaseService.couponUsages.insertOne(
      new CouponUsage({
        _id: usage_id,
        user_id: new ObjectId(user_id),
        coupon_id: coupon._id,
        booking_id: new ObjectId(booking_id),
        discount_amount
      })
    )

    // Increment usage count
    await databaseService.coupons.updateOne(
      { _id: coupon._id },
      {
        $inc: { usage_count: 1 },
        $currentDate: { updated_at: true }
      }
    )

    return {
      coupon_code: coupon.code,
      discount_amount
    }
  }

  async getUserCoupons(user_id: string) {
    if (!ObjectId.isValid(user_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid user ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get valid coupons
    const now = new Date()

    const coupons = await databaseService.coupons
      .find({
        status: CouponStatus.ACTIVE,
        start_date: { $lte: now },
        end_date: { $gte: now },
        $or: [
          { usage_limit: 0 }, // No limit
          { $expr: { $gt: ['$usage_limit', '$usage_count'] } } // Has not reached limit
        ]
      })
      .toArray()

    // Get user's coupon usage
    const userUsages = await databaseService.couponUsages
      .find({
        user_id: new ObjectId(user_id)
      })
      .toArray()

    const usedCouponIds = userUsages.map((usage) => usage.coupon_id.toString())

    // Filter out coupons that user has already used
    const availableCoupons = coupons.filter((coupon) => !usedCouponIds.includes(coupon._id!.toString()))

    return availableCoupons
  }
}

const couponService = new CouponService()
export default couponService
