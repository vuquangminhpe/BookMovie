import { ObjectId } from 'mongodb'

interface MovieType {
  _id?: ObjectId
  title: string
  description: string
  duration: number
  genre: string[]
  language: string
  release_date: Date
  director: string
  cast: CastMember[]
  poster_url: string
  trailer_url?: string
  status: MovieStatus
  average_rating?: number
  ratings_count?: number
  is_featured?: boolean
  featured_order?: number | null
  partner_id?: ObjectId
  created_by?: ObjectId // Staff ID who created this movie
  created_at?: Date
  updated_at?: Date
}

export enum MovieStatus {
  COMING_SOON = 'coming_soon',
  NOW_SHOWING = 'now_showing',
  ENDED = 'ended'
}

export interface CastMember {
  id: number
  name: string
  character: string
  order: number
  profile_image: string
  gender: number
}

export default class Movie {
  _id?: ObjectId
  title: string
  description: string
  duration: number
  genre: string[]
  language: string
  release_date: Date
  director: string
  cast: CastMember[]
  poster_url: string
  trailer_url?: string
  status: MovieStatus
  average_rating: number
  ratings_count: number
  is_featured?: boolean
  featured_order: number | null
  created_by?: ObjectId
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    title,
    description,
    duration,
    genre,
    language,
    release_date,
    director,
    cast,
    poster_url,
    trailer_url,
    status,
    created_at,
    average_rating,
    ratings_count,
    is_featured,
    featured_order,
    created_by,
    updated_at
  }: MovieType) {
    const date = new Date()
    this._id = _id
    this.title = title
    this.description = description
    this.duration = duration
    this.genre = genre
    this.language = language
    this.release_date = release_date
    this.director = director
    this.cast = cast
    this.poster_url = poster_url
    this.trailer_url = trailer_url
    this.status = status || MovieStatus.COMING_SOON
    this.average_rating = average_rating || 0
    this.ratings_count = ratings_count || 0
    this.is_featured = is_featured || false
    this.featured_order = featured_order || null
    this.created_by = created_by
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
