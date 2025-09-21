import { ObjectId } from 'mongodb'

interface BannerHomeType {
  _id?: ObjectId
  image: string
  author: string
  title: string
  topic?: string
  active: boolean
  time_active?: Date
  auto_active?: boolean
  description: string
  created_at?: Date
  updated_at?: Date
}
export default class BannerHome {
  _id?: ObjectId
  image: string
  author: string
  title: string
  active: boolean
  time_active?: Date
  auto_active?: boolean
  topic?: string
  description: string
  created_at?: Date
  updated_at?: Date

  constructor({
    _id,
    image,
    author,
    title,
    topic,
    time_active,
    created_at,
    updated_at,
    active,
    auto_active,
    description
  }: BannerHomeType) {
    const date = new Date()
    this._id = _id
    this.image = image
    this.author = author
    this.title = title
    this.topic = topic
    this.description = description
    this.time_active = time_active
    this.active = active
    this.auto_active = auto_active
    this.updated_at = date
    this.created_at = date
  }
}
