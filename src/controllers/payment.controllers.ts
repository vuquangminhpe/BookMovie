import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { PAYMENT_MESSAGES } from '../constants/messages'
import {
  CreatePaymentReqBody,
  GetPaymentsReqQuery,
  PaymentIdReqParams,
  UpdatePaymentStatusReqBody
} from '../models/request/Payment.request'
import paymentService from '../services/payment.services'
import { TokenPayload } from '../models/request/User.request'

export const createPaymentController = async (
  req: Request<ParamsDictionary, any, CreatePaymentReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await paymentService.createPayment(user_id, req.body)
  res.json({
    message: PAYMENT_MESSAGES.CREATE_PAYMENT_SUCCESS,
    result
  })
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
