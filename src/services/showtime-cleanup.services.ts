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
        this.updateShowtimeStatuses(now),
        this.deleteOldCompletedShowtimes(now),
        this.cancelAbandonedShowtimes(now)
      ])

      const [updated, deleted, cancelled] = results
      const totalProcessed = updated + deleted + cancelled

      if (totalProcessed > 0) {
        console.log(`✅ Showtime cleanup completed:`)
        console.log(`   - Updated statuses: ${updated}`)
        console.log(`   - Deleted old showtimes: ${deleted}`)
        console.log(`   - Cancelled abandoned: ${cancelled}`)

        // Emit socket event for real-time updates
        this.emitCleanupEvent({
          updated,
          deleted,
          cancelled,
          timestamp: now.toISOString()
        })
      } else {
        console.log('🎬 No expired showtimes found')
      }

      return { updated, deleted, cancelled }
    } catch (error) {
      console.error('❌ Showtime cleanup error:', error)
      throw error
    }
  }

  // Update showtime statuses based on current time
  private async updateShowtimeStatuses(now: Date): Promise<number> {
    try {
      let totalUpdated = 0

      // 1. Mark SCHEDULED as BOOKING_OPEN (booking opens 24 hours before start_time)
      const bookingOpenTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const openBookingResult = await databaseService.showtimes.updateMany(
        {
          start_time: { $lte: bookingOpenTime },
          status: ShowtimeStatus.SCHEDULED
        },
        {
          $set: {
            status: ShowtimeStatus.BOOKING_OPEN,
            updated_at: now
          }
        }
      )
      totalUpdated += openBookingResult.modifiedCount

      // 2. Mark BOOKING_OPEN as BOOKING_CLOSED (30 minutes before start_time)
      const bookingCloseTime = new Date(now.getTime() + 30 * 60 * 1000)
      const closeBookingResult = await databaseService.showtimes.updateMany(
        {
          start_time: { $lte: bookingCloseTime },
          status: ShowtimeStatus.BOOKING_OPEN
        },
        {
          $set: {
            status: ShowtimeStatus.BOOKING_CLOSED,
            updated_at: now
          }
        }
      )
      totalUpdated += closeBookingResult.modifiedCount

      // 3. Mark BOOKING_CLOSED as COMPLETED (after end_time)
      const completedResult = await databaseService.showtimes.updateMany(
        {
          end_time: { $lt: now },
          status: ShowtimeStatus.BOOKING_CLOSED
        },
        {
          $set: {
            status: ShowtimeStatus.COMPLETED,
            updated_at: now
          }
        }
      )
      totalUpdated += completedResult.modifiedCount

      if (totalUpdated > 0) {
        console.log(`🎯 Updated ${totalUpdated} showtime statuses:`)
        console.log(`   - Opened booking: ${openBookingResult.modifiedCount}`)
        console.log(`   - Closed booking: ${closeBookingResult.modifiedCount}`)
        console.log(`   - Marked completed: ${completedResult.modifiedCount}`)
      }

      return totalUpdated
    } catch (error) {
      console.error('❌ Error updating showtime statuses:', error)
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

  // Fix incorrect showtime statuses (repair corrupted data)
  async fixIncorrectStatuses() {
    try {
      console.log('🔧 Starting to fix incorrect showtime statuses...')

      const now = new Date()
      let totalFixed = 0

      // 1. Fix COMPLETED showtimes that haven't ended yet
      const notYetEndedCompleted = await databaseService.showtimes.updateMany(
        {
          end_time: { $gt: now },
          status: ShowtimeStatus.COMPLETED
        },
        {
          $set: {
            status: ShowtimeStatus.BOOKING_OPEN,
            updated_at: now
          }
        }
      )
      totalFixed += notYetEndedCompleted.modifiedCount

      // 2. Fix showtimes that should be BOOKING_CLOSED (within 30 minutes of start)
      const shouldBeBookingClosed = new Date(now.getTime() + 30 * 60 * 1000)
      const fixBookingClosed = await databaseService.showtimes.updateMany(
        {
          start_time: { $lte: shouldBeBookingClosed },
          end_time: { $gt: now },
          status: ShowtimeStatus.BOOKING_OPEN
        },
        {
          $set: {
            status: ShowtimeStatus.BOOKING_CLOSED,
            updated_at: now
          }
        }
      )
      totalFixed += fixBookingClosed.modifiedCount

      // 3. Fix showtimes that should be BOOKING_OPEN (within 24 hours of start)
      const shouldBeBookingOpen = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const fixBookingOpen = await databaseService.showtimes.updateMany(
        {
          start_time: { $lte: shouldBeBookingOpen },
          status: ShowtimeStatus.SCHEDULED
        },
        {
          $set: {
            status: ShowtimeStatus.BOOKING_OPEN,
            updated_at: now
          }
        }
      )
      totalFixed += fixBookingOpen.modifiedCount

      // 4. Fix showtimes that should be COMPLETED (already ended)
      const fixCompleted = await databaseService.showtimes.updateMany(
        {
          end_time: { $lt: now },
          status: { $ne: ShowtimeStatus.COMPLETED }
        },
        {
          $set: {
            status: ShowtimeStatus.COMPLETED,
            updated_at: now
          }
        }
      )
      totalFixed += fixCompleted.modifiedCount

      if (totalFixed > 0) {
        console.log('✅ Fixed incorrect showtime statuses:')
        console.log(`   - Fixed premature COMPLETED: ${notYetEndedCompleted.modifiedCount}`)
        console.log(`   - Fixed to BOOKING_CLOSED: ${fixBookingClosed.modifiedCount}`)
        console.log(`   - Fixed to BOOKING_OPEN: ${fixBookingOpen.modifiedCount}`)
        console.log(`   - Fixed to COMPLETED: ${fixCompleted.modifiedCount}`)
        console.log(`   - Total fixed: ${totalFixed}`)

        // Emit socket event for the fix
        this.emitCleanupEvent({
          type: 'status_fix',
          fixed: totalFixed,
          details: {
            premature_completed: notYetEndedCompleted.modifiedCount,
            booking_closed: fixBookingClosed.modifiedCount,
            booking_open: fixBookingOpen.modifiedCount,
            completed: fixCompleted.modifiedCount
          },
          timestamp: now.toISOString()
        })
      } else {
        console.log('✅ No incorrect statuses found to fix')
      }

      return {
        total_fixed: totalFixed,
        premature_completed: notYetEndedCompleted.modifiedCount,
        booking_closed: fixBookingClosed.modifiedCount,
        booking_open: fixBookingOpen.modifiedCount,
        completed: fixCompleted.modifiedCount
      }
    } catch (error) {
      console.error('❌ Error fixing incorrect statuses:', error)
      throw error
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
