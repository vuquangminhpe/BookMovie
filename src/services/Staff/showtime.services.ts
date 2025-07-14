import { ObjectId } from 'mongodb'
import databaseService from '../database.services'
import {
  CreateShowtimeReqBody,
  GetShowtimesReqQuery,
  UpdateShowtimeReqBody
} from '../../models/request/Showtime.request'
import Showtime, { ShowtimeStatus } from '../../models/schemas/Showtime.schema'
import { ErrorWithStatus } from '../../models/Errors'
import HTTP_STATUS from '../../constants/httpStatus'
import { SHOWTIME_MESSAGES } from '../../constants/messages'
import { BookingStatus } from '../../models/schemas/Booking.schema'

class StaffShowtimeService {
  // Staff tạo showtime cho movie trong hệ thống
  async createShowtime(staff_id: string, payload: CreateShowtimeReqBody) {
    const movie = await databaseService.movies.findOne({
      _id: new ObjectId(payload.movie_id)
    })

    if (!movie) {
      throw new ErrorWithStatus({
        message: 'Movie not found in the system',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Validate theater belongs to this staff
    const staffTheater = await databaseService.theaters.findOne({
      _id: new ObjectId(payload.theater_id),
      manager_id: new ObjectId(staff_id) // Assuming theaters have manager_id field
    })

    if (!staffTheater) {
      throw new ErrorWithStatus({
        message: 'Theater not found or you do not have permission to manage this theater',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Validate screen belongs to staff's theater
    const screen = await databaseService.screens.findOne({
      _id: new ObjectId(payload.screen_id),
      theater_id: new ObjectId(payload.theater_id)
    })

    if (!screen) {
      throw new ErrorWithStatus({
        message: 'Screen not found or does not belong to your theater',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const showtime_id = new ObjectId()

    // Check for overlapping showtimes on the same screen
    const startTime = new Date(payload.start_time)
    const endTime = new Date(payload.end_time)

    const overlappingShowtime = await databaseService.showtimes.findOne({
      screen_id: new ObjectId(payload.screen_id),
      $or: [
        // Existing showtime starts during our new showtime
        {
          start_time: {
            $gte: startTime,
            $lt: endTime
          }
        },
        // Existing showtime ends during our new showtime
        {
          end_time: {
            $gt: startTime,
            $lte: endTime
          }
        },
        // Existing showtime contains our new showtime
        {
          start_time: { $lte: startTime },
          end_time: { $gte: endTime }
        }
      ],
      status: { $ne: ShowtimeStatus.CANCELLED }
    })

    if (overlappingShowtime) {
      throw new ErrorWithStatus({
        message: SHOWTIME_MESSAGES.SHOWTIME_OVERLAP,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get screen details to determine capacity if not provided
    let availableSeats = payload.available_seats
    if (!availableSeats) {
      const screen = await databaseService.screens.findOne({ _id: new ObjectId(payload.screen_id) })
      availableSeats = screen?.capacity || 0
    }

    await databaseService.showtimes.insertOne(
      new Showtime({
        _id: showtime_id,
        movie_id: new ObjectId(payload.movie_id),
        screen_id: new ObjectId(payload.screen_id),
        theater_id: new ObjectId(payload.theater_id),
        start_time: startTime,
        end_time: endTime,
        price: payload.price,
        available_seats: availableSeats,
        status: payload.status || ShowtimeStatus.SCHEDULED
      })
    )

    return { showtime_id: showtime_id.toString() }
  }

  // Staff xem showtimes của theater mình quản lý (không chỉ movies mình tạo)
  async getMyShowtimes(staff_id: string, query: GetShowtimesReqQuery) {
    const {
      page = '1',
      limit = '10',
      movie_id,
      theater_id,
      screen_id,
      date,
      status,
      sort_by = 'start_time',
      sort_order = 'asc'
    } = query

    // Get theater managed by this staff
    const staffTheater = await databaseService.theaters.findOne({
      manager_id: new ObjectId(staff_id)
    })

    if (!staffTheater) {
      throw new ErrorWithStatus({
        message: 'No theater found under your management',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const filter: any = {
      theater_id: staffTheater._id // Lấy tất cả showtimes của theater này
    }

    // Filter by specific movie_id if provided
    if (movie_id) {
      filter.movie_id = new ObjectId(movie_id)
    }

    // Filter by specific theater_id if provided (must be staff's theater)
    if (theater_id) {
      if (theater_id !== staffTheater._id.toString()) {
        throw new ErrorWithStatus({
          message: 'You can only view showtimes of your own theater',
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      filter.theater_id = new ObjectId(theater_id)
    }

    // Filter by screen_id
    if (screen_id) {
      filter.screen_id = new ObjectId(screen_id)
    }

    // Filter by date
    if (date) {
      const dateObj = new Date(date)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      filter.start_time = {
        $gte: dateObj,
        $lt: nextDay
      }
    }

    // Filter by status
    if (status && Object.values(ShowtimeStatus).includes(status as ShowtimeStatus)) {
      filter.status = status
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalShowtimes = await databaseService.showtimes.countDocuments(filter)

    const showtimes = await databaseService.showtimes.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enrich with movie, theater, and screen details
    const enrichedShowtimes = await Promise.all(
      showtimes.map(async (showtime) => {
        const [movie, theater, screen] = await Promise.all([
          databaseService.movies.findOne({ _id: showtime.movie_id }),
          databaseService.theaters.findOne({ _id: showtime.theater_id }),
          databaseService.screens.findOne({ _id: showtime.screen_id })
        ])

        return {
          ...showtime,
          movie: movie
            ? {
                _id: movie._id,
                title: movie.title,
                poster_url: movie.poster_url,
                duration: movie.duration
              }
            : null,
          theater: theater
            ? {
                _id: theater._id,
                name: theater.name,
                location: theater.location
              }
            : null,
          screen: screen
            ? {
                _id: screen._id,
                name: screen.name,
                screen_type: screen.screen_type
              }
            : null
        }
      })
    )

    return {
      showtimes: enrichedShowtimes,
      total: totalShowtimes,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalShowtimes / limitNum)
    }
  }

  // Staff xem chi tiết showtime với theater ownership check
  async getMyShowtimeById(staff_id: string, showtime_id: string) {
    if (!ObjectId.isValid(showtime_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid showtime ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(showtime_id) })

    if (!showtime) {
      throw new ErrorWithStatus({
        message: 'Showtime not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if the theater belongs to this staff
    const staffTheater = await databaseService.theaters.findOne({
      _id: showtime.theater_id,
      manager_id: new ObjectId(staff_id)
    })

    if (!staffTheater) {
      throw new ErrorWithStatus({
        message: 'You do not have permission to access this showtime',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Get movie details (có thể không phải do staff này tạo)
    const movie = await databaseService.movies.findOne({ _id: showtime.movie_id })

    if (!movie) {
      throw new ErrorWithStatus({
        message: 'Movie not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get detailed info
    const [theater, screen] = await Promise.all([
      databaseService.theaters.findOne({ _id: showtime.theater_id }),
      databaseService.screens.findOne({ _id: showtime.screen_id })
    ])

    const bookings = await databaseService.bookings
      .find({
        showtime_id: new ObjectId(showtime_id),
        status: { $ne: BookingStatus.CANCELLED }
      })
      .toArray()

    const bookedSeats = bookings.flatMap((booking) =>
      booking.seats.map((seat) => ({
        row: seat.row,
        number: seat.number
      }))
    )

    return {
      ...showtime,
      movie: {
        _id: movie._id,
        title: movie.title,
        description: movie.description,
        poster_url: movie.poster_url,
        duration: movie.duration,
        genre: movie.genre,
        language: movie.language
      },
      theater: theater
        ? {
            _id: theater._id,
            name: theater.name,
            location: theater.location,
            address: theater.address,
            city: theater.city
          }
        : null,
      screen: screen
        ? {
            _id: screen._id,
            name: screen.name,
            screen_type: screen.screen_type,
            capacity: screen.capacity,
            seat_layout: screen.seat_layout
          }
        : null,
      booked_seats: bookedSeats
    }
  }

  // Staff update showtime với theater ownership check
  async updateMyShowtime(staff_id: string, showtime_id: string, payload: UpdateShowtimeReqBody) {
    if (!ObjectId.isValid(showtime_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid showtime ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(showtime_id) })

    if (!showtime) {
      throw new ErrorWithStatus({
        message: 'Showtime not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check theater ownership instead of movie ownership
    const theater = await databaseService.theaters.findOne({
      _id: showtime.theater_id,
      manager_id: new ObjectId(staff_id)
    })

    if (!theater) {
      throw new ErrorWithStatus({
        message: 'You do not have permission to update this showtime',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const updateData: any = { ...payload }

    if (payload.start_time) {
      updateData.start_time = new Date(payload.start_time)
    }

    if (payload.end_time) {
      updateData.end_time = new Date(payload.end_time)
    }

    if (payload.start_time || payload.end_time) {
      const startTime = payload.start_time ? new Date(payload.start_time) : showtime.start_time
      const endTime = payload.end_time ? new Date(payload.end_time) : showtime.end_time

      const overlappingShowtime = await databaseService.showtimes.findOne({
        _id: { $ne: new ObjectId(showtime_id) },
        screen_id: showtime.screen_id,
        $or: [
          {
            start_time: {
              $gte: startTime,
              $lt: endTime
            }
          },
          {
            end_time: {
              $gt: startTime,
              $lte: endTime
            }
          },
          {
            start_time: { $lte: startTime },
            end_time: { $gte: endTime }
          }
        ],
        status: { $ne: ShowtimeStatus.CANCELLED }
      })

      if (overlappingShowtime) {
        throw new ErrorWithStatus({
          message: SHOWTIME_MESSAGES.SHOWTIME_OVERLAP,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    await databaseService.showtimes.updateOne(
      { _id: new ObjectId(showtime_id) },
      {
        $set: updateData,
        $currentDate: { updated_at: true }
      }
    )

    return { showtime_id }
  }

  // Staff delete showtime với theater ownership check
  async deleteMyShowtime(staff_id: string, showtime_id: string) {
    if (!ObjectId.isValid(showtime_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid showtime ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(showtime_id) })

    if (!showtime) {
      throw new ErrorWithStatus({
        message: 'Showtime not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check theater ownership instead of movie ownership
    const theater = await databaseService.theaters.findOne({
      _id: showtime.theater_id,
      manager_id: new ObjectId(staff_id)
    })

    if (!theater) {
      throw new ErrorWithStatus({
        message: 'You do not have permission to delete this showtime',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if showtime has bookings
    const booking = await databaseService.bookings.findOne({ showtime_id: new ObjectId(showtime_id) })

    if (booking) {
      // Mark as cancelled instead of deleting
      await databaseService.showtimes.updateOne(
        { _id: new ObjectId(showtime_id) },
        {
          $set: { status: ShowtimeStatus.CANCELLED },
          $currentDate: { updated_at: true }
        }
      )
    } else {
      // Delete if no bookings
      await databaseService.showtimes.deleteOne({ _id: new ObjectId(showtime_id) })
    }

    return { showtime_id }
  }
}

const staffShowtimeService = new StaffShowtimeService()
export default staffShowtimeService
