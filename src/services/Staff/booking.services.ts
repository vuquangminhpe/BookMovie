import { ObjectId } from 'mongodb'
import databaseService from '../database.services'
import { ErrorWithStatus } from '../../models/Errors'
import HTTP_STATUS from '../../constants/httpStatus'
import { BookingStatus, PaymentStatus } from '../../models/schemas/Booking.schema'
import { GetBookingsReqQuery } from '../../models/request/Booking.request'

class StaffBookingService {
  // Staff xem tất cả bookings của theater mình quản lý với filter
  async getMyTheaterBookings(staff_id: string, query: GetBookingsReqQuery) {
    const {
      page = '1',
      limit = '20',
      status,
      payment_status,
      sort_by = 'booking_time',
      sort_order = 'desc',
      date_from,
      date_to
    } = query

    // Find theater managed by this staff
    const theater = await databaseService.theaters.findOne({
      manager_id: new ObjectId(staff_id)
    })

    if (!theater) {
      throw new ErrorWithStatus({
        message: 'No theater found under your management',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Build filter object
    const matchFilter: any = {
      theater_id: theater._id
    }

    // Filter by booking status
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      matchFilter.status = status
    }

    // Filter by payment status
    if (payment_status && Object.values(PaymentStatus).includes(payment_status as PaymentStatus)) {
      matchFilter.payment_status = payment_status
    }

    // Filter by date range
    if (date_from || date_to) {
      matchFilter.booking_time = {}
      if (date_from) {
        matchFilter.booking_time.$gte = new Date(date_from)
      }
      if (date_to) {
        matchFilter.booking_time.$lte = new Date(date_to)
      }
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count
    const totalBookings = await databaseService.bookings.countDocuments(matchFilter)

    // Get bookings with populated data
    const bookings = await databaseService.bookings
      .aggregate([
        { $match: matchFilter },
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limitNum },
        // Populate user info
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        // Populate movie info
        {
          $lookup: {
            from: 'movies',
            localField: 'movie_id',
            foreignField: '_id',
            as: 'movie_info'
          }
        },
        // Populate showtime info
        {
          $lookup: {
            from: 'showtimes',
            localField: 'showtime_id',
            foreignField: '_id',
            as: 'showtime_info'
          }
        },
        // Populate screen info
        {
          $lookup: {
            from: 'screens',
            localField: 'screen_id',
            foreignField: '_id',
            as: 'screen_info'
          }
        },
        // Populate theater info
        {
          $lookup: {
            from: 'theaters',
            localField: 'theater_id',
            foreignField: '_id',
            as: 'theater_info'
          }
        },
        // Project the final structure
        {
          $project: {
            _id: 1,
            user_id: 1,
            showtime_id: 1,
            movie_id: 1,
            theater_id: 1,
            screen_id: 1,
            seats: 1,
            total_amount: 1,
            booking_time: 1,
            ticket_code: 1,
            status: 1,
            payment_status: 1,
            created_at: 1,
            updated_at: 1,
            // Clean user info
            user_info: {
              $arrayElemAt: [
                {
                  $map: {
                    input: '$user_info',
                    in: {
                      _id: '$$this._id',
                      name: '$$this.name',
                      email: '$$this.email',
                      phone: '$$this.phone'
                    }
                  }
                },
                0
              ]
            },
            // Clean movie info
            movie_info: {
              $arrayElemAt: [
                {
                  $map: {
                    input: '$movie_info',
                    in: {
                      _id: '$$this._id',
                      title: '$$this.title',
                      poster_url: '$$this.poster_url',
                      duration: '$$this.duration'
                    }
                  }
                },
                0
              ]
            },
            // Clean showtime info
            showtime_info: {
              $arrayElemAt: [
                {
                  $map: {
                    input: '$showtime_info',
                    in: {
                      _id: '$$this._id',
                      start_time: '$$this.start_time',
                      end_time: '$$this.end_time',
                      price: '$$this.price'
                    }
                  }
                },
                0
              ]
            },
            // Clean screen info
            screen_info: {
              $arrayElemAt: [
                {
                  $map: {
                    input: '$screen_info',
                    in: {
                      _id: '$$this._id',
                      name: '$$this.name',
                      screen_type: '$$this.screen_type'
                    }
                  }
                },
                0
              ]
            },
            // Clean theater info
            theater_info: {
              $arrayElemAt: [
                {
                  $map: {
                    input: '$theater_info',
                    in: {
                      _id: '$$this._id',
                      name: '$$this.name',
                      location: '$$this.location'
                    }
                  }
                },
                0
              ]
            }
          }
        }
      ])
      .toArray()

    return {
      bookings,
      total: totalBookings,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalBookings / limitNum)
    }
  }
}

const staffBookingService = new StaffBookingService()
export default staffBookingService