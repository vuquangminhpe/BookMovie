import { ParamsDictionary } from 'express-serve-static-core'
import { ScreenStatus, ScreenType } from '../../constants/enums'
import { SeatLayout } from '../schemas/Screen.schema'

export interface CreateScreenReqBody {
  theater_id: string
  name: string
  seat_layout: SeatLayout[][]
  capacity: number
  screen_type?: ScreenType
  status?: ScreenStatus
}

export interface UpdateScreenReqBody {
  name?: string
  seat_layout?: SeatLayout[][]
  capacity?: number
  screen_type?: ScreenType
  status?: ScreenStatus
}

export interface ScreenIdReqParams extends ParamsDictionary {
  screen_id: string
}

export interface GetScreensReqQuery {
  page?: string
  limit?: string
  theater_id?: string
  screen_type?: string
  status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
