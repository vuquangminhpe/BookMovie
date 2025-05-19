import { ParamsDictionary } from 'express-serve-static-core'

export interface CreateRatingReqBody {
  movie_id: string
  rating: number
  comment: string
}

export interface UpdateRatingReqBody {
  rating?: number
  comment?: string
}

export interface RatingIdReqParams extends ParamsDictionary {
  rating_id: string
}

export interface GetRatingsReqQuery {
  page?: string
  limit?: string
  movie_id?: string
  user_id?: string
  min_rating?: string
  max_rating?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
