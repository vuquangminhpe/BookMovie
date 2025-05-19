import { ObjectId } from 'mongodb'

export enum BannerTypes {
  HOME_SLIDER = 'home_slider',
  PROMOTION = 'promotion',
  ANNOUNCEMENT = 'announcement'
}

export enum BannerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled'
}

interface BannerType {
  _id?: ObjectId
  title: string
  image_url: string
  link_url?: string
  description?: string
  type: BannerTypes
  status: BannerStatus
  position: number
  movie_id?: ObjectId
  start_date?: Date
  end_date?: Date
  created_at?: Date
  updated_at?: Date
}

export default class Banner {
  _id?: ObjectId
  title: string
  image_url: string
  link_url: string
  description: string
  type: BannerTypes
  status: BannerStatus
  position: number
  movie_id?: ObjectId
  start_date?: Date
  end_date?: Date
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    title,
    image_url,
    link_url,
    description,
    type,
    status,
    position,
    movie_id,
    start_date,
    end_date,
    created_at,
    updated_at
  }: BannerType) {
    const date = new Date()
    this._id = _id
    this.title = title
    this.image_url = image_url
    this.link_url = link_url || ''
    this.description = description || ''
    this.type = type
    this.status = status || BannerStatus.INACTIVE
    this.position = position || 0
    this.movie_id = movie_id
    this.start_date = start_date
    this.end_date = end_date
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
