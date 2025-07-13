import { Router } from 'express'
import {
  createPaymentController,
  getMyPaymentsController,
  getPaymentByIdController,
  updatePaymentStatusController,
  vnpayPaymentCallbackController,
  sepayPaymentCallbackController
} from '../controllers/payment.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import {
  createPaymentValidator,
  paymentIdValidator,
  updatePaymentStatusValidator
} from '../middlewares/payment.middlewares'
import { wrapAsync } from '../utils/handler'

const paymentsRouter = Router()

// All payment routes require authentication
paymentsRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createPaymentValidator,
  wrapAsync(createPaymentController)
)

// VNPay callback route - no auth required as it comes from VNPay
paymentsRouter.get('/vnpay-callback', wrapAsync(vnpayPaymentCallbackController))

// Sepay webhook route - no auth required as it comes from Sepay
paymentsRouter.post('/hooks/sepay-payment', wrapAsync(sepayPaymentCallbackController))

paymentsRouter.get('/my-payments', AccessTokenValidator, verifiedUserValidator, wrapAsync(getMyPaymentsController))

paymentsRouter.get(
  '/:payment_id',
  AccessTokenValidator,
  verifiedUserValidator,
  paymentIdValidator,
  wrapAsync(getPaymentByIdController)
)

// Admin only (to update payment status)
paymentsRouter.put(
  '/:payment_id/status',
  AccessTokenValidator,
  verifiedUserValidator,
  updatePaymentStatusValidator,
  wrapAsync(updatePaymentStatusController)
)

export default paymentsRouter
