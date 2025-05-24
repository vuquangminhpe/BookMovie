import cron from 'node-cron'
import seatLockService from '../services/seat-lock.services'

// Chạy cleanup expired locks mỗi phút
export const setupCleanupJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      await seatLockService.cleanupExpiredLocks()
    } catch (error) {
      console.error('Error cleaning up expired seat locks:', error)
    }
  })

  console.log('Cleanup jobs scheduled')
}
