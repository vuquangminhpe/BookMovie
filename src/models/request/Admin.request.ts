import { ParamsDictionary } from 'express-serve-static-core'
import { UserRole } from '../schemas/User.schema'
import { FeedbackStatus } from '../schemas/Feedback.schema'
import { UserVerifyStatus } from '~/constants/enums'

// User management
export interface UpdateUserRoleReqBody {
  role: UserRole
}

export interface UserIdReqParams extends ParamsDictionary {
  user_id: string
}

export interface GetUsersReqQuery {
  page?: string
  limit?: string
  search?: string
  role?: string
  verify?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Dashboard stats queries
export interface GetDashboardStatsReqQuery {
  period?: 'today' | 'week' | 'month' | 'year' | 'all'
  start_date?: string
  end_date?: string
}

// Movie management
export interface FeatureMovieReqBody {
  is_featured: boolean
  featured_order?: number
}

// Feedback moderation
export interface ModerateFeedbackReqBody {
  status: FeedbackStatus
  moderation_note?: string
}

// Rating moderation
export interface ModerateRatingReqBody {
  is_hidden: boolean
  moderation_note?: string
}
export interface UpdateUserReqBody {
  name?: string
  email?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  role?: UserRole
  verify?: UserVerifyStatus
}
