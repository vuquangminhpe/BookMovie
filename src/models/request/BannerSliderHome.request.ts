export interface CreateBannerSliderHomeReqBody {
  image: string
  author?: string
  title: string
  topic?: string
  description: string
  active?: boolean
  time_active?: string
  auto_active?: boolean
}

export interface UpdateBannerSliderHomeReqBody {
  image?: string
  author?: string
  title?: string
  topic?: string
  description?: string
  active?: boolean
  time_active?: string | null
  auto_active?: boolean
}

export interface GetBannersSliderHomeReqQuery {
  page?: string
  limit?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  active_only?: string
}

export interface BannerSliderHomeIdReqParams {
  banner_id: string
}
