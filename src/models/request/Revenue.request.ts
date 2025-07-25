export interface RevenueStatsReqQuery {
  period?: 'day' | 'week' | 'month'
  start_date?: string // Format: YYYY-MM-DD
  end_date?: string // Format: YYYY-MM-DD
  page?: string
  limit?: string
  sort_by?: 'date' | 'revenue' | 'bookings'
  sort_order?: 'asc' | 'desc'
  // New filters
  theater_id?: string // Filter by specific theater
  movie_id?: string // Filter by specific movie
  group_by?: 'date' | 'theater' | 'movie' // Group results by different criteria
}

export interface RevenueStatsResponse {
  period: string
  date: string
  revenue: number
  bookings_count: number
  average_booking_value: number
  // Enhanced data
  theater_info?: {
    theater_id: string
    theater_name: string
    theater_location: string
  }
  movie_info?: {
    movie_id: string
    movie_title: string
    movie_genre: string[]
  }
  tickets_sold: number
  total_seats_capacity?: number
  occupancy_rate?: number // percentage
}

export interface RevenueStatsPaginatedResponse {
  data: RevenueStatsResponse[]
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
    has_next: boolean
    has_prev: boolean
  }
  summary: {
    total_revenue: number
    total_bookings: number
    average_revenue_per_period: number
    period_type: string
    date_range: {
      start: string
      end: string
    }
    // Enhanced summary
    total_tickets_sold: number
    theaters_count: number
    movies_count: number
    top_performing_theater?: {
      theater_id: string
      theater_name: string
      revenue: number
    }
    top_performing_movie?: {
      movie_id: string
      movie_title: string
      revenue: number
    }
    average_occupancy_rate?: number
  }
}
