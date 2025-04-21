import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { BOOKING_MESSAGES, SHOWTIME_MESSAGES } from '../constants/messages'
import { BookingStatus, PaymentStatus } from '../models/schemas/Booking.schema'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { SeatType } from '../models/schemas/Screen.schema'
import { ShowtimeStatus } from '../models/schemas/Showtime.schema'

export const createBookingValidator = validate(
  checkSchema(
    {
      showtime_id: {
        notEmpty: {
          errorMessage: BOOKING_MESSAGES.SHOWTIME_ID_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: SHOWTIME_MESSAGES.INVALID_SHOWTIME_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(value) })
            if (!showtime) {
              throw new ErrorWithStatus({
                message: SHOWTIME_MESSAGES.SHOWTIME_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Check if showtime is available for booking
            if (showtime.status !== ShowtimeStatus.BOOKING_OPEN) {
              throw new ErrorWithStatus({
                message: BOOKING_MESSAGES.SHOWTIME_NOT_AVAILABLE,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            return true
          }
        }
      },
      seats: {
        notEmpty: {
          errorMessage: BOOKING_MESSAGES.SEATS_IS_REQUIRED
        },
        isArray: {
          errorMessage: BOOKING_MESSAGES.SEATS_MUST_BE_AN_ARRAY
        },
        custom: {
          options: async (value, { req }) => {
            if (value.length === 0) {
              throw new Error('At least one seat must be selected')
            }

            // Validate each seat
            for (const seat of value) {
              if (!seat.row) {
                throw new Error(BOOKING_MESSAGES.SEAT_ROW_IS_REQUIRED)
              }
              if (seat.number === undefined || seat.number === null) {
                throw new Error(BOOKING_MESSAGES.SEAT_NUMBER_IS_REQUIRED)
              }
              if (!seat.type) {
                throw new Error(BOOKING_MESSAGES.SEAT_TYPE_IS_REQUIRED)
              }
              if (!Object.values(SeatType).includes(seat.type)) {
                throw new Error(BOOKING_MESSAGES.INVALID_SEAT_TYPE)
              }
            }

            // Check if seats are already booked
            if (req.body.showtime_id) {
              const showtime_id = req.body.showtime_id

              // Create an array of seat identifiers in the format "A-1", "B-2", etc.
              const seatIdentifiers = value.map((seat: any) => `${seat.row}-${seat.number}`)

              // Find any existing bookings for this showtime with the selected seats
              const existingBookings = await databaseService.bookings
                .find({
                  showtime_id: new ObjectId(showtime_id),
                  status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
                  'seats.row': { $in: value.map((seat: any) => seat.row) },
                  'seats.number': { $in: value.map((seat: any) => seat.number) }
                })
                .toArray()

              if (existingBookings.length > 0) {
                // Check if any of the requested seats are already booked
                for (const booking of existingBookings) {
                  for (const bookedSeat of booking.seats) {
                    const seatId = `${bookedSeat.row}-${bookedSeat.number}`
                    if (seatIdentifiers.includes(seatId)) {
                      throw new ErrorWithStatus({
                        message: BOOKING_MESSAGES.SEATS_ALREADY_BOOKED,
                        status: HTTP_STATUS.BAD_REQUEST
                      })
                    }
                  }
                }
              }
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateBookingStatusValidator = validate(
  checkSchema(
    {
      booking_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: BOOKING_MESSAGES.INVALID_BOOKING_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const booking = await databaseService.bookings.findOne({ _id: new ObjectId(value) })
            if (!booking) {
              throw new ErrorWithStatus({
                message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      status: {
        notEmpty: {
          errorMessage: BOOKING_MESSAGES.INVALID_STATUS
        },
        isIn: {
          options: [Object.values(BookingStatus)],
          errorMessage: BOOKING_MESSAGES.INVALID_STATUS
        },
        custom: {
          options: async (value, { req }) => {
            const booking_id = req?.params?.booking_id
            const booking = await databaseService.bookings.findOne({ _id: new ObjectId(booking_id) })

            // If trying to cancel a booking
            if (value === BookingStatus.CANCELLED) {
              if (booking?.status === BookingStatus.CANCELLED) {
                throw new ErrorWithStatus({
                  message: BOOKING_MESSAGES.BOOKING_ALREADY_CANCELLED,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              if (booking?.status === BookingStatus.COMPLETED) {
                throw new ErrorWithStatus({
                  message: BOOKING_MESSAGES.BOOKING_CANNOT_BE_CANCELLED,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              // Check if showtime has already started
              if (booking) {
                const showtime = await databaseService.showtimes.findOne({
                  _id: booking.showtime_id
                })

                if (showtime && new Date(showtime.start_time) < new Date()) {
                  throw new ErrorWithStatus({
                    message: BOOKING_MESSAGES.BOOKING_CANNOT_BE_CANCELLED,
                    status: HTTP_STATUS.BAD_REQUEST
                  })
                }
              }
            }

            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const bookingIdValidator = validate(
  checkSchema(
    {
      booking_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: BOOKING_MESSAGES.INVALID_BOOKING_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const booking = await databaseService.bookings.findOne({ _id: new ObjectId(value) })
            if (!booking) {
              throw new ErrorWithStatus({
                message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)

export const ticketCodeValidator = validate(
  checkSchema(
    {
      ticket_code: {
        notEmpty: {
          errorMessage: BOOKING_MESSAGES.TICKET_CODE_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            const booking = await databaseService.bookings.findOne({ ticket_code: value })
            if (!booking) {
              throw new ErrorWithStatus({
                message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)
