import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { BOOKING_MESSAGES, PAYMENT_MESSAGES } from '../constants/messages'
import { PaymentStatus } from '../models/schemas/Booking.schema'
import { PaymentMethod } from '../models/schemas/Payment.schema'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

export const createPaymentValidator = validate(
  checkSchema(
    {
      booking_id: {
        notEmpty: {
          errorMessage: PAYMENT_MESSAGES.BOOKING_ID_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PAYMENT_MESSAGES.INVALID_BOOKING_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const booking = await databaseService.bookings.findOne({ _id: new ObjectId(value) })
            if (!booking) {
              throw new ErrorWithStatus({
                message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Check if booking already has a payment
            const existingPayment = await databaseService.payments.findOne({ booking_id: new ObjectId(value) })
            if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
              throw new ErrorWithStatus({
                message: PAYMENT_MESSAGES.BOOKING_ALREADY_PAID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            return true
          }
        }
      },
      payment_method: {
        notEmpty: {
          errorMessage: PAYMENT_MESSAGES.PAYMENT_METHOD_IS_REQUIRED
        },
        isIn: {
          options: [Object.values(PaymentMethod)],
          errorMessage: PAYMENT_MESSAGES.INVALID_PAYMENT_METHOD
        }
      },
      transaction_id: {
        optional: true,
        isString: {
          errorMessage: 'Transaction ID must be a string'
        }
      }
    },
    ['body']
  )
)

export const updatePaymentStatusValidator = validate(
  checkSchema(
    {
      payment_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PAYMENT_MESSAGES.INVALID_PAYMENT_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const payment = await databaseService.payments.findOne({ _id: new ObjectId(value) })
            if (!payment) {
              throw new ErrorWithStatus({
                message: PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Cannot update if payment is already completed
            if (payment.status === PaymentStatus.COMPLETED) {
              throw new ErrorWithStatus({
                message: PAYMENT_MESSAGES.PAYMENT_ALREADY_COMPLETED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            return true
          }
        }
      },
      status: {
        notEmpty: {
          errorMessage: 'Status is required'
        },
        isIn: {
          options: [Object.values(PaymentStatus)],
          errorMessage: PAYMENT_MESSAGES.INVALID_STATUS
        }
      },
      transaction_id: {
        optional: true,
        isString: {
          errorMessage: 'Transaction ID must be a string'
        }
      }
    },
    ['params', 'body']
  )
)

export const paymentIdValidator = validate(
  checkSchema(
    {
      payment_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PAYMENT_MESSAGES.INVALID_PAYMENT_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const payment = await databaseService.payments.findOne({ _id: new ObjectId(value) })
            if (!payment) {
              throw new ErrorWithStatus({
                message: PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)
