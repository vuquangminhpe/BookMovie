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
import { sendEmail } from '~/utils/sendmail'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { BookingStatus, PaymentStatus } from '~/models/schemas/Booking.schema'
import paymentExpirationService from '~/services/payment-expiration.services'

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

    const booking = await databaseService.bookings.findOne({
      _id: new ObjectId(booking_id)
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    const [user, movie, theater, showtime, payment] = await Promise.all([
      databaseService.users.findOne({ _id: booking.user_id }),
      databaseService.movies.findOne({ _id: booking.movie_id }),
      databaseService.theaters.findOne({ _id: booking.theater_id }),
      databaseService.showtimes.findOne({ _id: booking.showtime_id }),
      databaseService.payments.findOne({ booking_id: booking._id })
    ])

    if (!user) {
      throw new Error('User not found')
    }

    const emailContent = result.success
      ? generateSuccessEmailTemplate({
          user,
          booking,
          movie,
          theater,
          showtime,
          payment,
          transactionId: req.query.vnp_TxnRef
        })
      : generateFailedEmailTemplate({
          user,
          booking,
          movie,
          theater,
          showtime,
          reason: result.message || 'Payment processing failed'
        })

    const emailSubject = result.success
      ? `Booking Confirmed - ${movie?.title || 'Movie Ticket'}`
      : `Payment Failed - Booking ${booking.ticket_code}`

    await sendEmail(user.email, emailSubject, emailContent)

    const redirectUrl = `${process.env.CLIENT_URL}/booking/${booking_id}/payment-result?status=${result.success ? 'success' : 'failed'}&orderId=${req.query.vnp_TxnRef}`
    return res.redirect(redirectUrl)
  } catch (error) {
    console.error('VNPay callback error:', error)
    const booking_id = req.query.booking_id

    return res.redirect(`${process.env.CLIENT_URL}/booking/${booking_id}/payment-result?status=error`)
  }
}

// Success Email Template
function generateSuccessEmailTemplate({
  user,
  booking,
  movie,
  theater,
  showtime,
  payment,
  transactionId
}: {
  user: any
  booking: any
  movie: any
  theater: any
  showtime: any
  payment: any
  transactionId: string
}): string {
  const showtimeDate = new Date(showtime?.start_time).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const showtimeTime = new Date(showtime?.start_time).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const seatsList = booking.seats.map((seat: any) => `${seat.row}${seat.number}`).join(', ')

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận đặt vé thành công</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 28px; margin-bottom: 10px; }
            .header p { opacity: 0.9; font-size: 16px; }
            .content { padding: 30px; }
            .success-badge { background: #28a745; color: white; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .success-badge h2 { font-size: 24px; margin-bottom: 5px; }
            .ticket-info { background: #f8f9fa; border-radius: 15px; padding: 25px; margin-bottom: 25px; border-left: 5px solid #007bff; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
            .info-row:last-child { border-bottom: none; margin-bottom: 0; }
            .info-label { font-weight: 600; color: #555; }
            .info-value { color: #333; font-weight: 500; }
            .movie-poster { width: 80px; height: 120px; border-radius: 8px; object-fit: cover; float: left; margin-right: 20px; }
            .movie-details { overflow: hidden; }
            .movie-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px; }
            .payment-details { background: #e8f5e8; border-radius: 10px; padding: 20px; margin: 25px 0; }
            .payment-details h3 { color: #28a745; margin-bottom: 15px; font-size: 18px; }
            .qr-section { text-align: center; margin: 30px 0; padding: 25px; background: #f8f9fa; border-radius: 15px; }
            .ticket-code { font-size: 24px; font-weight: bold; color: #007bff; background: white; padding: 15px; border-radius: 10px; letter-spacing: 2px; margin: 15px 0; display: inline-block; border: 2px dashed #007bff; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
            .cta-button:hover { transform: translateY(-2px); }
            .footer { background: #343a40; color: white; padding: 25px; text-align: center; }
            .footer p { margin-bottom: 10px; }
            .social-links { margin-top: 15px; }
            .social-links a { color: #fff; text-decoration: none; margin: 0 10px; }
            @media (max-width: 600px) {
                .content { padding: 20px; }
                .info-row { flex-direction: column; }
                .info-label { margin-bottom: 5px; }
                .movie-poster { width: 60px; height: 90px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🎬 MovieBooking Cinema</h1>
                <p>Cảm ơn bạn đã chọn chúng tôi!</p>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Success Message -->
                <div class="success-badge">
                    <h2>Thanh toán thành công!</h2>
                    <p>Vé của bạn đã được xác nhận</p>
                </div>

                <!-- Greeting -->
                <p style="font-size: 16px; margin-bottom: 25px;">
                    Chào <strong>${user.name || user.email}</strong>,
                </p>
                <p style="margin-bottom: 25px;">
                    Cảm ơn bạn đã đặt vé tại MovieBooking Cinema. Thanh toán của bạn đã được xử lý thành công và vé đã được xác nhận.
                </p>

                <!-- Movie Info -->
                <div class="ticket-info">
                    ${movie?.poster_url ? `<img src="${movie.poster_url}" alt="${movie?.title}" class="movie-poster">` : ''}
                    <div class="movie-details">
                        <div class="movie-title">${movie?.title || 'N/A'}</div>
                        <div style="color: #666; margin-bottom: 20px;">
                            Thời lượng: ${movie?.duration || 'N/A'} phút | 
                            Thể loại: ${movie?.genre?.join(', ') || 'N/A'}
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                </div>

                <!-- Booking Details -->
                <div class="ticket-info">
                    <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px;">Thông tin đặt vé</h3>
                    <div class="info-row">
                        <span class="info-label">Mã vé:</span>
                        <span class="info-value"><strong>${booking.ticket_code}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Rạp chiếu:</span>
                        <span class="info-value">${theater?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Địa chỉ:</span>
                        <span class="info-value">${theater?.location || theater?.address || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Ngày chiếu:</span>
                        <span class="info-value">${showtimeDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Giờ chiếu:</span>
                        <span class="info-value">${showtimeTime}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Ghế ngồi:</span>
                        <span class="info-value"><strong>${seatsList}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Số lượng vé:</span>
                        <span class="info-value">${booking.seats.length} vé</span>
                    </div>
                </div>

                <!-- Payment Details -->
                <div class="payment-details">
                    <h3>Thông tin thanh toán</h3>
                    <div class="info-row">
                        <span class="info-label">Tổng tiền:</span>
                        <span class="info-value"><strong>${booking.total_amount.toLocaleString('vi-VN')} VNĐ</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phương thức:</span>
                        <span class="info-value">VNPay</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mã giao dịch:</span>
                        <span class="info-value">${transactionId}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Thời gian:</span>
                        <span class="info-value">${new Date().toLocaleString('vi-VN')}</span>
                    </div>
                </div>

                <!-- QR Code Section -->
                <div class="qr-section">
                    <h3 style="margin-bottom: 15px;">Mã vé điện tử</h3>
                    <p style="margin-bottom: 15px;">Vui lòng xuất trình mã vé này tại quầy để nhận vé</p>
                    <div class="ticket-code">${booking.ticket_code}</div>
                    <p style="font-size: 14px; color: #666; margin-top: 15px;">
                        * Vui lòng đến trước giờ chiếu 15 phút để làm thủ tục nhận vé
                    </p>
                </div>

                <!-- Call to Action -->
                <div style="text-align: center;">
                    <a href="${process.env.CLIENT_URL}/bookings/${booking._id}" class="cta-button">
                        Xem chi tiết đặt vé
                    </a>
                </div>

                <!-- Important Notes -->
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin-top: 25px;">
                    <h4 style="color: #856404; margin-bottom: 10px;">Lưu ý quan trọng:</h4>
                    <ul style="color: #856404; padding-left: 20px;">
                        <li>Vui lòng có mặt tại rạp trước giờ chiếu 15 phút</li>
                        <li>Mang theo mã vé và giấy tờ tùy thân để nhận vé</li>
                        <li>Vé không thể hoàn trả sau khi đã thanh toán</li>
                        <li>Liên hệ hotline nếu cần hỗ trợ: 1900-xxxx</li>
                    </ul>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>MovieBooking Cinema</strong></p>
                <p>support@moviebooking.com | 1900-xxxx</p>
                <p>www.moviebooking.com</p>
                <div class="social-links">
                    <a href="#">Facebook</a> | 
                    <a href="#">Instagram</a> | 
                    <a href="#">YouTube</a>
                </div>
                <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
                    © 2025 MovieBooking Cinema. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}

// Failed Email Template
function generateFailedEmailTemplate({
  user,
  booking,
  movie,
  theater,
  showtime,
  reason
}: {
  user: any
  booking: any
  movie: any
  theater: any
  showtime: any
  reason: string
}): string {
  const showtimeDate = new Date(showtime?.start_time).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const showtimeTime = new Date(showtime?.start_time).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanh toán không thành công</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 28px; margin-bottom: 10px; }
            .header p { opacity: 0.9; font-size: 16px; }
            .content { padding: 30px; }
            .error-badge { background: #dc3545; color: white; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .error-badge h2 { font-size: 24px; margin-bottom: 5px; }
            .ticket-info { background: #f8f9fa; border-radius: 15px; padding: 25px; margin-bottom: 25px; border-left: 5px solid #dc3545; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
            .info-row:last-child { border-bottom: none; margin-bottom: 0; }
            .info-label { font-weight: 600; color: #555; }
            .info-value { color: #333; font-weight: 500; }
            .retry-section { background: #e7f3ff; border-radius: 15px; padding: 25px; margin: 25px 0; text-align: center; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #001affff, #0056b3); color: #000; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 10px; transition: transform 0.2s; }
            .cta-button:hover { transform: translateY(-2px); }
            .secondary-button { background: linear-gradient(135deg, #6c757d, #495057); }
            .footer { background: #343a40; color: white; padding: 25px; text-align: center; }
            .footer p { margin-bottom: 10px; }
            @media (max-width: 600px) {
                .content { padding: 20px; }
                .info-row { flex-direction: column; }
                .info-label { margin-bottom: 5px; }
                .cta-button { display: block; margin: 10px 0; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>MovieBooking Cinema</h1>
                <p>Thông báo thanh toán</p>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Error Message -->
                <div class="error-badge">
                    <h2>Thanh toán không thành công</h2>
                    <p>Đã xảy ra lỗi trong quá trình thanh toán</p>
                </div>

                <!-- Greeting -->
                <p style="font-size: 16px; margin-bottom: 25px;">
                    Chào <strong>${user.name || user.email}</strong>,
                </p>
                <p style="margin-bottom: 25px;">
                    Rất tiếc, thanh toán cho đặt vé của bạn không thành công. Vé chưa được xác nhận và bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
                </p>

                <!-- Error Details -->
                <div class="ticket-info">
                    <h3 style="color: #dc3545; margin-bottom: 15px; font-size: 18px;">Chi tiết lỗi</h3>
                    <div class="info-row">
                        <span class="info-label">Mã đặt vé:</span>
                        <span class="info-value">${booking.ticket_code}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Lý do:</span>
                        <span class="info-value" style="color: #dc3545;">Lỗi trong quá trình thanh toán</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Thời gian:</span>
                        <span class="info-value">${new Date().toLocaleString('vi-VN')}</span>
                    </div>
                </div>

                <!-- Booking Details -->
                <div class="ticket-info">
                    <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px;">📋 Thông tin đặt vé</h3>
                    <div class="info-row">
                        <span class="info-label">Phim:</span>
                        <span class="info-value">${movie?.title || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Rạp:</span>
                        <span class="info-value">${theater?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Ngày chiếu:</span>
                        <span class="info-value">${showtimeDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Giờ chiếu:</span>
                        <span class="info-value">${showtimeTime}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Số tiền:</span>
                        <span class="info-value"><strong>${booking.total_amount.toLocaleString('vi-VN')} VNĐ</strong></span>
                    </div>
                </div>

                <!-- Retry Section -->
                <div class="retry-section">
                    <h3 style="margin-bottom: 15px; color: #007bff;">Hướng dẫn tiếp theo</h3>
                    <p style="margin-bottom: 20px;">
                        Bạn có thể thử thanh toán lại hoặc chọn phương thức thanh toán khác. 
                        Vé sẽ vẫn được giữ trong <strong>15 phút</strong> để bạn hoàn tất thanh toán.
                    </p>
                    
                    <a href="${process.env.CLIENT_URL}/booking/${booking._id}/payment" class="cta-button">
                        Thử thanh toán lại
                    </a>
                    
                    <a href="${process.env.CLIENT_URL}/movies" class="cta-button secondary-button">
                        Chọn phim khác
                    </a>
                </div>

                <!-- Support Section -->
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-top: 25px;">
                    <h4 style="color: #495057; margin-bottom: 15px;">Cần hỗ trợ?</h4>
                    <p style="margin-bottom: 10px;">
                        Nếu bạn tiếp tục gặp sự cố, vui lòng liên hệ với chúng tôi:
                    </p>
                    <ul style="padding-left: 20px; color: #495057;">
                        <li> Hotline: 1900-xxxx (24/7)</li>
                        <li> Email: support@moviebooking.com</li>
                        <li> Live Chat trên website</li>
                    </ul>
                </div>

                <!-- Alternative Payment Methods -->
                <div style="background: #e8f5e8; border-radius: 10px; padding: 20px; margin-top: 25px;">
                    <h4 style="color: #28a745; margin-bottom: 15px;">Phương thức thanh toán khác</h4>
                    <p style="margin-bottom: 10px;">Bạn có thể sử dụng:</p>
                    <ul style="padding-left: 20px; color: #28a745;">
                        <li>Thẻ tín dụng / Thẻ ghi nợ</li>
                        <li>Ví điện tử (MoMo, ZaloPay, ShopeePay)</li>
                        <li>Chuyển khoản ngân hàng</li>
                        <li>Thanh toán tại quầy</li>
                    </ul>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>MovieBooking Cinema</strong></p>
                <p>support@moviebooking.com | 1900-xxxx</p>
                <p>www.moviebooking.com</p>
                <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
                    © 2025 MovieBooking Cinema. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
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

export const sepayPaymentCallbackController = async (req: Request, res: Response) => {
  try {
    console.log('🏦 Sepay webhook received:', req.body)

    const sepayData = req.body

    if (!sepayData.content || !sepayData.transferAmount || sepayData.transferType !== 'in') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid Sepay webhook data'
      })
    }

    const ticketCode_Split = sepayData.content.trim().split(' ')[2]
    const ticketCode = ticketCode_Split ? ticketCode_Split.split('-')[0] : sepayData.content.trim()
    const transferAmount = sepayData.transferAmount
    const transactionId = sepayData.referenceCode || sepayData.id

    const booking = await databaseService.bookings.findOne({ ticket_code: ticketCode })

    if (!booking) {
      console.error(`❌ Booking not found for ticket code: ${ticketCode}`)
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Booking not found'
      })
    }

    if (booking.payment_status === PaymentStatus.COMPLETED) {
      console.log(`✅ Booking ${booking._id} already paid`)
      return res.json({
        success: true,
        message: 'Payment already processed'
      })
    }

    if (transferAmount < booking.total_amount) {
      console.error(`❌ Insufficient payment amount. Expected: ${booking.total_amount}, Received: ${transferAmount}`)
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Insufficient payment amount'
      })
    }

    const existingPayment = await databaseService.payments.findOne({
      booking_id: booking._id
    })

    let payment_id: ObjectId

    if (existingPayment) {
      // Clear payment expiration job since payment is completed
      paymentExpirationService.clearPaymentExpirationJob(existingPayment._id.toString())

      await databaseService.payments.updateOne(
        { _id: existingPayment._id },
        {
          $set: {
            payment_method: PaymentMethod.SEPAY,
            transaction_id: transactionId,
            bank_code: sepayData.gateway || '',
            payment_time: new Date(sepayData.transactionDate),
            status: PaymentStatus.COMPLETED,
            updated_at: new Date()
          }
        }
      )
      payment_id = existingPayment._id
    } else {
      payment_id = new ObjectId()
      await databaseService.payments.insertOne({
        _id: payment_id,
        booking_id: booking._id,
        user_id: booking.user_id,
        amount: transferAmount,
        payment_method: PaymentMethod.SEPAY,
        transaction_id: transactionId,
        bank_code: sepayData.gateway || '',
        payment_time: new Date(sepayData.transactionDate),
        status: PaymentStatus.COMPLETED,
        created_at: new Date(),
        updated_at: new Date(),
        order_id: '',
        card_type: '',
        admin_note: '',
        error: '',
        payment_url: ''
      })
    }

    await databaseService.bookings.updateOne(
      { _id: booking._id },
      {
        $set: {
          payment_status: PaymentStatus.COMPLETED,
          status: BookingStatus.CONFIRMED,
          updated_at: new Date()
        }
      }
    )

    const [user, movie, theater, showtime, payment] = await Promise.all([
      databaseService.users.findOne({ _id: booking.user_id }),
      databaseService.movies.findOne({ _id: booking.movie_id }),
      databaseService.theaters.findOne({ _id: booking.theater_id }),
      databaseService.showtimes.findOne({ _id: booking.showtime_id }),
      databaseService.payments.findOne({ _id: payment_id })
    ])

    if (user) {
      const emailContent = generateSepaySuccessEmailTemplate({
        user,
        booking,
        movie,
        theater,
        showtime,
        payment,
        transactionId: transactionId
      })

      const emailSubject = `Booking Confirmed - ${movie?.title || 'Movie Ticket'}`
      await sendEmail(user.email, emailSubject, emailContent)
    }

    console.log(`✅ Sepay payment processed successfully for booking ${booking._id}`)

    res.json({
      success: true,
      message: 'Payment processed successfully',
      booking_id: booking._id.toString()
    })
  } catch (error) {
    console.error('❌ Sepay webhook error:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

function generateSepaySuccessEmailTemplate({
  user,
  booking,
  movie,
  theater,
  showtime,
  payment,
  transactionId
}: {
  user: any
  booking: any
  movie: any
  theater: any
  showtime: any
  payment: any
  transactionId: string
}): string {
  const showtimeDate = new Date(showtime?.start_time).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const showtimeTime = new Date(showtime?.start_time).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const seatsList = booking.seats.map((seat: any) => `${seat.row}${seat.number}`).join(', ')

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận đặt vé thành công</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 28px; margin-bottom: 10px; }
            .header p { opacity: 0.9; font-size: 16px; }
            .content { padding: 30px; }
            .success-badge { background: #28a745; color: white; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .success-badge h2 { font-size: 24px; margin-bottom: 5px; }
            .ticket-info { background: #f8f9fa; border-radius: 15px; padding: 25px; margin-bottom: 25px; border-left: 5px solid #007bff; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
            .info-row:last-child { border-bottom: none; margin-bottom: 0; }
            .info-label { font-weight: 600; color: #555; }
            .info-value { color: #333; font-weight: 500; }
            .payment-details { background: #e8f5e8; border-radius: 10px; padding: 20px; margin: 25px 0; }
            .payment-details h3 { color: #28a745; margin-bottom: 15px; font-size: 18px; }
            .qr-section { text-align: center; margin: 30px 0; padding: 25px; background: #f8f9fa; border-radius: 15px; }
            .ticket-code { font-size: 24px; font-weight: bold; color: #007bff; background: white; padding: 15px; border-radius: 10px; letter-spacing: 2px; margin: 15px 0; display: inline-block; border: 2px dashed #007bff; }
            .footer { background: #343a40; color: white; padding: 25px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎬 MovieBooking Cinema</h1>
                <p>Cảm ơn bạn đã chọn chúng tôi!</p>
            </div>

            <div class="content">
                <div class="success-badge">
                    <h2>Thanh toán thành công!</h2>
                    <p>Vé của bạn đã được xác nhận</p>
                </div>

                <p style="font-size: 16px; margin-bottom: 25px;">
                    Chào <strong>${user.name || user.email}</strong>,
                </p>
                <p style="margin-bottom: 25px;">
                    Cảm ơn bạn đã đặt vé tại MovieBooking Cinema. Thanh toán qua chuyển khoản ngân hàng của bạn đã được xử lý thành công và vé đã được xác nhận.
                </p>

                <div class="ticket-info">
                    <h3 style="color: #007bff; margin-bottom: 15px; font-size: 18px;">Thông tin đặt vé</h3>
                    <div class="info-row">
                        <span class="info-label">Mã vé:</span>
                        <span class="info-value"><strong>${booking.ticket_code}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phim:</span>
                        <span class="info-value">${movie?.title || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Rạp chiếu:</span>
                        <span class="info-value">${theater?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Ngày chiếu:</span>
                        <span class="info-value">${showtimeDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Giờ chiếu:</span>
                        <span class="info-value">${showtimeTime}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Ghế ngồi:</span>
                        <span class="info-value"><strong>${seatsList}</strong></span>
                    </div>
                </div>

                <div class="payment-details">
                    <h3>Thông tin thanh toán</h3>
                    <div class="info-row">
                        <span class="info-label">Tổng tiền:</span>
                        <span class="info-value"><strong>${booking.total_amount.toLocaleString('vi-VN')} VNĐ</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phương thức:</span>
                        <span class="info-value">Chuyển khoản ngân hàng</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mã giao dịch:</span>
                        <span class="info-value">${transactionId}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Thời gian:</span>
                        <span class="info-value">${new Date().toLocaleString('vi-VN')}</span>
                    </div>
                </div>

                <div class="qr-section">
                    <h3 style="margin-bottom: 15px;">Mã vé điện tử</h3>
                    <p style="margin-bottom: 15px;">Vui lòng xuất trình mã vé này tại quầy để nhận vé</p>
                    <div class="ticket-code">${booking.ticket_code}</div>
                    <p style="font-size: 14px; color: #666; margin-top: 15px;">
                        * Vui lòng đến trước giờ chiếu 15 phút để làm thủ tục nhận vé
                    </p>
                </div>
            </div>

            <div class="footer">
                <p><strong>MovieBooking Cinema</strong></p>
                <p>support@moviebooking.com | 1900-xxxx</p>
                <p>© 2025 MovieBooking Cinema. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `
}
