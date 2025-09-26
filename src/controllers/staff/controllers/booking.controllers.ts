import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '../../../models/request/User.request'
import { GetBookingsReqQuery } from '../../../models/request/Booking.request'
import { BOOKING_MESSAGES } from '../../../constants/messages'
import staffBookingService from '../../../services/Staff/booking.services'

// Staff lấy danh sách bookings của theater mình quản lý với filter
export const staffGetMyTheaterBookingsController = async (
  req: Request<ParamsDictionary, any, any, GetBookingsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffBookingService.getMyTheaterBookings(user_id, req.query)
  
  res.json({
    message: BOOKING_MESSAGES.GET_BOOKINGS_SUCCESS,
    result
  })
}