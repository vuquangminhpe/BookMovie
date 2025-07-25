export interface RevenueStatsReqQuery {
  period?: 'day' | 'week' | 'month'
  start_date?: string // Format: YYYY-MM-DD
  end_date?: string // Format: YYYY-MM-DD
  page?: string
  limit?: string
  sort_by?: 'date' | 'revenue' | 'bookings'
  sort_order?: 'asc' | 'desc'
}

export interface RevenueStatsResponse {
  period: string
  date: string
  revenue: number
  bookings_count: number
  average_booking_value: number
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
  }
}
