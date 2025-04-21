import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKING_MESSAGES } from '../constants/messages'
import {
  BookingIdReqParams,
  CreateBookingReqBody,
  GetBookingsReqQuery,
  TicketCodeReqParams,
  UpdateBookingStatusReqBody
} from '../models/request/Booking.request'
import bookingService from '../services/booking.services'
import { TokenPayload } from '../models/request/User.request'

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
