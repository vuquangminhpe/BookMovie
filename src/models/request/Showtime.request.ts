import { ParamsDictionary } from 'express-serve-static-core'
import { ShowtimeStatus } from '../../models/schemas/Showtime.schema'

export interface CreateShowtimeReqBody {
  movie_id: string
  screen_id: string
  theater_id: string
  start_time: string
  end_time: string
  price: {
    regular: number
    premium?: number
    recliner?: number
    couple?: number
  }
  available_seats: number
  status?: ShowtimeStatus
}

export interface UpdateShowtimeReqBody {
  start_time?: string
  end_time?: string
  price?: {
    regular?: number
    premium?: number
    recliner?: number
    couple?: number
  }
  available_seats?: number
  status?: ShowtimeStatus
}

export interface ShowtimeIdReqParams extends ParamsDictionary {
  showtime_id: string
}

export interface GetShowtimesReqQuery {
  page?: string
  limit?: string
  movie_id?: string
  theater_id?: string
  screen_id?: string
  date?: string
  status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
