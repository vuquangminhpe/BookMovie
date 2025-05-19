import { ObjectId } from 'mongodb'

export enum NotificationTypes {
  SYSTEM = 'system',
  BOOKING = 'booking',
  PAYMENT = 'payment',
  MOVIE = 'movie',
  PROMOTION = 'promotion',
  REVIEW = 'review'
}

interface NotificationType {
  _id?: ObjectId
  user_id: ObjectId
  title: string
  content: string
  type: NotificationTypes
  link?: string
  is_read: boolean
  related_id?: ObjectId
  created_at?: Date
  updated_at?: Date
}

export default class Notification {
  _id?: ObjectId
  user_id: ObjectId
  title: string
  content: string
  type: NotificationTypes
  link: string
  is_read: boolean
  related_id?: ObjectId
  created_at?: Date
  updated_at?: Date

  constructor({
    _id,
    user_id,
    title,
    content,
    type,
    link,
    is_read,
    related_id,
    created_at,
    updated_at
  }: NotificationType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.title = title
    this.content = content
    this.type = type
    this.link = link || ''
    this.is_read = is_read || false
    this.related_id = related_id
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
