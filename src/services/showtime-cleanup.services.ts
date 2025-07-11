import databaseService from './database.services'
import { ShowtimeStatus } from '../models/schemas/Showtime.schema'
import { Server as SocketServer } from 'socket.io'
import { ObjectId } from 'mongodb'

class ShowtimeCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null
  private socketIO: SocketServer | null = null

  constructor() {
    console.log('🎬 Showtime Cleanup Service initialized')
  }

  // Set socket.io instance
  setSocketIO(io: SocketServer) {
    this.socketIO = io
  }

  // Start automatic cleanup với interval (default: mỗi 10 phút)
  startAutomaticCleanup(intervalMinutes: number = 10) {
    if (this.cleanupInterval) {
      console.log('⚠️ Showtime cleanup already running')
      return
    }

    console.log(`🕐 Starting showtime cleanup every ${intervalMinutes} minutes`)

    // Chạy ngay lần đầu
    this.cleanupExpiredShowtimes()

    // Setup interval
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredShowtimes()
      },
      intervalMinutes * 60 * 1000
    )
  }

  // Stop automatic cleanup
  stopAutomaticCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('🛑 Showtime cleanup stopped')
    }
  }

  // Main cleanup function
  async cleanupExpiredShowtimes() {
    try {
      console.log('🧹 Starting showtime cleanup...')

      const now = new Date()
      const results = await Promise.all([
        this.markCompletedShowtimes(now),
        this.deleteOldCompletedShowtimes(now),
        this.cancelAbandonedShowtimes(now)
      ])

      const [completed, deleted, cancelled] = results
      const totalProcessed = completed + deleted + cancelled

      if (totalProcessed > 0) {
        console.log(`✅ Showtime cleanup completed:`)
        console.log(`   - Marked as completed: ${completed}`)
        console.log(`   - Deleted old showtimes: ${deleted}`)
        console.log(`   - Cancelled abandoned: ${cancelled}`)

        // Emit socket event for real-time updates
        this.emitCleanupEvent({
          completed,
          deleted,
          cancelled,
          timestamp: now.toISOString()
        })
      } else {
        console.log('🎬 No expired showtimes found')
      }

      return { completed, deleted, cancelled }
    } catch (error) {
      console.error('❌ Showtime cleanup error:', error)
      throw error
    }
  }

  // Mark ended showtimes as completed
  private async markCompletedShowtimes(now: Date): Promise<number> {
    try {
      const result = await databaseService.showtimes.updateMany(
        {
          end_time: { $lt: now },
          status: {
            $in: [ShowtimeStatus.SCHEDULED, ShowtimeStatus.BOOKING_OPEN, ShowtimeStatus.BOOKING_CLOSED]
          }
        },
        {
          $set: {
            status: ShowtimeStatus.COMPLETED,
            updated_at: now
          }
        }
      )

      if (result.modifiedCount > 0) {
        console.log(`🎯 Marked ${result.modifiedCount} showtimes as completed`)
      }

      return result.modifiedCount
    } catch (error) {
      console.error('❌ Error marking completed showtimes:', error)
      return 0
    }
  }

  // Delete old completed showtimes (older than 30 days)
  private async deleteOldCompletedShowtimes(now: Date): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Chỉ delete những showtimes không có bookings
      const showtimesToDelete = await databaseService.showtimes
        .find({
          end_time: { $lt: thirtyDaysAgo },
          status: ShowtimeStatus.COMPLETED
        })
        .toArray()

      let deletedCount = 0

      for (const showtime of showtimesToDelete) {
        // Check if showtime has any bookings
        const hasBookings = await databaseService.bookings.countDocuments({
          showtime_id: showtime._id
        })

        if (hasBookings === 0) {
          await databaseService.showtimes.deleteOne({ _id: showtime._id })
          deletedCount++
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️ Deleted ${deletedCount} old completed showtimes`)
      }

      return deletedCount
    } catch (error) {
      console.error('❌ Error deleting old showtimes:', error)
      return 0
    }
  }

  // Cancel showtimes that were scheduled but never had bookings and are past
  private async cancelAbandonedShowtimes(now: Date): Promise<number> {
    try {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const abandonedShowtimes = await databaseService.showtimes
        .find({
          start_time: { $lt: oneDayAgo },
          status: ShowtimeStatus.SCHEDULED
        })
        .toArray()

      let cancelledCount = 0

      for (const showtime of abandonedShowtimes) {
        // Check if showtime has any bookings
        const hasBookings = await databaseService.bookings.countDocuments({
          showtime_id: showtime._id
        })

        if (hasBookings === 0) {
          await databaseService.showtimes.updateOne(
            { _id: showtime._id },
            {
              $set: {
                status: ShowtimeStatus.CANCELLED,
                updated_at: now
              }
            }
          )
          cancelledCount++
        }
      }

      if (cancelledCount > 0) {
        console.log(`❌ Cancelled ${cancelledCount} abandoned showtimes`)
      }

      return cancelledCount
    } catch (error) {
      console.error('❌ Error cancelling abandoned showtimes:', error)
      return 0
    }
  }

  // Get showtime cleanup statistics
  async getCleanupStats() {
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [totalShowtimes, completedShowtimes, expiredButNotCompleted, oldCompletedShowtimes, abandonedShowtimes] =
        await Promise.all([
          databaseService.showtimes.countDocuments({}),
          databaseService.showtimes.countDocuments({ status: ShowtimeStatus.COMPLETED }),
          databaseService.showtimes.countDocuments({
            end_time: { $lt: now },
            status: { $ne: ShowtimeStatus.COMPLETED }
          }),
          databaseService.showtimes.countDocuments({
            end_time: { $lt: thirtyDaysAgo },
            status: ShowtimeStatus.COMPLETED
          }),
          databaseService.showtimes.countDocuments({
            start_time: { $lt: oneDayAgo },
            status: ShowtimeStatus.SCHEDULED
          })
        ])

      return {
        total_showtimes: totalShowtimes,
        completed_showtimes: completedShowtimes,
        expired_but_not_completed: expiredButNotCompleted,
        old_completed_showtimes: oldCompletedShowtimes,
        abandoned_showtimes: abandonedShowtimes,
        cleanup_running: this.cleanupInterval !== null
      }
    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error)
      throw error
    }
  }

  // Manual cleanup trigger
  async triggerManualCleanup() {
    console.log('🔧 Manual showtime cleanup triggered')
    return await this.cleanupExpiredShowtimes()
  }

  // Emit socket event for real-time notifications
  private emitCleanupEvent(data: any) {
    if (this.socketIO) {
      this.socketIO.emit('showtime_cleanup', data)
      console.log('📡 Showtime cleanup event emitted via socket')
    }
  }

  // Check specific showtime and update if needed
  async checkAndUpdateShowtime(showtimeId: string) {
    try {
      const showtime = await databaseService.showtimes.findOne({
        _id: new ObjectId(showtimeId)
      })

      if (!showtime) {
        return null
      }

      const now = new Date()
      let updated = false

      // Check if showtime should be completed
      if (showtime.end_time < now && showtime.status !== ShowtimeStatus.COMPLETED) {
        await databaseService.showtimes.updateOne(
          { _id: showtime._id },
          {
            $set: {
              status: ShowtimeStatus.COMPLETED,
              updated_at: now
            }
          }
        )
        updated = true

        // Emit socket event for this specific showtime
        if (this.socketIO) {
          this.socketIO.emit('showtime_updated', {
            showtime_id: showtimeId,
            status: ShowtimeStatus.COMPLETED,
            timestamp: now.toISOString()
          })
        }
      }

      return { showtime, updated }
    } catch (error) {
      console.error('❌ Error checking showtime:', error)
      throw error
    }
  }
}

const showtimeCleanupService = new ShowtimeCleanupService()
export default showtimeCleanupService
