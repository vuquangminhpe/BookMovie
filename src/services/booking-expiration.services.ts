import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { BookingStatus, PaymentStatus } from '../models/schemas/Booking.schema'
import seatLockService from './seat-lock.services'
import notificationService from './notification.services'
import { NotificationTypes } from '../models/schemas/Notification.schema'

class BookingExpirationService {
  private expirationJobs: Map<string, NodeJS.Timeout> = new Map()

  // Schedule booking expiration
  scheduleBookingExpiration(booking_id: string, expirationMinutes: number = 5) {
    // Clear existing job nếu có
    this.clearExpirationJob(booking_id)

    // Tạo job mới
    const timeoutId = setTimeout(
      async () => {
        await this.expireBooking(booking_id)
        this.expirationJobs.delete(booking_id)
      },
      expirationMinutes * 60 * 1000
    )

    // Lưu job
    this.expirationJobs.set(booking_id, timeoutId)

    console.log(`Scheduled expiration for booking ${booking_id} in ${expirationMinutes} minutes`)
  }

  // Clear expiration job (khi booking được thanh toán)
  clearExpirationJob(booking_id: string) {
    const existingJob = this.expirationJobs.get(booking_id)
    if (existingJob) {
      clearTimeout(existingJob)
      this.expirationJobs.delete(booking_id)
      console.log(`Cleared expiration job for booking ${booking_id}`)
    }
  }

  // Expire booking
  private async expireBooking(booking_id: string) {
    try {
      const booking = await databaseService.bookings.findOne({
        _id: new ObjectId(booking_id)
      })

      if (!booking) {
        console.log(`Booking ${booking_id} not found for expiration`)
        return
      }

      // Chỉ expire nếu booking vẫn ở trạng thái PENDING và chưa thanh toán
      if (booking.status === BookingStatus.PENDING && booking.payment_status === PaymentStatus.PENDING) {
        console.log(`Expiring booking ${booking_id}...`)

        // 1. Update booking status
        await databaseService.bookings.updateOne(
          { _id: new ObjectId(booking_id) },
          {
            $set: {
              status: BookingStatus.CANCELLED,
              payment_status: PaymentStatus.FAILED
            },
            $currentDate: { updated_at: true }
          }
        )

        // 2. Restore available seats
        await databaseService.showtimes.updateOne(
          { _id: booking.showtime_id },
          {
            $inc: { available_seats: booking.seats.length },
            $currentDate: { updated_at: true }
          }
        )

        // 3. Unlock seats
        await seatLockService.unlockSeats(booking.showtime_id.toString(), booking.user_id.toString())

        // 4. Update payment status nếu có
        await databaseService.payments.updateMany(
          { booking_id: new ObjectId(booking_id) },
          {
            $set: { status: PaymentStatus.FAILED },
            $currentDate: { updated_at: true }
          }
        )

        // 5. Send notification to user
        await notificationService.createNotification({
          user_id: booking.user_id.toString(),
          title: 'Booking Expired',
          content: `Your booking #${booking.ticket_code} has expired due to non-payment within 20 minutes.`,
          type: NotificationTypes.BOOKING,
          related_id: booking_id
        })

        console.log(`Successfully expired booking ${booking_id}`)

        // 6. Log expiration stats
        await this.logBookingExpiration(booking_id, booking.user_id.toString())
      } else {
        console.log(
          `Booking ${booking_id} already processed (status: ${booking.status}, payment: ${booking.payment_status})`
        )
      }
    } catch (error) {
      console.error(`Error expiring booking ${booking_id}:`, error)
    }
  }

  // Log expiration for analytics
  private async logBookingExpiration(booking_id: string, user_id: string) {
    try {
      // Có thể lưu vào collection logs hoặc analytics
      console.log(`BOOKING_EXPIRED: ${booking_id} for user ${user_id} at ${new Date().toISOString()}`)

      // Hoặc có thể gửi tới analytics service
      // await analyticsService.track('booking_expired', { booking_id, user_id })
    } catch (error) {
      console.error('Error logging booking expiration:', error)
    }
  }

  // Extend booking expiration (khi user bắt đầu payment)
  extendBookingExpiration(booking_id: string, additionalMinutes: number = 5) {
    this.clearExpirationJob(booking_id)
    this.scheduleBookingExpiration(booking_id, additionalMinutes)

    console.log(`Extended booking ${booking_id} expiration by ${additionalMinutes} minutes`)
  }

  // Get expiration info
  async getBookingExpirationInfo(booking_id: string) {
    const booking = await databaseService.bookings.findOne({
      _id: new ObjectId(booking_id)
    })

    if (!booking) {
      return null
    }

    // Calculate expiration time (20 minutes from booking_time)
    const expirationTime = new Date(booking.booking_time.getTime() + 20 * 60 * 1000)
    const timeRemaining = Math.max(0, expirationTime.getTime() - Date.now())

    return {
      booking_id,
      booking_time: booking.booking_time,
      expiration_time: expirationTime,
      time_remaining_ms: timeRemaining,
      time_remaining_seconds: Math.floor(timeRemaining / 1000),
      is_expired: timeRemaining <= 0,
      status: booking.status,
      payment_status: booking.payment_status
    }
  }

  // Cleanup on-memory jobs (for graceful shutdown)
  clearAllJobs() {
    console.log(`Clearing ${this.expirationJobs.size} expiration jobs...`)
    this.expirationJobs.forEach((job) => clearTimeout(job))
    this.expirationJobs.clear()
  }

  // Recovery function - check for pending bookings on startup
  async recoverPendingBookings() {
    console.log('Recovering pending booking expirations...')

    const pendingBookings = await databaseService.bookings
      .find({
        status: BookingStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        booking_time: { $gte: new Date(Date.now() - 25 * 60 * 1000) } // Trong 25 phút gần nhất
      })
      .toArray()

    for (const booking of pendingBookings) {
      const expirationTime = new Date(booking.booking_time.getTime() + 20 * 60 * 1000)
      const timeRemaining = expirationTime.getTime() - Date.now()

      if (timeRemaining > 0) {
        // Schedule expiration cho booking này
        this.scheduleBookingExpiration(booking._id.toString(), Math.ceil(timeRemaining / (60 * 1000)))
      } else {
        // Đã hết hạn, expire ngay
        await this.expireBooking(booking._id.toString())
      }
    }

    console.log(`Recovered ${pendingBookings.length} pending bookings`)
  }
}

const bookingExpirationService = new BookingExpirationService()
export default bookingExpirationService
