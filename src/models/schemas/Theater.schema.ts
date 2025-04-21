import { ObjectId } from 'mongodb'

interface TheaterType {
  _id?: ObjectId
  name: string
  location: string
  address: string
  city: string
  state: string
  pincode: string
  screens: number
  amenities: string[]
  status: TheaterStatus
  created_at?: Date
  updated_at?: Date
}

export enum TheaterStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}

export default class Theater {
  _id?: ObjectId
  name: string
  location: string
  address: string
  city: string
  state: string
  pincode: string
  screens: number
  amenities: string[]
  status: TheaterStatus
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    name,
    location,
    address,
    city,
    state,
    pincode,
    screens,
    amenities,
    status,
    created_at,
    updated_at
  }: TheaterType) {
    const date = new Date()
    this._id = _id
    this.name = name
    this.location = location
    this.address = address
    this.city = city
    this.state = state
    this.pincode = pincode
    this.screens = screens
    this.amenities = amenities
    this.status = status || TheaterStatus.ACTIVE
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
