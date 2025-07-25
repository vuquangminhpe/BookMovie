import { ObjectId } from 'mongodb'
import { ShowtimeStatus } from '../models/schemas/Showtime.schema'
import Showtime from '../models/schemas/Showtime.schema'
import databaseService from './database.services'
import { CreateShowtimeReqBody, GetShowtimesReqQuery, UpdateShowtimeReqBody } from '../models/request/Showtime.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { SHOWTIME_MESSAGES } from '../constants/messages'
import { BookingStatus, PaymentStatus } from '../models/schemas/Booking.schema'

class ShowtimeService {
  async createShowtime(payload: CreateShowtimeReqBody) {
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

    // Get movie details to determine duration
    const movie = await databaseService.movies.findOne({ _id: new ObjectId(payload.movie_id) })

    // Get screen details to determine capacity if not provided
    let availableSeats = payload.available_seats
    if (!availableSeats) {
      const screen = await databaseService.screens.findOne({ _id: new ObjectId(payload.screen_id) })
      availableSeats = screen?.capacity || 0
    }

    const result = await databaseService.showtimes.insertOne(
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

  async getShowtimes(query: GetShowtimesReqQuery) {
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

    const filter: any = {}

    // Filter by movie_id
    if (movie_id) {
      filter.movie_id = new ObjectId(movie_id)
    }

    // Filter by theater_id
    if (theater_id) {
      filter.theater_id = new ObjectId(theater_id)
    }

    // Filter by screen_id
    if (screen_id) {
      filter.screen_id = new ObjectId(screen_id)
    }

    // Filter by date (only date, not time)
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

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of showtimes matching the filter
    const totalShowtimes = await databaseService.showtimes.countDocuments(filter)

    // Get showtimes with pagination
    const showtimes = await databaseService.showtimes.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Get movie, theater, and screen details for each showtime
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

  async getShowtimeById(showtime_id: string) {
    const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(showtime_id) })

    if (showtime) {
      // Get movie, theater, and screen details
      const [movie, theater, screen] = await Promise.all([
        databaseService.movies.findOne({ _id: showtime.movie_id }),
        databaseService.theaters.findOne({ _id: showtime.theater_id }),
        databaseService.screens.findOne({ _id: showtime.screen_id })
      ])

      // Get bookings that should be considered as "booked"
      // 1. CONFIRMED/COMPLETED bookings with COMPLETED payment (truly booked)
      // 2. PENDING bookings with PENDING payment (temporarily locked during payment process)
      const bookings = await databaseService.bookings
        .find({
          showtime_id: new ObjectId(showtime_id),
          $or: [
            {
              // Truly booked seats (payment completed)
              status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.USED] },
              payment_status: PaymentStatus.COMPLETED
            },
            {
              // Temporarily locked seats (payment in progress)
              status: BookingStatus.PENDING,
              payment_status: PaymentStatus.PENDING
            }
          ]
        })
        .toArray()

      // Separate truly booked seats from temporarily locked seats
      const trulyBookedSeats: Array<{ row: string; number: number }> = []
      const temporarilyLockedSeats: Array<{ row: string; number: number }> = []

      bookings.forEach((booking) => {
        booking.seats.forEach((seat) => {
          const seatInfo = {
            row: seat.row,
            number: seat.number
          }

          if (booking.payment_status === PaymentStatus.COMPLETED) {
            trulyBookedSeats.push(seatInfo)
          } else if (booking.status === BookingStatus.PENDING && booking.payment_status === PaymentStatus.PENDING) {
            temporarilyLockedSeats.push(seatInfo)
          }
        })
      })

      // For backward compatibility, combine both for booked_seats
      const bookedSeats = [...trulyBookedSeats, ...temporarilyLockedSeats]

      return {
        ...showtime,
        movie: movie
          ? {
              _id: movie._id,
              title: movie.title,
              description: movie.description,
              poster_url: movie.poster_url,
              duration: movie.duration,
              genre: movie.genre,
              language: movie.language
            }
          : null,
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
        booked_seats: bookedSeats,
        truly_booked_seats: trulyBookedSeats,
        temporarily_locked_seats: temporarilyLockedSeats
      }
    }

    return showtime
  }

  async updateShowtime(showtime_id: string, payload: UpdateShowtimeReqBody) {
    const updateData: any = { ...payload }

    // Convert date strings to Date objects if provided
    if (payload.start_time) {
      updateData.start_time = new Date(payload.start_time)
    }

    if (payload.end_time) {
      updateData.end_time = new Date(payload.end_time)
    }

    // If changing start or end time, check for overlaps
    if (payload.start_time || payload.end_time) {
      const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(showtime_id) })

      if (showtime) {
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
    }

    await databaseService.showtimes.updateOne(
      { _id: new ObjectId(showtime_id) },
      {
        $set: updateData,
        $currentDate: {
          updated_at: true
        }
      }
    )

    return { showtime_id }
  }

  async deleteShowtime(showtime_id: string) {
    // Check if showtime has any bookings
    const booking = await databaseService.bookings.findOne({ showtime_id: new ObjectId(showtime_id) })

    if (booking) {
      // Instead of deleting, mark as cancelled
      await databaseService.showtimes.updateOne(
        { _id: new ObjectId(showtime_id) },
        {
          $set: { status: ShowtimeStatus.CANCELLED },
          $currentDate: {
            updated_at: true
          }
        }
      )
    } else {
      // If no bookings, delete the showtime
      await databaseService.showtimes.deleteOne({ _id: new ObjectId(showtime_id) })
    }

    return { showtime_id }
  }
}

const showtimeService = new ShowtimeService()
export default showtimeService
