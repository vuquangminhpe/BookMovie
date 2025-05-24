import { ObjectId } from 'mongodb'

interface SeatLockType {
  _id?: ObjectId
  showtime_id: ObjectId
  user_id: ObjectId
  seats: Array<{
    row: string
    number: number
  }>
  expires_at: Date
  created_at?: Date
}

export default class SeatLock {
  _id?: ObjectId
  showtime_id: ObjectId
  user_id: ObjectId
  seats: Array<{
    row: string
    number: number
  }>
  expires_at: Date
  created_at: Date

  constructor({ _id, showtime_id, user_id, seats, expires_at, created_at }: SeatLockType) {
    const date = new Date()
    this._id = _id
    this.showtime_id = showtime_id
    this.user_id = user_id
    this.seats = seats
    this.expires_at = expires_at
    this.created_at = created_at || date
  }
}
