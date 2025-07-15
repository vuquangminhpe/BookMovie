import { ObjectId } from 'mongodb'
import databaseService from '../database.services'
import { BookingStatus, PaymentStatus } from '../../models/schemas/Booking.schema'

class TheaterAnalyticsService {
  async getTheaterRevenueAndCustomers(theater_id: string | ObjectId) {
    const theaterObjectId = new ObjectId(theater_id)


    const [revenueData, customerData] = await Promise.all([
      // Tính tổng doanh thu từ các booking đã hoàn thành và thanh toán
      databaseService.bookings
        .aggregate([
          {
            $match: {
              theater_id: theaterObjectId,
              // Match confirmed bookings with completed payment
              $or: [
                {
                  status: BookingStatus.CONFIRMED,
                  payment_status: PaymentStatus.COMPLETED
                },
                {
                  status: 'confirmed',
                  payment_status: 'completed'
                }
              ]
            }
          },
          {
            $group: {
              _id: null,
              total_revenue: { $sum: '$total_amount' },
              total_bookings: { $sum: 1 }
            }
          }
        ])
        .toArray(),

      // Đếm số lượng khách hàng unique đã đặt vé tại rạp này
      databaseService.bookings
        .aggregate([
          {
            $match: {
              theater_id: theaterObjectId,
              // Match confirmed bookings with completed payment
              $or: [
                {
                  status: BookingStatus.CONFIRMED,
                  payment_status: PaymentStatus.COMPLETED
                },
                {
                  status: 'confirmed',
                  payment_status: 'completed'
                }
              ]
            }
          },
          {
            $group: {
              _id: '$user_id'
            }
          },
          {
            $group: {
              _id: null,
              total_customers: { $sum: 1 }
            }
          }
        ])
        .toArray()
    ])

    return {
      theater_id: theater_id.toString(),
      total_revenue: revenueData[0]?.total_revenue || 0,
      total_bookings: revenueData[0]?.total_bookings || 0,
      total_customers: customerData[0]?.total_customers || 0
    }
  }

  async getAllTheatersRevenueAndCustomers() {
    const theaters = await databaseService.theaters.find({}).toArray()
    
    const results = await Promise.all(
      theaters.map(async (theater) => {
        const analytics = await this.getTheaterRevenueAndCustomers(theater._id!)
        return {
          theater_id: theater._id!.toString(),
          theater_name: theater.name,
          theater_location: theater.location,
          theater_city: theater.city,
          manager_id: theater.manager_id?.toString(),
          total_revenue: analytics.total_revenue,
          total_bookings: analytics.total_bookings,
          total_customers: analytics.total_customers
        }
      })
    )

    return results
  }

  async getMyTheaterAnalytics(user_id: string) {
    // Tìm theater mà user này quản lý
    const theater = await databaseService.theaters.findOne({
      manager_id: new ObjectId(user_id)
    })

    if (!theater) {
      throw new Error('No theater found for this user')
    }

    const analytics = await this.getTheaterRevenueAndCustomers(theater._id!)
    
    return {
      theater_info: {
        _id: theater._id!.toString(),
        name: theater.name,
        location: theater.location,
        city: theater.city,
        address: theater.address,
        status: theater.status
      },
      analytics: {
        total_revenue: analytics.total_revenue,
        total_bookings: analytics.total_bookings,
        total_customers: analytics.total_customers
      }
    }
  }
}

const theaterAnalyticsService = new TheaterAnalyticsService()
export default theaterAnalyticsService