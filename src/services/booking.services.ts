import { ObjectId } from 'mongodb'
import { BookingStatus, PaymentStatus } from '../models/schemas/Booking.schema'
import Booking from '../models/schemas/Booking.schema'
import {
  CreateBookingReqBody,
  GetBookingsReqQuery,
  UpdateBookingStatusReqBody
} from '../models/request/Booking.request'
import databaseService from './database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { BOOKING_MESSAGES } from '../constants/messages'
import { ShowtimeStatus } from '../models/schemas/Showtime.schema'
import QRCode from 'qrcode'
import bookingExpirationService from './booking-expiration.services'
import seatLockService from './seat-lock.services'
class BookingService {
  private async autoExpireBooking(booking_id: string) {
    const booking = await databaseService.bookings.findOne({
      _id: new ObjectId(booking_id)
    })

    if (!booking) return

    // Chỉ hủy nếu booking vẫn ở trạng thái PENDING và chưa thanh toán
    if (booking.status === BookingStatus.PENDING && booking.payment_status === PaymentStatus.PENDING) {
      // Cập nhật status thành CANCELLED
      await databaseService.bookings.updateOne(
        { _id: new ObjectId(booking_id) },
        {
          $set: {
            status: BookingStatus.CANCELLED,
            payment_status: PaymentStatus.FAILED
          },
          $currentDate: { updated_at: true }
        }
      )

      // Hoàn lại số ghế available
      await databaseService.showtimes.updateOne(
        { _id: booking.showtime_id },
        {
          $inc: { available_seats: booking.seats.length },
          $currentDate: { updated_at: true }
        }
      )

      // Unlock seats
      await seatLockService.unlockSeats(booking.showtime_id.toString(), booking.user_id.toString())

      console.log(`Auto-expired booking ${booking_id} after 5 minutes`)
    }
  }
  async createBooking(user_id: string, payload: CreateBookingReqBody) {
    const booking_id = new ObjectId()

    // Get showtime details
    const showtime = await databaseService.showtimes.findOne({
      _id: new ObjectId(payload.showtime_id)
    })

    if (!showtime) {
      throw new ErrorWithStatus({
        message: BOOKING_MESSAGES.SHOWTIME_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    console.log(showtime.status)

    // Verify showtime is available for booking
    if (showtime.status !== ShowtimeStatus.BOOKING_OPEN) {
      throw new ErrorWithStatus({
        message: BOOKING_MESSAGES.SHOWTIME_NOT_AVAILABLE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Verify showtime hasn't started yet
    if (new Date(showtime.start_time) < new Date()) {
      throw new ErrorWithStatus({
        message: BOOKING_MESSAGES.SHOWTIME_NOT_AVAILABLE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // 1. Lock seats trước khi kiểm tra availability
    const seatLock = await seatLockService.lockSeats(
      payload.showtime_id,
      user_id,
      payload.seats.map((seat) => ({ row: seat.row, number: seat.number }))
    )

    try {
      // Verify seat availability (kiểm tra booking đã confirm)
      const bookedSeats = await databaseService.bookings
        .find({
          showtime_id: new ObjectId(payload.showtime_id),
          status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
        })
        .toArray()

      const bookedSeatIdentifiers = bookedSeats.flatMap((booking) =>
        booking.seats.map((seat) => `${seat.row}-${seat.number}`)
      )

      const requestedSeatIdentifiers = payload.seats.map((seat) => `${seat.row}-${seat.number}`)

      const conflictingSeat = requestedSeatIdentifiers.find((seatId) => bookedSeatIdentifiers.includes(seatId))
      const isAuthorBookingSeats = await databaseService.seatLocks.findOne({
        showtime_id: new ObjectId(payload.showtime_id as string)
      })
      if (conflictingSeat && isAuthorBookingSeats?.user_id.toString() !== user_id) {
        // Unlock seats nếu có conflict
        await seatLockService.unlockSeats(payload.showtime_id, user_id)
        throw new ErrorWithStatus({
          message: BOOKING_MESSAGES.SEATS_ALREADY_BOOKED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      // Calculate total amount
      const seatsWithPrice = payload.seats.map((seat) => {
        let price = showtime.price.regular

        // Apply different price based on seat type
        if (seat.type === 'premium' && showtime.price.premium) {
          price = showtime.price.premium
        } else if (seat.type === 'recliner' && showtime.price.recliner) {
          price = showtime.price.recliner
        } else if (seat.type === 'couple' && showtime.price.couple) {
          price = showtime.price.couple
        }

        return {
          ...seat,
          price
        }
      })

      const totalAmount = seatsWithPrice.reduce((total, seat) => total + seat.price, 0)

      // Create booking
      const result = await databaseService.bookings.insertOne(
        new Booking({
          _id: booking_id,
          user_id: new ObjectId(user_id),
          showtime_id: new ObjectId(payload.showtime_id),
          movie_id: showtime.movie_id,
          theater_id: showtime.theater_id,
          screen_id: showtime.screen_id,
          seats: seatsWithPrice,
          total_amount: totalAmount,
          booking_time: new Date(),
          status: BookingStatus.PENDING,
          payment_status: PaymentStatus.PENDING
        })
      )

      // Update available seats in showtime
      await databaseService.showtimes.updateOne(
        { _id: new ObjectId(payload.showtime_id) },
        {
          $inc: { available_seats: -payload.seats.length },
          $currentDate: { updated_at: true }
        }
      )

      // 2. Setup auto-cancel booking sau 5 phút
      setTimeout(
        async () => {
          await this.autoExpireBooking(booking_id.toString())
        },
        5 * 60 * 1000
      ) // 5 phút

      // Fetch the booking with complete details
      const booking = await this.getBookingDetails(booking_id.toString())

      return {
        booking,
        seat_lock: seatLock
      }
    } catch (error) {
      // Unlock seats nếu có lỗi
      await seatLockService.unlockSeats(payload.showtime_id, user_id)
      throw error
    }
  }

  async getBookings(user_id: string, query: GetBookingsReqQuery) {
    const {
      page = '1',
      limit = '10',
      status,
      payment_status,
      sort_by = 'booking_time',
      sort_order = 'desc',
      date_from,
      date_to
    } = query

    const filter: any = { user_id: new ObjectId(user_id) }

    // Filter by status
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      filter.status = status
    }

    // Filter by payment status
    if (payment_status && Object.values(PaymentStatus).includes(payment_status as PaymentStatus)) {
      filter.payment_status = payment_status
    }

    // Filter by date range
    if (date_from || date_to) {
      filter.booking_time = {}
      if (date_from) {
        filter.booking_time.$gte = new Date(date_from)
      }
      if (date_to) {
        filter.booking_time.$lte = new Date(date_to)
      }
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of bookings matching the filter
    const totalBookings = await databaseService.bookings.countDocuments(filter)

    // Get bookings with pagination
    const bookings = await databaseService.bookings.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enrich bookings with movie, theater, and showtime details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [movie, theater, showtime] = await Promise.all([
          databaseService.movies.findOne({ _id: booking.movie_id }),
          databaseService.theaters.findOne({ _id: booking.theater_id }),
          databaseService.showtimes.findOne({ _id: booking.showtime_id })
        ])

        return {
          ...booking,
          movie: movie
            ? {
                _id: movie._id,
                title: movie.title,
                poster_url: movie.poster_url
              }
            : null,
          theater: theater
            ? {
                _id: theater._id,
                name: theater.name,
                location: theater.location
              }
            : null,
          showtime: showtime
            ? {
                _id: showtime._id,
                start_time: showtime.start_time,
                end_time: showtime.end_time
              }
            : null
        }
      })
    )

    return {
      bookings: enrichedBookings,
      total: totalBookings,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalBookings / limitNum)
    }
  }

  async getBookingById(booking_id: string) {
    const booking = await this.getBookingDetails(booking_id)
    return booking
  }

  async getBookingByTicketCode(ticket_code: string) {
    const booking = await databaseService.bookings.findOne({ ticket_code })

    if (booking) {
      return this.getBookingDetails(booking._id.toString())
    }

    return null
  }

  private async getBookingDetails(booking_id: string) {
    const booking = await databaseService.bookings.findOne({ _id: new ObjectId(booking_id) })

    if (booking) {
      // Get movie, theater, and showtime details
      const [movie, theater, showtime, screen, payment] = await Promise.all([
        databaseService.movies.findOne({ _id: booking.movie_id }),
        databaseService.theaters.findOne({ _id: booking.theater_id }),
        databaseService.showtimes.findOne({ _id: booking.showtime_id }),
        databaseService.screens.findOne({ _id: booking.screen_id }),
        databaseService.payments.findOne({ booking_id: new ObjectId(booking_id) })
      ])

      return {
        ...booking,
        movie: movie
          ? {
              _id: movie._id,
              title: movie.title,
              description: movie.description,
              poster_url: movie.poster_url,
              duration: movie.duration,
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
              screen_type: screen.screen_type
            }
          : null,
        showtime: showtime
          ? {
              _id: showtime._id,
              start_time: showtime.start_time,
              end_time: showtime.end_time
            }
          : null,
        payment: payment
          ? {
              _id: payment._id,
              payment_method: payment.payment_method,
              status: payment.status,
              transaction_id: payment.transaction_id
            }
          : null
      }
    }

    return booking
  }

  async updateBookingStatus(booking_id: string, payload: UpdateBookingStatusReqBody) {
    const booking = await databaseService.bookings.findOne({ _id: new ObjectId(booking_id) })

    if (!booking) {
      throw new ErrorWithStatus({
        message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // If cancelling a booking
    if (payload.status === BookingStatus.CANCELLED && booking.status !== BookingStatus.CANCELLED) {
      // Update available seats in showtime
      await databaseService.showtimes.updateOne(
        { _id: booking.showtime_id },
        {
          $inc: { available_seats: booking.seats.length },
          $currentDate: { updated_at: true }
        }
      )

      // If there's a payment with status PENDING, update it to REFUNDED
      if (booking.payment_status === PaymentStatus.PENDING) {
        await databaseService.bookings.updateOne(
          { _id: new ObjectId(booking_id) },
          {
            $set: {
              status: BookingStatus.CANCELLED,
              payment_status: PaymentStatus.REFUNDED
            },
            $currentDate: { updated_at: true }
          }
        )

        const payment = await databaseService.payments.findOne({ booking_id: new ObjectId(booking_id) })
        if (payment) {
          await databaseService.payments.updateOne(
            { _id: payment._id },
            {
              $set: { status: PaymentStatus.REFUNDED },
              $currentDate: { updated_at: true }
            }
          )
        }
      } else {
        await databaseService.bookings.updateOne(
          { _id: new ObjectId(booking_id) },
          {
            $set: { status: BookingStatus.CANCELLED },
            $currentDate: { updated_at: true }
          }
        )
      }
    } else {
      await databaseService.bookings.updateOne(
        { _id: new ObjectId(booking_id) },
        {
          $set: { status: payload.status },
          $currentDate: { updated_at: true }
        }
      )
    }

    return { booking_id }
  }
  async generateTicketQR(ticket_code: string) {
    try {
      const qrDataURL = await QRCode.toDataURL(ticket_code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return { qr_code: qrDataURL }
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }
}

const bookingService = new BookingService()
export default bookingService
