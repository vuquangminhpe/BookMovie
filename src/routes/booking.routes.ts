import { Router } from 'express'
import {
  createBookingController,
  getBookingByIdController,
  getBookingByTicketCodeController,
  getMyBookingsController,
  updateBookingStatusController
} from '../controllers/bookings.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import {
  bookingIdValidator,
  createBookingValidator,
  ticketCodeValidator,
  updateBookingStatusValidator
} from '../middlewares/booking.middlewares'
import { wrapAsync } from '../utils/handler'

const bookingsRouter = Router()

// User bookings - requires authentication
bookingsRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createBookingValidator,
  wrapAsync(createBookingController)
)

bookingsRouter.get('/my-bookings', AccessTokenValidator, verifiedUserValidator, wrapAsync(getMyBookingsController))

bookingsRouter.get(
  '/:booking_id',
  AccessTokenValidator,
  verifiedUserValidator,
  bookingIdValidator,
  wrapAsync(getBookingByIdController)
)

// Public endpoint to verify a ticket by code (for theater staff)
bookingsRouter.get('/verify/:ticket_code', ticketCodeValidator, wrapAsync(getBookingByTicketCodeController))

// Update booking status (cancel booking)
bookingsRouter.put(
  '/:booking_id/status',
  AccessTokenValidator,
  verifiedUserValidator,
  updateBookingStatusValidator,
  wrapAsync(updateBookingStatusController)
)

export default bookingsRouter
