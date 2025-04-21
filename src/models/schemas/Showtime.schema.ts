import { ObjectId } from 'mongodb'

interface ShowtimeType {
  _id?: ObjectId
  movie_id: ObjectId
  screen_id: ObjectId
  theater_id: ObjectId
  start_time: Date
  end_time: Date
  price: {
    regular: number
    premium?: number
    recliner?: number
    couple?: number
  }
  available_seats: number
  status: ShowtimeStatus
  created_at?: Date
  updated_at?: Date
}

export enum ShowtimeStatus {
  SCHEDULED = 'scheduled',
  BOOKING_OPEN = 'booking_open',
  BOOKING_CLOSED = 'booking_closed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export default class Showtime {
  _id?: ObjectId
  movie_id: ObjectId
  screen_id: ObjectId
  theater_id: ObjectId
  start_time: Date
  end_time: Date
  price: {
    regular: number
    premium?: number
    recliner?: number
    couple?: number
  }
  available_seats: number
  status: ShowtimeStatus
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    movie_id,
    screen_id,
    theater_id,
    start_time,
    end_time,
    price,
    available_seats,
    status,
    created_at,
    updated_at
  }: ShowtimeType) {
    const date = new Date()
    this._id = _id
    this.movie_id = movie_id
    this.screen_id = screen_id
    this.theater_id = theater_id
    this.start_time = start_time
    this.end_time = end_time
    this.price = price
    this.available_seats = available_seats
    this.status = status || ShowtimeStatus.SCHEDULED
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
