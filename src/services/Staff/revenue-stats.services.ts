import { ObjectId } from 'mongodb'
import databaseService from '../database.services'
import { BookingStatus, PaymentStatus } from '../../models/schemas/Booking.schema'
import { RevenueStatsReqQuery, RevenueStatsResponse, RevenueStatsPaginatedResponse } from '../../models/request/Revenue.request'

class StaffRevenueStatsService {
  async getRevenueStats(staff_id: string, query: RevenueStatsReqQuery): Promise<RevenueStatsPaginatedResponse> {
    const staffObjectId = new ObjectId(staff_id)
    
    // Tìm các theater mà staff này quản lý
    const theaters = await databaseService.theaters.find({
      manager_id: staffObjectId
    }).toArray()

    if (theaters.length === 0) {
      return {
        data: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          items_per_page: parseInt(query.limit || '10'),
          has_next: false,
          has_prev: false
        },
        summary: {
          total_revenue: 0,
          total_bookings: 0,
          average_revenue_per_period: 0,
          period_type: query.period || 'day',
          date_range: {
            start: query.start_date || '',
            end: query.end_date || ''
          }
        }
      }
    }

    const theaterIds = theaters.map(theater => theater._id)
    
    // Xử lý tham số query
    const period = query.period || 'day'
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '10')
    const skip = (page - 1) * limit
    const sortBy = query.sort_by || 'date'
    const sortOrder = query.sort_order === 'asc' ? 1 : -1

    // Xử lý date range
    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (query.start_date && query.end_date) {
      startDate = new Date(query.start_date)
      endDate = new Date(query.end_date)
      endDate.setHours(23, 59, 59, 999) // End of day
    } else {
      // Default date range based on period
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          break
        case 'week':
          startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) // Last 12 weeks
          break
        case 'month':
          startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) // Last 12 months
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      startDate.setHours(0, 0, 0, 0)
    }

    // Tạo group format dựa trên period
    let dateGroupFormat: any
    let dateFormat: string

    switch (period) {
      case 'day':
        dateGroupFormat = {
          year: { $year: '$booking_time' },
          month: { $month: '$booking_time' },
          day: { $dayOfMonth: '$booking_time' }
        }
        dateFormat = '%Y-%m-%d'
        break
      case 'week':
        dateGroupFormat = {
          year: { $year: '$booking_time' },
          week: { $week: '$booking_time' }
        }
        dateFormat = '%Y-W%U'
        break
      case 'month':
        dateGroupFormat = {
          year: { $year: '$booking_time' },
          month: { $month: '$booking_time' }
        }
        dateFormat = '%Y-%m'
        break
      default:
        dateGroupFormat = {
          year: { $year: '$booking_time' },
          month: { $month: '$booking_time' },
          day: { $dayOfMonth: '$booking_time' }
        }
        dateFormat = '%Y-%m-%d'
    }

    // Aggregation pipeline để lấy dữ liệu thống kê
    const pipeline = [
      {
        $match: {
          theater_id: { $in: theaterIds },
          booking_time: {
            $gte: startDate,
            $lte: endDate
          },
          $or: [
            {
              status: BookingStatus.CONFIRMED,
              payment_status: PaymentStatus.COMPLETED
            },
            {
              status: BookingStatus.COMPLETED,
              payment_status: PaymentStatus.COMPLETED
            },
            {
              status: BookingStatus.USED,
              payment_status: PaymentStatus.COMPLETED
            }
          ]
        }
      },
      {
        $group: {
          _id: dateGroupFormat,
          revenue: { $sum: '$total_amount' },
          bookings_count: { $sum: 1 },
          date_string: { $first: { $dateToString: { format: dateFormat, date: '$booking_time' } } }
        }
      },
      {
        $addFields: {
          average_booking_value: {
            $cond: {
              if: { $gt: ['$bookings_count', 0] },
              then: { $divide: ['$revenue', '$bookings_count'] },
              else: 0
            }
          }
        }
      }
    ]

    // Lấy tổng số records để tính pagination
    const totalPipeline = [...pipeline, { $count: 'total' }]
    const totalResult = await databaseService.bookings.aggregate(totalPipeline).toArray()
    const totalItems = totalResult[0]?.total || 0
    const totalPages = Math.ceil(totalItems / limit)

    // Thêm sort và pagination
    const sortField = sortBy === 'date' ? 'date_string' : sortBy === 'revenue' ? 'revenue' : 'bookings_count'
    pipeline.push(
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    )

    const results = await databaseService.bookings.aggregate(pipeline).toArray()

    // Format kết quả
    const data: RevenueStatsResponse[] = results.map(item => ({
      period: period,
      date: item.date_string,
      revenue: item.revenue,
      bookings_count: item.bookings_count,
      average_booking_value: Math.round(item.average_booking_value * 100) / 100
    }))

    // Tính summary
    const summaryPipeline = [
      {
        $match: {
          theater_id: { $in: theaterIds },
          booking_time: {
            $gte: startDate,
            $lte: endDate
          },
          $or: [
            {
              status: BookingStatus.CONFIRMED,
              payment_status: PaymentStatus.COMPLETED
            },
            {
              status: BookingStatus.COMPLETED,
              payment_status: PaymentStatus.COMPLETED
            },
            {
              status: BookingStatus.USED,
              payment_status: PaymentStatus.COMPLETED
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
    ]

    const summaryResult = await databaseService.bookings.aggregate(summaryPipeline).toArray()
    const summary = summaryResult[0] || { total_revenue: 0, total_bookings: 0 }

    return {
      data,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      summary: {
        total_revenue: summary.total_revenue,
        total_bookings: summary.total_bookings,
        average_revenue_per_period: totalItems > 0 ? Math.round((summary.total_revenue / totalItems) * 100) / 100 : 0,
        period_type: period,
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    }
  }
}

const staffRevenueStatsService = new StaffRevenueStatsService()
export default staffRevenueStatsService
