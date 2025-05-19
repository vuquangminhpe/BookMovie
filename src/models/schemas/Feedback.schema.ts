import { ObjectId } from 'mongodb'

interface FeedbackType {
  _id?: ObjectId
  user_id: ObjectId
  movie_id: ObjectId
  title: string
  content: string
  is_spoiler: boolean
  status: FeedbackStatus
  moderation_note?: string
  created_at?: Date
  updated_at?: Date
}

export enum FeedbackStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export default class Feedback {
  _id?: ObjectId
  user_id: ObjectId
  movie_id: ObjectId
  title: string
  content: string
  is_spoiler: boolean
  status: FeedbackStatus
  moderation_note: string

  created_at: Date
  updated_at: Date

  constructor({
    _id,
    user_id,
    movie_id,
    title,
    content,
    is_spoiler,
    status,
    moderation_note,
    created_at,
    updated_at
  }: FeedbackType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.movie_id = movie_id
    this.title = title
    this.content = content
    this.is_spoiler = is_spoiler || false
    this.status = status || FeedbackStatus.PENDING
    this.moderation_note = moderation_note || ''
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
