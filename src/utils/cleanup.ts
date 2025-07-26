import cron from 'node-cron'
import seatLockService from '../services/seat-lock.services'
import showtimeCleanupService from '~/services/showtime-cleanup.services'
import bookingExpirationService from '~/services/booking-expiration.services'
import contractService from '~/services/contract.services'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { BookingStatus, PaymentStatus } from '~/models/schemas/Booking.schema'

// Chạy cleanup expired locks mỗi phút
export const setupCleanupJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      await seatLockService.cleanupExpiredLocks()
      // Setup contract expiration check (daily at 00:00)
      setInterval(
        async () => {
          try {
            const expiredCount = await contractService.checkExpiredContracts()
            if (expiredCount > 0) {
              console.log(`📋 Contract cleanup: ${expiredCount} contracts expired`)
            }
          } catch (error) {
            console.error('❌ Contract cleanup error:', error)
          }
        },
        24 * 60 * 60 * 1000
      ) // 24 hours

      // Setup showtime cleanup (every 10 minutes)
      showtimeCleanupService.startAutomaticCleanup(10)

      // Setup booking expiration recovery (every 5 minutes)
      setInterval(
        async () => {
          try {
            await bookingExpirationService.recoverPendingBookings()
          } catch (error) {
            console.error('❌ Booking recovery error:', error)
          }
        },
        5 * 60 * 1000
      ) // 5 minutes

      // Setup booking-payment status sync (every 2 minutes)
      setInterval(
        async () => {
          try {
            await syncBookingPaymentStatuses()
          } catch (error) {
            console.error('❌ Booking-payment sync error:', error)
          }
        },
        2 * 60 * 1000
      ) // 2 minutes

      // Setup memory cleanup (every 30 minutes in production)
      if (process.env.NODE_ENV === 'production') {
        setInterval(
          () => {
            if (global.gc) {
              global.gc()
              console.log('🧹 Manual garbage collection triggered')
            }
          },
          30 * 60 * 1000
        ) // 30 minutes
      }

      console.log('✅ Cleanup jobs setup completed:')
      console.log('   - Contract expiration: every 24 hours')
      console.log('   - Showtime cleanup: every 10 minutes')
      console.log('   - Booking recovery: every 5 minutes')
      if (process.env.NODE_ENV === 'production') {
        console.log('   - Memory cleanup: every 30 minutes')
      }
    } catch (error) {
      console.error('Error cleaning up expired seat locks:', error)
    }
  })

  console.log('Cleanup jobs scheduled')
}

// Manual cleanup trigger for admin
export const triggerManualCleanup = async () => {
  console.log('🔧 Manual cleanup triggered by admin')

  const results = {
    contracts: 0,
    showtimes: { updated: 0, deleted: 0, cancelled: 0 },
    bookings: 0,
    booking_payment_sync: { synced: 0, errors: 0 }
  }

  try {
    // Contract cleanup
    results.contracts = await contractService.checkExpiredContracts()

    // Showtime cleanup
    results.showtimes = await showtimeCleanupService.triggerManualCleanup()

    // Booking recovery
    await bookingExpirationService.recoverPendingBookings()

    // Booking-payment status sync
    results.booking_payment_sync = await syncBookingPaymentStatuses()

    console.log('✅ Manual cleanup completed:', results)
    return results
  } catch (error) {
    console.error('❌ Manual cleanup error:', error)
    throw error
  }
}

// Get cleanup statistics
export const getCleanupStats = async () => {
  try {
    const [showtimeStats, inconsistentBookingsCount] = await Promise.all([
      showtimeCleanupService.getCleanupStats(),
      databaseService.bookings.countDocuments({
        $or: [
          {
            payment_status: PaymentStatus.CANCELLED,
            status: { $ne: BookingStatus.CANCELLED }
          },
          {
            payment_status: PaymentStatus.FAILED,
            status: { $ne: BookingStatus.CANCELLED }
          }
        ]
      })
    ])

    return {
      showtime_cleanup: showtimeStats,
      booking_payment_sync: {
        inconsistent_bookings: inconsistentBookingsCount,
        last_sync: new Date().toISOString()
      },
      last_updated: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error getting cleanup stats:', error)
    throw error
  }
}

// Sync booking status with payment status
export const syncBookingPaymentStatuses = async () => {
  try {
    console.log('🔄 Starting booking-payment status sync...')

    // Find bookings where payment is cancelled/failed but booking is not cancelled
    const inconsistentBookings = await databaseService.bookings
      .find({
        $or: [
          {
            payment_status: PaymentStatus.CANCELLED,
            status: { $ne: BookingStatus.CANCELLED }
          },
          {
            payment_status: PaymentStatus.FAILED,
            status: { $ne: BookingStatus.CANCELLED }
          }
        ]
      })
      .toArray()

    if (inconsistentBookings.length === 0) {
      console.log('✅ All booking-payment statuses are in sync')
      return { synced: 0, errors: 0 }
    }

    console.log(`📋 Found ${inconsistentBookings.length} bookings with inconsistent payment status`)

    let syncedCount = 0
    let errorCount = 0

    for (const booking of inconsistentBookings) {
      try {
        console.log(
          `🔄 Syncing booking ${booking._id}: ${booking.status} -> CANCELLED (payment: ${booking.payment_status})`
        )

        // Update booking status to cancelled
        await databaseService.bookings.updateOne(
          { _id: booking._id },
          {
            $set: {
              status: BookingStatus.CANCELLED
            },
            $currentDate: { updated_at: true }
          }
        )

        // Restore available seats in showtime
        await databaseService.showtimes.updateOne(
          { _id: booking.showtime_id },
          {
            $inc: { available_seats: booking.seats.length },
            $currentDate: { updated_at: true }
          }
        )

        // Release seat locks
        await seatLockService.releaseSeatsByBookingId(booking._id.toString())

        syncedCount++
        console.log(`✅ Synced booking ${booking._id}`)
      } catch (error) {
        console.error(`❌ Failed to sync booking ${booking._id}:`, error)
        errorCount++
      }
    }

    console.log(`🎯 Booking-payment sync completed: ${syncedCount} synced, ${errorCount} errors`)
    return { synced: syncedCount, errors: errorCount }
  } catch (error) {
    console.error('❌ Error in booking-payment status sync:', error)
    return { synced: 0, errors: 1 }
  }
}

// Graceful cleanup shutdown
export const shutdownCleanupJobs = () => {
  console.log('🛑 Shutting down cleanup jobs...')

  try {
    // Stop showtime cleanup
    showtimeCleanupService.stopAutomaticCleanup()

    // Clear booking expiration jobs
    bookingExpirationService.clearAllJobs()

    console.log('✅ Cleanup jobs shutdown completed')
  } catch (error) {
    console.error('❌ Cleanup shutdown error:', error)
  }
}
