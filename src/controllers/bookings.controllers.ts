import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKING_MESSAGES, USERS_MESSAGES } from '../constants/messages'
import {
  BookingIdReqParams,
  CreateBookingReqBody,
  GetBookingsReqQuery,
  TicketCodeReqParams,
  UpdateBookingStatusReqBody
} from '../models/request/Booking.request'
import bookingService from '../services/booking.services'
import { TokenPayload } from '../models/request/User.request'
import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { BookingStatus, PaymentStatus } from '~/models/schemas/Booking.schema'
import bookingExpirationService from '~/services/booking-expiration.services'
import seatLockService from '~/services/seat-lock.services'
import { ErrorWithStatus } from '~/models/Errors'
import { UserRole } from '~/models/schemas/User.schema'

export const createBookingController = async (
  req: Request<ParamsDictionary, any, CreateBookingReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await bookingService.createBooking(user_id, req.body)
  res.json({
    message: BOOKING_MESSAGES.CREATE_BOOKING_SUCCESS,
    result
  })
}
export const updateBookingController = async (
  req: Request<BookingIdReqParams, any, CreateBookingReqBody>,
  res: Response
) => {
  const { booking_id } = req.params
  const result = await bookingService.updateBooking(booking_id, req.body)

  res.json({
    messages: BOOKING_MESSAGES.UPDATE_BOOKING_SUCCESS,
    result
  })
}
export const getMyBookingsController = async (
  req: Request<ParamsDictionary, any, any, GetBookingsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await bookingService.getBookings(user_id, req.query)
  res.json({
    message: BOOKING_MESSAGES.GET_BOOKINGS_SUCCESS,
    result
  })
}

export const getBookingByIdController = async (req: Request<BookingIdReqParams>, res: Response) => {
  const { booking_id } = req.params
  const result = await bookingService.getBookingById(booking_id)
  res.json({
    message: BOOKING_MESSAGES.GET_BOOKING_SUCCESS,
    result
  })
}

export const getBookingByTicketCodeController = async (req: Request<TicketCodeReqParams>, res: Response) => {
  const { ticket_code } = req.params
  const result = await bookingService.getBookingByTicketCode(ticket_code)
  res.json({
    message: BOOKING_MESSAGES.GET_BOOKING_SUCCESS,
    result
  })
}

export const updateBookingStatusController = async (
  req: Request<BookingIdReqParams, any, UpdateBookingStatusReqBody>,
  res: Response
) => {
  const { booking_id } = req.params
  const result = await bookingService.updateBookingStatus(booking_id, req.body)

  // Determine the appropriate message based on the status
  const message =
    req.body.status === 'cancelled' ? BOOKING_MESSAGES.CANCEL_BOOKING_SUCCESS : BOOKING_MESSAGES.UPDATE_BOOKING_SUCCESS

  res.json({
    message,
    result
  })
}
export const getTicketQRController = async (req: Request<TicketCodeReqParams>, res: Response) => {
  const { ticket_code } = req.params

  // Get booking WITHOUT marking as USED (just for info)
  const booking = await databaseService.bookings.findOne({ ticket_code })

  if (!booking) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: BOOKING_MESSAGES.BOOKING_NOT_FOUND
    })
  }

  const { user_id } = req.decode_authorization as TokenPayload

  if (booking.user_id.toString() !== user_id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'You do not have permission to access this ticket'
    })
  }

  const result = await bookingService.generateTicketQR(ticket_code)

  res.json({
    message: 'Get ticket QR code success',
    result
  })
}
export const verifyTicketQRController = async (req: Request, res: Response) => {
  const { ticket_code } = req.body
  const { user_id } = req.decode_authorization as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })

  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  if (!user.role || ![UserRole.Admin, UserRole.Concierge, UserRole.Staff].includes(user.role)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_IS_NOT_CONCIERGE,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  if (!ticket_code) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: BOOKING_MESSAGES.TICKET_CODE_IS_REQUIRED
    })
  }

  // Get booking by ticket code
  const booking = await bookingService.getBookingByTicketCode(ticket_code)

  if (!booking) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: BOOKING_MESSAGES.BOOKING_NOT_FOUND
    })
  }
  const bookingUser = await databaseService.users.findOne({ _id: booking.user_id })
  res.json({
    message: 'Ticket verification success',
    result: {
      booking_id: booking._id,
      ticket_code: booking.ticket_code,
      status: booking.status,
      payment_status: booking.payment_status,
      user: bookingUser,
      movie: booking.movie,
      theater: booking.theater,
      screen: booking.screen,
      showtime: booking.showtime,
      seats: booking.seats,
      booking_time: booking.booking_time,
      verified_at: new Date()
    }
  })
}
export const getBookingExpirationInfoController = async (req: Request<BookingIdReqParams>, res: Response) => {
  const { booking_id } = req.params
  const info = await bookingExpirationService.getBookingExpirationInfo(booking_id)

  if (!info) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: BOOKING_MESSAGES.BOOKING_NOT_FOUND
    })
  }

  res.json({
    message: 'Get booking expiration info success',
    result: info
  })
}

export const extendBookingExpirationController = async (req: Request<BookingIdReqParams>, res: Response) => {
  const { booking_id } = req.params
  const { additional_minutes = 5 } = req.body
  const { user_id } = req.decode_authorization as TokenPayload

  // Verify user owns the booking
  const booking = await databaseService.bookings.findOne({
    _id: new ObjectId(booking_id),
    user_id: new ObjectId(user_id)
  })

  if (!booking) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: BOOKING_MESSAGES.BOOKING_NOT_FOUND
    })
  }

  if (booking.status !== BookingStatus.PENDING || booking.payment_status !== PaymentStatus.PENDING) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Cannot extend expiration for completed or cancelled booking'
    })
  }

  bookingExpirationService.extendBookingExpiration(booking_id, additional_minutes)

  res.json({
    message: 'Booking expiration extended successfully',
    result: {
      booking_id,
      extended_minutes: additional_minutes
    }
  })
}

export const deleteSeatLocksByShowtimeController = async (req: Request, res: Response) => {
  const { showtime_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  await seatLockService.unlockSeats(showtime_id, user_id)

  res.json({
    message: 'Seat locks deleted successfully',
    result: {
      showtime_id
    }
  })
}

export const deleteSeatLocksByRowAndNumberController = async (req: Request, res: Response) => {
  const { showtime_id } = req.params
  const { seats } = req.body
  const { user_id } = req.decode_authorization as TokenPayload

  for (const seat of seats) {
    await databaseService.seatLocks.updateOne(
      {
        showtime_id: new ObjectId(showtime_id),
        user_id: new ObjectId(user_id)
      },
      {
        $pull: {
          seats: {
            row: seat.seat_row,
            number: seat.seat_number
          }
        }
      }
    )

    const seatLock = await databaseService.seatLocks.findOne({
      showtime_id: new ObjectId(showtime_id),
      user_id: new ObjectId(user_id)
    })
    await databaseService.bookings.updateOne(
      {
        _id: new ObjectId(seatLock?.booking_id?.toString())
      },
      {
        $pull: {
          seats: {
            row: seat.seat_row,
            number: seat.seat_number
          }
        }
      }
    )
  }

  await databaseService.seatLocks.deleteMany({
    showtime_id: new ObjectId(showtime_id),
    user_id: new ObjectId(user_id),
    seats: { $size: 0 }
  })

  res.json({
    message: 'Seat locks deleted successfully',
    result: {
      showtime_id,
      deleted_seats: seats
    }
  })
}
