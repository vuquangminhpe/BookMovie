import { Server as SocketServer } from 'socket.io'
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { PaymentStatus } from '../models/schemas/Booking.schema'

interface PaymentExpirationJob {
  payment_id: string
  booking_id: string
  user_id: string
  timeout_id: NodeJS.Timeout
  expires_at: Date
}

class PaymentExpirationService {
  private socketIO: SocketServer | null = null
  private paymentJobs = new Map<string, PaymentExpirationJob>()
  private readonly PAYMENT_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds

  setSocketIO(io: SocketServer) {
    this.socketIO = io
    console.log('💳 Payment expiration service initialized with Socket.IO')
  }

  createPaymentExpirationJob(payment_id: string, booking_id: string, user_id: string) {
    // Clear existing job if any
    this.clearPaymentExpirationJob(payment_id)

    const expires_at = new Date(Date.now() + this.PAYMENT_TIMEOUT)
    
    const timeout_id = setTimeout(async () => {
      try {
        await this.processPaymentExpiration(payment_id, booking_id, user_id)
      } catch (error) {
        console.error(`❌ Error processing payment expiration for ${payment_id}:`, error)
      } finally {
        this.paymentJobs.delete(payment_id)
      }
    }, this.PAYMENT_TIMEOUT)

    const job: PaymentExpirationJob = {
      payment_id,
      booking_id,
      user_id,
      timeout_id,
      expires_at
    }

    this.paymentJobs.set(payment_id, job)
    
    console.log(`⏰ Payment expiration job created for payment ${payment_id} (expires at ${expires_at.toISOString()})`)
    
    return job
  }

  clearPaymentExpirationJob(payment_id: string) {
    const existingJob = this.paymentJobs.get(payment_id)
    if (existingJob) {
      clearTimeout(existingJob.timeout_id)
      this.paymentJobs.delete(payment_id)
      console.log(`🗑️ Payment expiration job cleared for payment ${payment_id}`)
      return true
    }
    return false
  }

  private async processPaymentExpiration(payment_id: string, booking_id: string, user_id: string) {
    try {
      console.log(`⏰ Processing payment expiration for payment ${payment_id}`)

      // Check current payment status
      const payment = await databaseService.payments.findOne({
        _id: new ObjectId(payment_id)
      })

      if (!payment) {
        console.log(`❓ Payment ${payment_id} not found, skipping expiration`)
        return
      }

      // Only process if payment is still pending
      if (payment.status !== PaymentStatus.PENDING) {
        console.log(`✅ Payment ${payment_id} already processed (status: ${payment.status}), skipping expiration`)
        return
      }

      // Update payment status to cancelled
      await databaseService.payments.updateOne(
        { _id: new ObjectId(payment_id) },
        {
          $set: {
            status: PaymentStatus.CANCELLED,
            error: 'Payment timeout - cancelled after 15 minutes',
            updated_at: new Date()
          }
        }
      )

      // Update booking status to cancelled
      await databaseService.bookings.updateOne(
        { _id: new ObjectId(booking_id) },
        {
          $set: {
            payment_status: PaymentStatus.CANCELLED,
            updated_at: new Date()
          }
        }
      )

      console.log(`💳 Payment ${payment_id} expired and cancelled successfully`)

      // Emit socket event to notify user
      if (this.socketIO) {
        this.socketIO.to(`user_${user_id}`).emit('payment_expired', {
          payment_id,
          booking_id,
          message: 'Your payment has expired. Please try again.',
          timestamp: new Date().toISOString()
        })

        // Also emit to admin room for monitoring
        this.socketIO.to('admin_room').emit('payment_expiration_notification', {
          payment_id,
          booking_id,
          user_id,
          message: `Payment ${payment_id} expired and cancelled`,
          timestamp: new Date().toISOString()
        })

        console.log(`📡 Payment expiration notification sent via Socket.IO`)
      }

      return {
        success: true,
        payment_id,
        booking_id,
        message: 'Payment expired and cancelled successfully'
      }

    } catch (error) {
      console.error(`❌ Error in processPaymentExpiration:`, error)
      throw error
    }
  }

  async recoverPendingPayments() {
    try {
      console.log('🔄 Recovering pending payments on startup...')

      const cutoffTime = new Date(Date.now() - this.PAYMENT_TIMEOUT)
      
      // Find all payments that are pending and older than 15 minutes
      const expiredPayments = await databaseService.payments
        .find({
          status: PaymentStatus.PENDING,
          created_at: { $lt: cutoffTime }
        })
        .toArray()

      if (expiredPayments.length === 0) {
        console.log('✅ No expired pending payments found')
        return
      }

      console.log(`📋 Found ${expiredPayments.length} expired pending payments`)

      // Process each expired payment
      for (const payment of expiredPayments) {
        try {
          await this.processPaymentExpiration(
            payment._id.toString(),
            payment.booking_id.toString(),
            payment.user_id.toString()
          )
        } catch (error) {
          console.error(`❌ Failed to process expired payment ${payment._id}:`, error)
        }
      }

      console.log(`✅ Processed ${expiredPayments.length} expired payments`)
    } catch (error) {
      console.error('❌ Error in recoverPendingPayments:', error)
    }
  }

  getRemainingTime(payment_id: string): number | null {
    const job = this.paymentJobs.get(payment_id)
    if (!job) return null
    
    const remaining = job.expires_at.getTime() - Date.now()
    return Math.max(0, remaining)
  }

  getActiveJobsCount(): number {
    return this.paymentJobs.size
  }

  getActiveJobs(): PaymentExpirationJob[] {
    return Array.from(this.paymentJobs.values())
  }

  clearAllJobs() {
    console.log(`🧹 Clearing all ${this.paymentJobs.size} payment expiration jobs`)
    
    for (const job of this.paymentJobs.values()) {
      clearTimeout(job.timeout_id)
    }
    
    this.paymentJobs.clear()
    console.log('✅ All payment expiration jobs cleared')
  }

  getPaymentExpirationStats() {
    const jobs = this.getActiveJobs()
    
    return {
      active_jobs: jobs.length,
      jobs_by_time_remaining: {
        under_5_minutes: jobs.filter(job => {
          const remaining = job.expires_at.getTime() - Date.now()
          return remaining < 5 * 60 * 1000 && remaining > 0
        }).length,
        under_10_minutes: jobs.filter(job => {
          const remaining = job.expires_at.getTime() - Date.now()
          return remaining < 10 * 60 * 1000 && remaining > 0
        }).length,
        over_10_minutes: jobs.filter(job => {
          const remaining = job.expires_at.getTime() - Date.now()
          return remaining >= 10 * 60 * 1000
        }).length
      },
      next_expiration: jobs.length > 0 
        ? Math.min(...jobs.map(job => job.expires_at.getTime()))
        : null
    }
  }
}

const paymentExpirationService = new PaymentExpirationService()
export default paymentExpirationService