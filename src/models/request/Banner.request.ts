import { ParamsDictionary } from 'express-serve-static-core'
import { BannerStatus, BannerTypes } from '../schemas/Banner.schema'

export interface CreateBannerReqBody {
  title: string
  image_url: string
  link_url?: string
  description?: string
  type: BannerTypes
  status?: BannerStatus
  position?: number
  movie_id?: string
  start_date?: string
  end_date?: string
}

export interface UpdateBannerReqBody {
  title?: string
  image_url?: string
  link_url?: string
  description?: string
  type?: BannerTypes
  status?: BannerStatus
  position?: number
  movie_id?: string
  start_date?: string
  end_date?: string
}

export interface BannerIdReqParams extends ParamsDictionary {
  banner_id: string
}

export interface GetBannersReqQuery {
  page?: string
  limit?: string
  type?: string
  status?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  active_only?: string
}
