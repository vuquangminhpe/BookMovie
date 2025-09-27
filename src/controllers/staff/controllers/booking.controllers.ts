import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '../../../models/request/User.request'
import { GetBookingsReqQuery } from '../../../models/request/Booking.request'
import { BOOKING_MESSAGES } from '../../../constants/messages'
import staffBookingService from '../../../services/Staff/booking.services'


export const staffGetMyTheaterBookingsController = async (
  req: Request<ParamsDictionary, any, any, GetBookingsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  
  console.log('🚀 NEW Staff Bookings Controller Called!')
  console.log('📝 Query params:', req.query)
  console.log('👤 Staff ID:', user_id)

  const result = await staffBookingService.getMyTheaterBookings(user_id, req.query)
  
  res.json({
    message: 'Get theater bookings with filters success',
    result
  })
}