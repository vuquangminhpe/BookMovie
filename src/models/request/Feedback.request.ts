import { ParamsDictionary } from 'express-serve-static-core'
import { FeedbackStatus } from '../schemas/Feedback.schema'

export interface CreateFeedbackReqBody {
  movie_id: string
  title: string
  content: string
  is_spoiler?: boolean
}

export interface UpdateFeedbackReqBody {
  title?: string
  content?: string
  is_spoiler?: boolean
}

export interface UpdateFeedbackStatusReqBody {
  status: FeedbackStatus
}

export interface FeedbackIdReqParams extends ParamsDictionary {
  feedback_id: string
}

export interface GetFeedbacksReqQuery {
  page?: string
  limit?: string
  movie_id?: string
  user_id?: string
  status?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
