import { ObjectId } from 'mongodb'
import { ScreenStatus, ScreenType } from '../../constants/enums'

interface ScreenTypes {
  _id?: ObjectId
  theater_id: ObjectId
  name: string
  seat_layout: SeatLayout[][]
  capacity: number
  screen_type: ScreenType
  status: ScreenStatus
  created_at?: Date
  updated_at?: Date
}

export interface SeatLayout {
  row: string
  number: number
  type: SeatType
  status: SeatStatus
}

export enum SeatType {
  REGULAR = 'regular',
  PREMIUM = 'premium',
  RECLINER = 'recliner',
  COUPLE = 'couple'
}

export enum SeatStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}

export default class Screen {
  _id?: ObjectId
  theater_id: ObjectId
  name: string
  seat_layout: SeatLayout[][]
  capacity: number
  screen_type: ScreenType
  status: ScreenStatus
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    theater_id,
    name,
    seat_layout,
    capacity,
    screen_type,
    status,
    created_at,
    updated_at
  }: ScreenTypes) {
    const date = new Date()
    this._id = _id
    this.theater_id = theater_id
    this.name = name
    this.seat_layout = seat_layout
    this.capacity = capacity
    this.screen_type = screen_type || ScreenType.STANDARD
    this.status = status || ScreenStatus.ACTIVE
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
