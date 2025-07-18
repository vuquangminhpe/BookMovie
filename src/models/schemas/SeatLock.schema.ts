import { ObjectId } from 'mongodb'

interface SeatLockType {
  _id?: ObjectId
  showtime_id: ObjectId
  user_id: ObjectId
  booking_id: ObjectId
  seats: Array<{
    row: string
    number: number
    section?: string
  }>
  status: SeatSelectionStatus
  expires_at: Date
  created_at?: Date
}
export enum SeatSelectionStatus {
  SELECTED = 'selected',
  EXPIRED = 'expired',
  CONFIRMED = 'confirmed'
}
export default class SeatLock {
  _id?: ObjectId
  showtime_id: ObjectId
  user_id: ObjectId
  booking_id: ObjectId
  seats: Array<{
    row: string
    number: number
    section?: string
  }>
  expires_at: Date
  created_at: Date

  constructor({ _id, showtime_id, user_id, booking_id, seats, expires_at, created_at }: SeatLockType) {
    const date = new Date()
    this._id = _id
    this.showtime_id = showtime_id
    this.user_id = user_id
    this.booking_id = booking_id
    this.seats = seats
    this.expires_at = expires_at
    this.created_at = created_at || date
  }
}
