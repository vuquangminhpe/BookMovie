import { ParamsDictionary } from 'express-serve-static-core'
import { MovieStatus } from '../schemas/Movie.shema'

export interface CreateMovieReqBody {
  title: string
  description: string
  duration: number
  genre: string[]
  language: string
  release_date: string
  director: string
  cast: string[]
  poster_url: string
  status?: MovieStatus
}

export interface UpdateMovieReqBody {
  title?: string
  description?: string
  duration?: number
  genre?: string[]
  language?: string
  release_date?: string
  director?: string
  cast?: string[]
  poster_url?: string
  status?: MovieStatus
}

export interface MovieIdReqParams extends ParamsDictionary {
  movie_id: string
}

export interface GetMoviesReqQuery {
  page?: string
  limit?: string
  status?: string
  genre?: string
  language?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  release_date_from?: string
  release_date_to?: string
}
