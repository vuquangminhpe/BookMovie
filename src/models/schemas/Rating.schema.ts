import { ObjectId } from 'mongodb'

interface RatingType {
  _id?: ObjectId
  user_id: ObjectId
  movie_id: ObjectId
  rating: number
  comment: string
  is_hidden?: boolean
  moderation_note?: string
  created_at?: Date
  updated_at?: Date
}

export default class Rating {
  _id?: ObjectId
  user_id: ObjectId
  movie_id: ObjectId
  rating: number
  comment: string
  is_hidden: boolean
  moderation_note: string
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    user_id,
    movie_id,
    rating,
    comment,
    is_hidden,
    moderation_note,
    created_at,
    updated_at
  }: RatingType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.movie_id = movie_id
    this.rating = rating
    this.comment = comment
    this.is_hidden = is_hidden || false
    this.moderation_note = moderation_note || ''
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
