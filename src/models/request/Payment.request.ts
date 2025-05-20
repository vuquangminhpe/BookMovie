import { PaymentMethod } from '../schemas/Payment.schema'
import { PaymentStatus } from '../schemas/Booking.schema'

export interface PaymentIdReqParams {
  payment_id: string
}

export interface CreatePaymentReqBody {
  booking_id: string
  payment_method: PaymentMethod
  transaction_id?: string
}

export interface UpdatePaymentStatusReqBody {
  status: PaymentStatus
  transaction_id?: string
}

export interface GetPaymentsReqQuery {
  page?: string
  limit?: string
  status?: string
  payment_method?: string
  sort_by?: string
  sort_order?: string
  date_from?: string
  date_to?: string
}

export interface VnpayCallbackQuery {
  vnp_Amount: string
  vnp_BankCode: string
  vnp_BankTranNo?: string
  vnp_CardType?: string
  vnp_OrderInfo: string
  vnp_PayDate: string
  vnp_ResponseCode: string
  vnp_TmnCode: string
  vnp_TransactionNo?: string
  vnp_TransactionStatus?: string
  vnp_TxnRef: string
  vnp_SecureHash: string
  booking_id?: string
}
