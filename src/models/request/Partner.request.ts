import { ParamsDictionary } from 'express-serve-static-core'
import { PartnerStatus } from '../schemas/Partner.schema'

export interface CreatePartnerReqBody {
  name: string
  email: string
  phone: string
  company_name: string
  theater_id: string
  status?: PartnerStatus
}

export interface UpdatePartnerReqBody {
  name?: string
  email?: string
  phone?: string
  company_name?: string
  theater_id?: string
  status?: PartnerStatus
}

export interface PartnerIdReqParams extends ParamsDictionary {
  partner_id: string
}

export interface GetPartnersReqQuery {
  page?: string
  limit?: string
  search?: string
  status?: string
  theater_id?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Partner movie management
export interface CreatePartnerMovieReqBody {
  title: string
  description: string
  duration: number
  genre: string[]
  language: string
  release_date: string
  director: string
  cast: string[] // Will be processed later
  poster_url: string
  trailer_url?: string
  status?: string
}

export interface UpdatePartnerMovieReqBody {
  title?: string
  description?: string
  duration?: number
  genre?: string[]
  language?: string
  release_date?: string
  director?: string
  cast?: string[]
  poster_url?: string
  trailer_url?: string
  status?: string
}

export interface GetPartnerMoviesReqQuery {
  page?: string
  limit?: string
  search?: string
  status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
