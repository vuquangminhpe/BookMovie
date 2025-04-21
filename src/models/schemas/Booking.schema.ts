import { ObjectId } from 'mongodb'
import { SeatType } from './Screen.schema'

interface BookingType {
  _id?: ObjectId
  user_id: ObjectId
  showtime_id: ObjectId
  movie_id: ObjectId
  theater_id: ObjectId
  screen_id: ObjectId
  seats: Array<{
    row: string
    number: number
    type: SeatType
    price: number
  }>
  total_amount: number
  booking_time: Date
  ticket_code?: string
  status: BookingStatus
  payment_status: PaymentStatus
  created_at?: Date
  updated_at?: Date
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export default class Booking {
  _id?: ObjectId
  user_id: ObjectId
  showtime_id: ObjectId
  movie_id: ObjectId
  theater_id: ObjectId
  screen_id: ObjectId
  seats: Array<{
    row: string
    number: number
    type: SeatType
    price: number
  }>
  total_amount: number
  booking_time: Date
  ticket_code: string
  status: BookingStatus
  payment_status: PaymentStatus
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    user_id,
    showtime_id,
    movie_id,
    theater_id,
    screen_id,
    seats,
    total_amount,
    booking_time,
    ticket_code,
    status,
    payment_status,
    created_at,
    updated_at
  }: BookingType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.showtime_id = showtime_id
    this.movie_id = movie_id
    this.theater_id = theater_id
    this.screen_id = screen_id
    this.seats = seats
    this.total_amount = total_amount
    this.booking_time = booking_time || date
    this.ticket_code = ticket_code || this.generateTicketCode()
    this.status = status || BookingStatus.PENDING
    this.payment_status = payment_status || PaymentStatus.PENDING
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }

  private generateTicketCode(): string {
    // Generate a random 8 character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
}
