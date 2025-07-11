import cron from 'node-cron'
import seatLockService from '../services/seat-lock.services'
import showtimeCleanupService from '~/services/showtime-cleanup.services'
import bookingExpirationService from '~/services/booking-expiration.services'
import contractService from '~/services/contract.services'

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
    showtimes: { completed: 0, deleted: 0, cancelled: 0 },
    bookings: 0
  }

  try {
    // Contract cleanup
    results.contracts = await contractService.checkExpiredContracts()

    // Showtime cleanup
    results.showtimes = await showtimeCleanupService.triggerManualCleanup()

    // Booking recovery
    await bookingExpirationService.recoverPendingBookings()

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
    const [showtimeStats] = await Promise.all([showtimeCleanupService.getCleanupStats()])

    return {
      showtime_cleanup: showtimeStats,
      last_updated: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error getting cleanup stats:', error)
    throw error
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
