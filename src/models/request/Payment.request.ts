import { ParamsDictionary } from 'express-serve-static-core'
import { PaymentMethod } from '../../models/schemas/Payment.schema'
import { PaymentStatus } from '../../models/schemas/Booking.schema'

export interface CreatePaymentReqBody {
  booking_id: string
  payment_method: PaymentMethod
  transaction_id?: string
}

export interface UpdatePaymentStatusReqBody {
  status: PaymentStatus
  transaction_id?: string
}

export interface PaymentIdReqParams extends ParamsDictionary {
  payment_id: string
}

export interface GetPaymentsReqQuery {
  page?: string
  limit?: string
  status?: string
  payment_method?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
}
