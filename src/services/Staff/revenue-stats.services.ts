import { ObjectId } from 'mongodb'
import databaseService from '../database.services'
import { BookingStatus, PaymentStatus } from '../../models/schemas/Booking.schema'
import {
  RevenueStatsReqQuery,
  RevenueStatsResponse,
  RevenueStatsPaginatedResponse
} from '../../models/request/Revenue.request'

class StaffRevenueStatsService {
  async getRevenueStats(staff_id: string, query: RevenueStatsReqQuery): Promise<RevenueStatsPaginatedResponse> {
    const staffObjectId = new ObjectId(staff_id)

    // Tìm các theater mà staff này quản lý
    let theaters = await databaseService.theaters
      .find({
        manager_id: staffObjectId
      })
      .toArray()

    // Filter by specific theater if provided
    if (query.theater_id) {
      const theaterObjectId = new ObjectId(query.theater_id)
      theaters = theaters.filter((theater) => theater._id?.equals(theaterObjectId))
    }

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
          },
          total_tickets_sold: 0,
          theaters_count: 0,
          movies_count: 0,
          average_occupancy_rate: 0
        }
      }
    }

    const theaterIds = theaters.map((theater) => theater._id)

    // Xử lý tham số query
    const period = query.period || 'day'
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '10')
    const skip = (page - 1) * limit
    const sortBy = query.sort_by || 'date'
    const sortOrder = query.sort_order === 'asc' ? 1 : -1
    const groupBy = query.group_by || 'date'

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

    // Build match conditions
    const matchConditions: any = {
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

    // Add movie filter if provided
    if (query.movie_id) {
      matchConditions.movie_id = new ObjectId(query.movie_id)
    }

    // Aggregation pipeline để lấy dữ liệu thống kê
    const pipeline: any[] = [
      {
        $match: matchConditions
      },
      // Add lookup stages for theater and movie info
      {
        $lookup: {
          from: 'theaters',
          localField: 'theater_id',
          foreignField: '_id',
          as: 'theater_info'
        }
      },
      {
        $lookup: {
          from: 'movies',
          localField: 'movie_id',
          foreignField: '_id',
          as: 'movie_info'
        }
      },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime_id',
          foreignField: '_id',
          as: 'showtime_info'
        }
      },
      {
        $lookup: {
          from: 'screens',
          localField: 'screen_id',
          foreignField: '_id',
          as: 'screen_info'
        }
      },
      // Dynamic group stage based on groupBy parameter
      {
        $group: this.buildGroupStage(groupBy, dateGroupFormat, dateFormat)
      },
      {
        $addFields: {
          average_booking_value: {
            $cond: {
              if: { $gt: ['$bookings_count', 0] },
              then: { $divide: ['$revenue', '$bookings_count'] },
              else: 0
            }
          },
          occupancy_rate: {
            $cond: {
              if: { $gt: ['$total_capacity', 0] },
              then: { $multiply: [{ $divide: ['$tickets_sold', '$total_capacity'] }, 100] },
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
    pipeline.push({ $sort: { [sortField]: sortOrder } }, { $skip: skip }, { $limit: limit })

    const results = await databaseService.bookings.aggregate(pipeline).toArray()

    // Format kết quả
    const data: RevenueStatsResponse[] = results.map((item) => {
      const baseData = {
        period: period,
        date: item.date_string,
        revenue: item.revenue,
        bookings_count: item.bookings_count,
        average_booking_value: Math.round(item.average_booking_value * 100) / 100,
        tickets_sold: item.tickets_sold || 0,
        total_seats_capacity: item.total_capacity || 0,
        occupancy_rate: Math.round((item.occupancy_rate || 0) * 100) / 100
      }

      // Add theater info if grouping by theater
      if (groupBy === 'theater' && item._id.theater_id) {
        baseData.theater_info = {
          theater_id: item._id.theater_id.toString(),
          theater_name: item.theater_name || '',
          theater_location: item.theater_location || ''
        }
      }

      // Add movie info if grouping by movie
      if (groupBy === 'movie' && item._id.movie_id) {
        baseData.movie_info = {
          movie_id: item._id.movie_id.toString(),
          movie_title: item.movie_title || '',
          movie_genre: item.movie_genre || []
        }
      }

      return baseData
    })

    // Tính summary với thông tin chi tiết
    const summaryPipeline = [
      {
        $match: matchConditions
      },
      {
        $lookup: {
          from: 'theaters',
          localField: 'theater_id',
          foreignField: '_id',
          as: 'theater_info'
        }
      },
      {
        $lookup: {
          from: 'movies',
          localField: 'movie_id',
          foreignField: '_id',
          as: 'movie_info'
        }
      },
      {
        $lookup: {
          from: 'screens',
          localField: 'screen_id',
          foreignField: '_id',
          as: 'screen_info'
        }
      },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: '$total_amount' },
          total_bookings: { $sum: 1 },
          total_tickets_sold: { $sum: { $size: '$seats' } },
          theaters: { $addToSet: '$theater_id' },
          movies: { $addToSet: '$movie_id' },
          total_capacity: { $sum: { $first: '$screen_info.capacity' } },
          theater_revenues: {
            $push: {
              theater_id: '$theater_id',
              theater_name: { $arrayElemAt: ['$theater_info.name', 0] },
              revenue: '$total_amount'
            }
          },
          movie_revenues: {
            $push: {
              movie_id: '$movie_id',
              movie_title: { $arrayElemAt: ['$movie_info.title', 0] },
              revenue: '$total_amount'
            }
          }
        }
      }
    ]

    const summaryResult = await databaseService.bookings.aggregate(summaryPipeline).toArray()
    const summary = summaryResult[0] || {
      total_revenue: 0,
      total_bookings: 0,
      total_tickets_sold: 0,
      theaters: [],
      movies: [],
      total_capacity: 0,
      theater_revenues: [],
      movie_revenues: []
    }

    // Calculate top performing theater and movie
    const theaterRevenueMap = new Map()
    summary.theater_revenues?.forEach((item: any) => {
      const key = item.theater_id.toString()
      if (!theaterRevenueMap.has(key)) {
        theaterRevenueMap.set(key, { ...item, revenue: 0 })
      }
      theaterRevenueMap.get(key).revenue += item.revenue
    })

    const movieRevenueMap = new Map()
    summary.movie_revenues?.forEach((item: any) => {
      const key = item.movie_id.toString()
      if (!movieRevenueMap.has(key)) {
        movieRevenueMap.set(key, { ...item, revenue: 0 })
      }
      movieRevenueMap.get(key).revenue += item.revenue
    })

    const topTheater = Array.from(theaterRevenueMap.values()).sort((a, b) => b.revenue - a.revenue)[0]
    const topMovie = Array.from(movieRevenueMap.values()).sort((a, b) => b.revenue - a.revenue)[0]

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
        total_revenue: summary.total_revenue || 0,
        total_bookings: summary.total_bookings || 0,
        average_revenue_per_period: totalItems > 0 ? Math.round((summary.total_revenue / totalItems) * 100) / 100 : 0,
        period_type: period,
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        total_tickets_sold: summary.total_tickets_sold || 0,
        theaters_count: summary.theaters?.length || 0,
        movies_count: summary.movies?.length || 0,
        top_performing_theater: topTheater
          ? {
              theater_id: topTheater.theater_id.toString(),
              theater_name: topTheater.theater_name || '',
              revenue: topTheater.revenue
            }
          : undefined,
        top_performing_movie: topMovie
          ? {
              movie_id: topMovie.movie_id.toString(),
              movie_title: topMovie.movie_title || '',
              revenue: topMovie.revenue
            }
          : undefined,
        average_occupancy_rate:
          summary.total_capacity > 0
            ? Math.round((summary.total_tickets_sold / summary.total_capacity) * 100 * 100) / 100
            : 0
      }
    }
  }

  private buildGroupStage(groupBy: string, dateGroupFormat: any, dateFormat: string) {
    const baseGroup = {
      revenue: { $sum: '$total_amount' },
      bookings_count: { $sum: 1 },
      tickets_sold: { $sum: { $size: '$seats' } },
      total_capacity: { $sum: { $first: '$screen_info.capacity' } }
    }

    switch (groupBy) {
      case 'theater':
        return {
          _id: {
            theater_id: '$theater_id',
            ...dateGroupFormat
          },
          ...baseGroup,
          date_string: { $first: { $dateToString: { format: dateFormat, date: '$booking_time' } } },
          theater_name: { $first: { $arrayElemAt: ['$theater_info.name', 0] } },
          theater_location: { $first: { $arrayElemAt: ['$theater_info.location', 0] } }
        }
      case 'movie':
        return {
          _id: {
            movie_id: '$movie_id',
            ...dateGroupFormat
          },
          ...baseGroup,
          date_string: { $first: { $dateToString: { format: dateFormat, date: '$booking_time' } } },
          movie_title: { $first: { $arrayElemAt: ['$movie_info.title', 0] } },
          movie_genre: { $first: { $arrayElemAt: ['$movie_info.genre', 0] } }
        }
      default: // date
        return {
          _id: dateGroupFormat,
          ...baseGroup,
          date_string: { $first: { $dateToString: { format: dateFormat, date: '$booking_time' } } }
        }
    }
  }
}

const staffRevenueStatsService = new StaffRevenueStatsService()
export default staffRevenueStatsService
