import { Server as SocketServer } from 'socket.io'
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import couponService from './coupons.services'
import CouponUsage from '../models/schemas/CouponUsage.schema'
import { CouponApplicableTo, CouponStatus, CouponTypes } from '../models/schemas/Coupon.schema'
import { emitToSpecificUser } from '../utils/socket-handlers'

class CouponSocketService {
  private io: SocketServer | null = null

  setSocketIO(io: SocketServer) {
    this.io = io
  }

  async calculateUserBookingTotal(userId: string): Promise<number> {
    const userObjectId = new ObjectId(userId)

    // Calculate total booking amount for completed bookings
    const pipeline = [
      {
        $match: {
          user_id: userObjectId,
          status: 'completed',
          payment_status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total_amount: { $sum: '$total_amount' }
        }
      }
    ]

    const result = await databaseService.bookings.aggregate(pipeline).toArray()
    return result.length > 0 ? result[0].total_amount : 0
  }

  async getEligibleCoupons(totalBookingAmount: number) {
    const coupons = []

    // Define coupon tiers based on booking total
    if (totalBookingAmount >= 100000) {
      // Users with total bookings >= 100,000 get 15,000-30,000 discount
      coupons.push({
        code: 'GOLD_USER_15K',
        description: 'Gold User Discount - 15,000 VND',
        type: CouponTypes.FIXED_AMOUNT,
        value: 15000,
        min_purchase: 50000,
        max_discount: 15000
      })

      coupons.push({
        code: 'GOLD_USER_20K',
        description: 'Gold User Discount - 20,000 VND',
        type: CouponTypes.FIXED_AMOUNT,
        value: 20000,
        min_purchase: 75000,
        max_discount: 20000
      })

      coupons.push({
        code: 'GOLD_USER_30K',
        description: 'Gold User Premium Discount - 30,000 VND',
        type: CouponTypes.FIXED_AMOUNT,
        value: 30000,
        min_purchase: 100000,
        max_discount: 30000
      })
    }

    if (totalBookingAmount >= 200000) {
      // Users with total bookings >= 200,000 get additional percentage discount
      coupons.push({
        code: 'PLATINUM_USER_20PCT',
        description: 'Platinum User - 20% Off (Max 50,000 VND)',
        type: CouponTypes.PERCENTAGE,
        value: 20,
        min_purchase: 100000,
        max_discount: 50000
      })
    }

    if (totalBookingAmount >= 500000) {
      // Users with total bookings >= 500,000 get VIP discount
      coupons.push({
        code: 'VIP_USER_50K',
        description: 'VIP User Exclusive - 50,000 VND',
        type: CouponTypes.FIXED_AMOUNT,
        value: 50000,
        min_purchase: 150000,
        max_discount: 50000
      })

      coupons.push({
        code: 'VIP_USER_25PCT',
        description: 'VIP User - 25% Off (Max 100,000 VND)',
        type: CouponTypes.PERCENTAGE,
        value: 25,
        min_purchase: 200000,
        max_discount: 100000
      })
    }

    return coupons
  }

  async createAutoAssignedCoupons(userId: string, totalBookingAmount: number) {
    const eligibleCoupons = await this.getEligibleCoupons(totalBookingAmount)
    const createdCoupons = []

    for (const couponData of eligibleCoupons) {
      try {
        // Check if coupon already exists
        const existingCoupon = await databaseService.coupons.findOne({
          code: couponData.code
        })

        let couponId: ObjectId

        if (!existingCoupon) {
          // Create new coupon
          const now = new Date()
          const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

          couponId = new ObjectId()

          await databaseService.coupons.insertOne({
            _id: couponId,
            code: couponData.code,
            description: couponData.description,
            type: couponData.type,
            value: couponData.value,
            min_purchase: couponData.min_purchase,
            max_discount: couponData.max_discount,
            start_date: now,
            end_date: endDate,
            status: CouponStatus.ACTIVE,
            usage_limit: 0, // No usage limit for auto-assigned coupons
            usage_count: 0,
            applicable_to: CouponApplicableTo.ALL,
            applicable_ids: [],
            created_at: now,
            updated_at: now
          })
        } else {
          couponId = existingCoupon._id
        }

        // Check if user already has this coupon
        const existingUsage = await databaseService.couponUsages.findOne({
          user_id: new ObjectId(userId),
          coupon_id: couponId
        })

        if (!existingUsage) {
          // Auto-assign coupon to user with a usage entry (but not used yet)
          // For auto-assigned coupons, we create a special record without booking_id
          await databaseService.couponUsages.insertOne({
            user_id: new ObjectId(userId),
            coupon_id: couponId,
            booking_id: null, // Will be set when coupon is actually used
            discount_amount: couponData.value,
            used_at: null, // Not used yet
            created_at: new Date(),
            updated_at: new Date()
          })

          createdCoupons.push({
            coupon_id: couponId,
            code: couponData.code,
            description: couponData.description,
            discount_amount: couponData.value,
            type: couponData.type
          })
        }
      } catch (error) {
        console.error(`Error creating coupon ${couponData.code}:`, error)
      }
    }

    return createdCoupons
  }

  async checkAndAssignCoupons(userId: string, newBookingAmount: number) {
    try {
      const totalBookingAmount = await this.calculateUserBookingTotal(userId)

      // Check if user crossed any threshold
      const previousTotal = totalBookingAmount - newBookingAmount
      const assignedCoupons = await this.createAutoAssignedCoupons(userId, totalBookingAmount)

      if (assignedCoupons.length > 0 && this.io) {
        // Emit real-time notification to user
        emitToSpecificUser(this.io, userId, 'coupons_assigned', {
          message: `Congratulations! You've earned ${assignedCoupons.length} new coupon(s)!`,
          coupons: assignedCoupons,
          total_booking_amount: totalBookingAmount,
          previous_total: previousTotal,
          timestamp: new Date().toISOString()
        })

        // Also emit to admin room for monitoring
        this.io.to('admin_room').emit('user_coupons_assigned', {
          user_id: userId,
          coupons: assignedCoupons,
          total_booking_amount: totalBookingAmount,
          timestamp: new Date().toISOString()
        })
      }

      return assignedCoupons
    } catch (error) {
      console.error('Error in checkAndAssignCoupons:', error)
      return []
    }
  }

  async getUserAvailableCoupons(userId: string) {
    try {
      const userObjectId = new ObjectId(userId)

      // Get all coupons assigned to user (including unused ones)
      const userCoupons = await databaseService.couponUsages
        .aggregate([
          {
            $match: {
              user_id: userObjectId,
              booking_id: null, // Only assigned but unused coupons
              used_at: null // Only unused coupons
            }
          },
          {
            $lookup: {
              from: 'coupons',
              localField: 'coupon_id',
              foreignField: '_id',
              as: 'coupon'
            }
          },
          {
            $unwind: '$coupon'
          },
          {
            $match: {
              'coupon.status': CouponStatus.ACTIVE,
              'coupon.end_date': { $gte: new Date() }
            }
          },
          {
            $project: {
              _id: 1,
              coupon_id: 1,
              discount_amount: 1,
              coupon: 1,
              created_at: 1
            }
          }
        ])
        .toArray()

      return userCoupons
    } catch (error) {
      console.error('Error getting user available coupons:', error)
      return []
    }
  }

  async markCouponAsUsed(userId: string, couponId: string, bookingId: string) {
    try {
      const result = await databaseService.couponUsages.updateOne(
        {
          user_id: new ObjectId(userId),
          coupon_id: new ObjectId(couponId),
          booking_id: null, // Find unused coupons (booking_id is null)
          used_at: null
        },
        {
          $set: {
            booking_id: new ObjectId(bookingId),
            used_at: new Date(),
            updated_at: new Date()
          }
        }
      )

      if (result.modifiedCount > 0 && this.io) {
        // Emit notification about coupon usage
        emitToSpecificUser(this.io, userId, 'coupon_used', {
          coupon_id: couponId,
          booking_id: bookingId,
          message: 'Coupon applied successfully!',
          timestamp: new Date().toISOString()
        })
      }

      return result.modifiedCount > 0
    } catch (error) {
      console.error('Error marking coupon as used:', error)
      return false
    }
  }

  async getCouponUsageStats(userId?: string) {
    try {
      const matchStage = userId ? { user_id: new ObjectId(userId) } : {}

      const stats = await databaseService.couponUsages
        .aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              total_coupons_assigned: { $sum: 1 },
              total_coupons_used: {
                $sum: {
                  $cond: [{ $ne: ['$used_at', null] }, 1, 0]
                }
              },
              total_discount_amount: {
                $sum: {
                  $cond: [{ $ne: ['$used_at', null] }, '$discount_amount', 0]
                }
              }
            }
          }
        ])
        .toArray()

      return stats.length > 0
        ? stats[0]
        : {
            total_coupons_assigned: 0,
            total_coupons_used: 0,
            total_discount_amount: 0
          }
    } catch (error) {
      console.error('Error getting coupon usage stats:', error)
      return {
        total_coupons_assigned: 0,
        total_coupons_used: 0,
        total_discount_amount: 0
      }
    }
  }
}

const couponSocketService = new CouponSocketService()
export default couponSocketService
