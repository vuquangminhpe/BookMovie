import { ParamsDictionary } from 'express-serve-static-core'
import { BookingStatus } from '../../models/schemas/Booking.schema'
import { SeatType } from '../../models/schemas/Screen.schema'

export interface CreateBookingReqBody {
  showtime_id: string
  seats: Array<{
    row: string
    number: number
    type: SeatType
  }>
}

export interface UpdateBookingStatusReqBody {
  status: BookingStatus
}

export interface BookingIdReqParams extends ParamsDictionary {
  booking_id: string
}

export interface TicketCodeReqParams extends ParamsDictionary {
  ticket_code: string
}

export interface GetBookingsReqQuery {
  page?: string
  limit?: string
  status?: string
  payment_status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
}
