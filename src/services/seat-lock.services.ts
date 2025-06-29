import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import SeatLock, { SeatSelectionStatus } from '../models/schemas/SeatLock.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

class SeatLockService {
  // Lock ghế tạm thời (5 phút)
  async lockSeats(showtime_id: string, user_id: string, seats: Array<{ row: string; number: number }>) {
    const seatLockId = new ObjectId()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 phút

    // Kiểm tra ghế đã được lock chưa
    const existingLocks = await databaseService.seatLocks
      .find({
        showtime_id: new ObjectId(showtime_id),
        expires_at: { $gt: new Date() },
        'seats.row': { $in: seats.map((s) => s.row) },
        'seats.number': { $in: seats.map((s) => s.number) }
      })
      .toArray()

    if (existingLocks.length > 0) {
      // Kiểm tra có ghế nào bị trùng không
      const lockedSeats: string[] = []
      existingLocks.forEach((lock) => {
        lock.seats.forEach((seat) => {
          const seatId = `${seat.row}-${seat.number}`
          const isRequested = seats.some((s) => `${s.row}-${s.number}` === seatId)
          if (isRequested) {
            lockedSeats.push(seatId)
          }
        })
      })

      if (lockedSeats.length > 0) {
        throw new ErrorWithStatus({
          message: `Seats ${lockedSeats.join(', ')} are currently being selected by another user`,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Tạo lock mới
    await databaseService.seatLocks.insertOne(
      new SeatLock({
        _id: seatLockId,
        showtime_id: new ObjectId(showtime_id),
        user_id: new ObjectId(user_id),
        seats,
        status: SeatSelectionStatus.SELECTED,
        expires_at: expiresAt
      })
    )

    return {
      lock_id: seatLockId.toString(),
      expires_at: expiresAt
    }
  }

  // Unlock ghế (khi hoàn thành booking hoặc hủy)
  async unlockSeats(showtime_id: string, user_id: string) {
    await databaseService.seatLocks.deleteMany({
      showtime_id: new ObjectId(showtime_id),
      user_id: new ObjectId(user_id)
    })
  }

  // Cleanup expired locks
  async cleanupExpiredLocks() {
    const result = await databaseService.seatLocks.deleteMany({
      expires_at: { $lt: new Date() }
    })

    console.log(`Cleaned up ${result.deletedCount} expired seat locks`)
    return result.deletedCount
  }

  // Lấy danh sách ghế đang được lock
  async getLockedSeats(showtime_id: string) {
    const locks = await databaseService.seatLocks
      .find({
        showtime_id: new ObjectId(showtime_id),
        expires_at: { $gt: new Date() }
      })
      .toArray()

    const lockedSeats: Array<{ row: string; number: number; expires_at: Date }> = []

    locks.forEach((lock) => {
      lock.seats.forEach((seat) => {
        lockedSeats.push({
          row: seat.row,
          number: seat.number,
          expires_at: lock.expires_at
        })
      })
    })

    return lockedSeats
  }

  // Extend lock time (khi user đang trong quá trình thanh toán)
  async extendLock(showtime_id: string, user_id: string, additionalMinutes: number = 5) {
    const newExpireTime = new Date(Date.now() + additionalMinutes * 60 * 1000)

    await databaseService.seatLocks.updateMany(
      {
        showtime_id: new ObjectId(showtime_id),
        user_id: new ObjectId(user_id)
      },
      {
        $set: { expires_at: newExpireTime }
      }
    )

    return { new_expire_time: newExpireTime }
  }
}

const seatLockService = new SeatLockService()
export default seatLockService
