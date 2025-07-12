import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import moment from 'moment'
import qs from 'qs'
import { BookingStatus, PaymentStatus } from '../models/schemas/Booking.schema'
import Payment, { PaymentMethod } from '../models/schemas/Payment.schema'
import {
  CreatePaymentReqBody,
  GetPaymentsReqQuery,
  UpdatePaymentStatusReqBody
} from '../models/request/Payment.request'
import databaseService from './database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { BOOKING_MESSAGES, PAYMENT_MESSAGES } from '../constants/messages'
import { envConfig } from '../constants/config'
import { Request } from 'express'
import bookingExpirationService from './booking-expiration.services'

class PaymentService {
  // Sort object for VNPay signature generation
  private sortObject(obj: Record<string, any>) {
    let sorted: Record<string, any> = {}
    let str: string[] = []
    let key: string | number

    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key))
      }
    }

    str.sort()

    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+')
    }

    return sorted
  }

  async createPayment(user_id: string, payload: CreatePaymentReqBody) {
    if (payload.payment_method === PaymentMethod.VNPAY) {
      bookingExpirationService.clearExpirationJob(payload.booking_id)

      return this.createVnpayPayment(user_id, payload)
    }

    const payment_id = new ObjectId()

    // Get booking details
    const booking = await databaseService.bookings.findOne({
      _id: new ObjectId(payload.booking_id)
    })

    if (!booking) {
      throw new ErrorWithStatus({
        message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Verify user owns the booking
    if (booking.user_id.toString() !== user_id) {
      throw new ErrorWithStatus({
        message: 'You are not authorized to make payment for this booking',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if booking already has a completed payment
    if (booking.payment_status === PaymentStatus.COMPLETED) {
      throw new ErrorWithStatus({
        message: PAYMENT_MESSAGES.BOOKING_ALREADY_PAID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if payment already exists
    const existingPayment = await databaseService.payments.findOne({
      booking_id: new ObjectId(payload.booking_id)
    })

    if (existingPayment) {
      // If payment exists but is not completed, update it
      if (existingPayment.status !== PaymentStatus.COMPLETED) {
        await databaseService.payments.updateOne(
          { _id: existingPayment._id },
          {
            $set: {
              payment_method: payload.payment_method,
              transaction_id: payload.transaction_id,
              payment_time: new Date(),
              status: PaymentStatus.COMPLETED
            },
            $currentDate: { updated_at: true }
          }
        )

        // Update booking status
        await databaseService.bookings.updateOne(
          { _id: new ObjectId(payload.booking_id) },
          {
            $set: {
              payment_status: PaymentStatus.COMPLETED,
              status: BookingStatus.CONFIRMED
            },
            $currentDate: { updated_at: true }
          }
        )

        return { payment_id: existingPayment._id.toString() }
      } else {
        throw new ErrorWithStatus({
          message: PAYMENT_MESSAGES.BOOKING_ALREADY_PAID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Create new payment
    await databaseService.payments.insertOne(
      new Payment({
        _id: payment_id,
        booking_id: new ObjectId(payload.booking_id),
        user_id: new ObjectId(user_id),
        amount: booking.total_amount,
        payment_method: payload.payment_method,
        transaction_id: payload.transaction_id || '',
        payment_time: new Date(),
        status: PaymentStatus.COMPLETED
      })
    )

    // Update booking status
    await databaseService.bookings.updateOne(
      { _id: new ObjectId(payload.booking_id) },
      {
        $set: {
          payment_status: PaymentStatus.COMPLETED,
          status: BookingStatus.CONFIRMED
        },
        $currentDate: { updated_at: true }
      }
    )

    return { payment_id: payment_id.toString() }
  }

  async createVnpayPayment(user_id: string, payload: CreatePaymentReqBody) {
    const booking = await databaseService.bookings.findOne({
      _id: new ObjectId(payload.booking_id)
    })

    if (!booking) {
      throw new ErrorWithStatus({
        message: BOOKING_MESSAGES.BOOKING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Verify user owns the booking
    if (booking.user_id.toString() !== user_id) {
      throw new ErrorWithStatus({
        message: 'You are not authorized to make payment for this booking',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if booking already has a completed payment
    if (booking.payment_status === PaymentStatus.COMPLETED) {
      throw new ErrorWithStatus({
        message: PAYMENT_MESSAGES.BOOKING_ALREADY_PAID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    process.env.TZ = 'Asia/Ho_Chi_Minh'
    const date = new Date()
    const amount = booking.total_amount
    const orderId = moment(date).format('DDHHmmss')
    const payment_id = new ObjectId()

    // Create a pending payment record
    await databaseService.payments.insertOne(
      new Payment({
        _id: payment_id,
        booking_id: new ObjectId(payload.booking_id),
        user_id: new ObjectId(user_id),
        amount: amount,
        payment_method: PaymentMethod.VNPAY,
        order_id: orderId,
        status: PaymentStatus.COMPLETED //fix is pending
      })
    )

    const { vnpay_tmn_code, vnpay_hash_secret, vnpay_url, vnpay_return_url } = envConfig

    const createDate = moment(date).format('YYYYMMDDHHmmss')
    const ipAddr = '127.0.0.1'

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpay_tmn_code,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Payment for booking #${payload.booking_id}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // Amount in VND, multiply by 100 (smallest currency unit)
      vnp_ReturnUrl: `${vnpay_return_url}?booking_id=${payload.booking_id}`,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    }

    const sortedParams = this.sortObject(vnpParams)
    const signData = qs.stringify(sortedParams, { encode: false })
    const hmac = crypto.createHmac('sha512', vnpay_hash_secret as string)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
    const paymentUrl = vnpay_url + '?' + signData + '&vnp_SecureHash=' + signed

    // Update payment record with payment URL
    await databaseService.payments.updateOne(
      { _id: payment_id },
      {
        $set: {
          payment_url: paymentUrl,
          updated_at: new Date()
        }
      }
    )

    return {
      payment_id: payment_id.toString(),
      payment_url: paymentUrl,
      order_id: orderId
    }
  }

  async verifyVnpayPayment(queryParams: any, booking_id: string) {
    try {
      const secureHash = queryParams.vnp_SecureHash

      // Get a copy of the query params and delete secure hash parameters
      const vnpParams = { ...queryParams }
      delete vnpParams.vnp_SecureHash
      delete vnpParams.vnp_SecureHashType

      // Sort and re-sign for verification
      const sortedParams = this.sortObject(vnpParams)
      const signData = qs.stringify(sortedParams, { encode: false })
      const hmac = crypto.createHmac('sha512', envConfig.vnpay_hash_secret as string)
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

      // Verify signature
      if (secureHash !== signed) {
        // Update payment record
        const payment = await databaseService.payments.findOne({
          order_id: vnpParams.vnp_TxnRef,
          booking_id: new ObjectId(booking_id)
        })

        if (payment) {
          await databaseService.payments.updateOne(
            { _id: payment._id },
            {
              $set: {
                status: PaymentStatus.FAILED,
                error: 'Invalid signature',
                updated_at: new Date()
              }
            }
          )
        }

        return { success: false, message: 'Invalid signature' }
      }

      // Verify response code
      if (vnpParams.vnp_ResponseCode !== '00') {
        // Update payment record
        bookingExpirationService.clearExpirationJob(booking_id)

        const payment = await databaseService.payments.findOne({
          order_id: vnpParams.vnp_TxnRef,
          booking_id: new ObjectId(booking_id)
        })

        if (payment) {
          await databaseService.payments.updateOne(
            { _id: payment._id },
            {
              $set: {
                status: PaymentStatus.FAILED,
                error: `Payment failed with code: ${vnpParams.vnp_ResponseCode}`,
                transaction_id: vnpParams.vnp_TransactionNo || '',
                bank_code: vnpParams.vnp_BankCode || '',
                card_type: vnpParams.vnp_CardType || '',
                updated_at: new Date()
              }
            }
          )
        }

        return { success: false, message: `Payment failed with code: ${vnpParams.vnp_ResponseCode}` }
      }

      // Payment successful, update payment status and booking status
      const payment = await databaseService.payments.findOne({
        order_id: vnpParams.vnp_TxnRef,
        booking_id: new ObjectId(booking_id)
      })

      if (payment) {
        await databaseService.payments.updateOne(
          { _id: payment._id },
          {
            $set: {
              status: PaymentStatus.COMPLETED,
              transaction_id: vnpParams.vnp_TransactionNo || '',
              bank_code: vnpParams.vnp_BankCode || '',
              card_type: vnpParams.vnp_CardType || '',
              payment_time: new Date(),
              updated_at: new Date()
            }
          }
        )

        // Update booking status
        await databaseService.bookings.updateOne(
          { _id: new ObjectId(booking_id) },
          {
            $set: {
              payment_status: PaymentStatus.COMPLETED,
              status: BookingStatus.CONFIRMED
            },
            $currentDate: { updated_at: true }
          }
        )
      }

      return { success: true, message: 'Payment successful' }
    } catch (error) {
      console.error('Error verifying VNPay payment:', error)
      throw error
    }
  }

  async getPayments(user_id: string, query: GetPaymentsReqQuery) {
    const {
      page = '1',
      limit = '10',
      status,
      payment_method,
      sort_by = 'payment_time',
      sort_order = 'desc',
      date_from,
      date_to
    } = query

    const filter: any = { user_id: new ObjectId(user_id) }

    // Filter by status
    if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      filter.status = status
    }

    // Filter by payment method
    if (payment_method && Object.values(PaymentMethod).includes(payment_method as PaymentMethod)) {
      filter.payment_method = payment_method
    }

    // Filter by date range
    if (date_from || date_to) {
      filter.payment_time = {}
      if (date_from) {
        filter.payment_time.$gte = new Date(date_from)
      }
      if (date_to) {
        filter.payment_time.$lte = new Date(date_to)
      }
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of payments matching the filter
    const totalPayments = await databaseService.payments.countDocuments(filter)

    // Get payments with pagination
    const payments = await databaseService.payments.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enrich payments with booking details
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const booking = await databaseService.bookings.findOne({ _id: payment.booking_id })

        if (booking) {
          const [movie, theater, showtime] = await Promise.all([
            databaseService.movies.findOne({ _id: booking.movie_id }),
            databaseService.theaters.findOne({ _id: booking.theater_id }),
            databaseService.showtimes.findOne({ _id: booking.showtime_id })
          ])

          return {
            ...payment,
            booking: {
              _id: booking._id,
              ticket_code: booking.ticket_code,
              status: booking.status,
              seats: booking.seats.length,
              total_amount: booking.total_amount
            },
            movie: movie
              ? {
                  _id: movie._id,
                  title: movie.title
                }
              : null,
            theater: theater
              ? {
                  _id: theater._id,
                  name: theater.name
                }
              : null,
            showtime: showtime
              ? {
                  _id: showtime._id,
                  start_time: showtime.start_time
                }
              : null
          }
        }

        return payment
      })
    )

    return {
      payments: enrichedPayments,
      total: totalPayments,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalPayments / limitNum)
    }
  }

  async getPaymentById(payment_id: string) {
    const payment = await databaseService.payments.findOne({ _id: new ObjectId(payment_id) })

    if (payment) {
      const booking = await databaseService.bookings.findOne({ _id: payment.booking_id })

      if (booking) {
        const [movie, theater, showtime] = await Promise.all([
          databaseService.movies.findOne({ _id: booking.movie_id }),
          databaseService.theaters.findOne({ _id: booking.theater_id }),
          databaseService.showtimes.findOne({ _id: booking.showtime_id })
        ])

        return {
          ...payment,
          booking: {
            _id: booking._id,
            ticket_code: booking.ticket_code,
            status: booking.status,
            seats: booking.seats,
            total_amount: booking.total_amount
          },
          movie: movie
            ? {
                _id: movie._id,
                title: movie.title,
                poster_url: movie.poster_url
              }
            : null,
          theater: theater
            ? {
                _id: theater._id,
                name: theater.name,
                location: theater.location
              }
            : null,
          showtime: showtime
            ? {
                _id: showtime._id,
                start_time: showtime.start_time,
                end_time: showtime.end_time
              }
            : null
        }
      }
    }

    return payment
  }

  async updatePaymentStatus(payment_id: string, payload: UpdatePaymentStatusReqBody) {
    const payment = await databaseService.payments.findOne({ _id: new ObjectId(payment_id) })

    if (!payment) {
      throw new ErrorWithStatus({
        message: PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Update payment
    const updatePayload: any = { status: payload.status }
    if (payload.transaction_id) {
      updatePayload.transaction_id = payload.transaction_id
    }

    await databaseService.payments.updateOne(
      { _id: new ObjectId(payment_id) },
      {
        $set: updatePayload,
        $currentDate: { updated_at: true }
      }
    )

    // Update booking payment status
    if (payload.status === PaymentStatus.COMPLETED) {
      await databaseService.bookings.updateOne(
        { _id: payment.booking_id },
        {
          $set: {
            payment_status: PaymentStatus.COMPLETED,
            status: BookingStatus.CONFIRMED
          },
          $currentDate: { updated_at: true }
        }
      )
    } else if (payload.status === PaymentStatus.FAILED) {
      await databaseService.bookings.updateOne(
        { _id: payment.booking_id },
        {
          $set: { payment_status: PaymentStatus.FAILED },
          $currentDate: { updated_at: true }
        }
      )
    } else if (payload.status === PaymentStatus.REFUNDED) {
      await databaseService.bookings.updateOne(
        { _id: payment.booking_id },
        {
          $set: {
            payment_status: PaymentStatus.REFUNDED,
            status: BookingStatus.CANCELLED
          },
          $currentDate: { updated_at: true }
        }
      )
    }

    return { payment_id }
  }
}

const paymentService = new PaymentService()
export default paymentService
