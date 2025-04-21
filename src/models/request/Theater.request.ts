import { ParamsDictionary } from 'express-serve-static-core'
import { TheaterStatus } from '../schemas/Theater.schema'

export interface CreateTheaterReqBody {
  name: string
  location: string
  address: string
  city: string
  state: string
  pincode: string
  screens: number
  amenities: string[]
  status?: TheaterStatus
}

export interface UpdateTheaterReqBody {
  name?: string
  location?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  screens?: number
  amenities?: string[]
  status?: TheaterStatus
}

export interface TheaterIdReqParams extends ParamsDictionary {
  theater_id: string
}

export interface GetTheatersReqQuery {
  page?: string
  limit?: string
  city?: string
  status?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
