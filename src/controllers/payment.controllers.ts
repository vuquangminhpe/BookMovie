import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { PAYMENT_MESSAGES } from '../constants/messages'
import {
  CreatePaymentReqBody,
  GetPaymentsReqQuery,
  PaymentIdReqParams,
  UpdatePaymentStatusReqBody,
  VnpayCallbackQuery
} from '../models/request/Payment.request'
import paymentService from '../services/payment.services'
import { TokenPayload } from '../models/request/User.request'
import HTTP_STATUS from '../constants/httpStatus'
import { PaymentMethod } from '../models/schemas/Payment.schema'

export const createPaymentController = async (
  req: Request<ParamsDictionary, any, CreatePaymentReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await paymentService.createPayment(user_id, req.body)
  if (req.body.payment_method === PaymentMethod.VNPAY) {
    res.json({
      message: PAYMENT_MESSAGES.CREATE_PAYMENT_SUCCESS,
      payment_id: result.payment_id,
      payment_url: (result as any).payment_url,
      order_id: (result as any).order_id
    })
  } else {
    res.json({
      message: PAYMENT_MESSAGES.CREATE_PAYMENT_SUCCESS,
      result
    })
  }
}

export const vnpayPaymentCallbackController = async (
  req: Request<ParamsDictionary, any, any, VnpayCallbackQuery>,
  res: Response
) => {
  try {
    const booking_id = req.query.booking_id

    if (!booking_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Missing booking_id parameter'
      })
    }

    const result = await paymentService.verifyVnpayPayment(req.query, booking_id)

    // Redirect to client with status
    const redirectUrl = `${process.env.CLIENT_URL}/booking/${booking_id}/payment-result?status=${result.success ? 'success' : 'failed'}&orderId=${req.query.vnp_TxnRef}`
    return res.redirect(redirectUrl)
  } catch (error) {
    console.error('VNPay callback error:', error)
    const booking_id = req.query.booking_id
    return res.redirect(`${process.env.CLIENT_URL}/booking/${booking_id}/payment-result?status=error`)
  }
}

export const getMyPaymentsController = async (
  req: Request<ParamsDictionary, any, any, GetPaymentsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await paymentService.getPayments(user_id, req.query)
  res.json({
    message: PAYMENT_MESSAGES.GET_PAYMENTS_SUCCESS,
    result
  })
}

export const getPaymentByIdController = async (req: Request<PaymentIdReqParams>, res: Response) => {
  const { payment_id } = req.params
  const result = await paymentService.getPaymentById(payment_id)
  res.json({
    message: PAYMENT_MESSAGES.GET_PAYMENT_SUCCESS,
    result
  })
}

export const updatePaymentStatusController = async (
  req: Request<PaymentIdReqParams, any, UpdatePaymentStatusReqBody>,
  res: Response
) => {
  const { payment_id } = req.params
  const result = await paymentService.updatePaymentStatus(payment_id, req.body)
  res.json({
    message: PAYMENT_MESSAGES.UPDATE_PAYMENT_SUCCESS,
    result
  })
}
