import { ObjectId } from 'mongodb'
import Rating from '../models/schemas/Rating.schema'
import databaseService from './database.services'
import { CreateRatingReqBody, GetRatingsReqQuery, UpdateRatingReqBody } from '../models/request/Rating.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { RATING_MESSAGES } from '../constants/messages'

class RatingService {
  async createRating(user_id: string, payload: CreateRatingReqBody) {
    // Check if user has already rated this movie
    const existingRating = await databaseService.ratings.findOne({
      user_id: new ObjectId(user_id),
      movie_id: new ObjectId(payload.movie_id)
    })

    if (existingRating) {
      throw new ErrorWithStatus({
        message: RATING_MESSAGES.USER_ALREADY_RATED_MOVIE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const rating_id = new ObjectId()
    await databaseService.ratings.insertOne(
      new Rating({
        _id: rating_id,
        user_id: new ObjectId(user_id),
        movie_id: new ObjectId(payload.movie_id),
        rating: payload.rating,
        comment: payload.comment || ''
      })
    )

    // After creating a rating, update movie's average rating
    await this.updateMovieAverageRating(payload.movie_id)

    return { rating_id: rating_id.toString() }
  }

  async getRatings(query: GetRatingsReqQuery) {
    const {
      page = '1',
      limit = '10',
      movie_id,
      user_id,
      min_rating,
      max_rating,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query

    const filter: any = {}

    // Filter by movie_id
    if (movie_id) {
      filter.movie_id = new ObjectId(movie_id)
    }

    // Filter by user_id
    if (user_id) {
      filter.user_id = new ObjectId(user_id)
    }

    // Filter by rating range
    if (min_rating || max_rating) {
      filter.rating = {}
      if (min_rating) {
        filter.rating.$gte = Number(min_rating)
      }
      if (max_rating) {
        filter.rating.$lte = Number(max_rating)
      }
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of ratings matching the filter
    const totalRatings = await databaseService.ratings.countDocuments(filter)

    // Get ratings with pagination
    const ratings = await databaseService.ratings.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enhance ratings with user and movie details
    const enhancedRatings = await Promise.all(
      ratings.map(async (rating) => {
        const [user, movie] = await Promise.all([
          databaseService.users.findOne(
            { _id: rating.user_id },
            { projection: { _id: 1, name: 1, username: 1, avatar: 1 } }
          ),
          databaseService.movies.findOne({ _id: rating.movie_id }, { projection: { _id: 1, title: 1, poster_url: 1 } })
        ])

        return {
          ...rating,
          user: user || null,
          movie: movie || null
        }
      })
    )

    return {
      ratings: enhancedRatings,
      total: totalRatings,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalRatings / limitNum)
    }
  }

  async getRatingById(rating_id: string) {
    const rating = await databaseService.ratings.findOne({ _id: new ObjectId(rating_id) })

    if (rating) {
      const [user, movie] = await Promise.all([
        databaseService.users.findOne(
          { _id: rating.user_id },
          { projection: { _id: 1, name: 1, username: 1, avatar: 1 } }
        ),
        databaseService.movies.findOne(
          { _id: rating.movie_id },
          { projection: { _id: 1, title: 1, poster_url: 1, description: 1 } }
        )
      ])

      return {
        ...rating,
        user: user || null,
        movie: movie || null
      }
    }

    return null
  }

  async updateRating(rating_id: string, payload: UpdateRatingReqBody) {
    const rating = await databaseService.ratings.findOne({ _id: new ObjectId(rating_id) })

    if (!rating) {
      throw new ErrorWithStatus({
        message: RATING_MESSAGES.RATING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.ratings.updateOne(
      { _id: new ObjectId(rating_id) },
      {
        $set: {
          ...(payload.rating !== undefined && { rating: payload.rating }),
          ...(payload.comment !== undefined && { comment: payload.comment })
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    // Update movie's average rating
    await this.updateMovieAverageRating(rating.movie_id.toString())

    return { rating_id }
  }

  async deleteRating(rating_id: string) {
    const rating = await databaseService.ratings.findOne({ _id: new ObjectId(rating_id) })

    if (!rating) {
      throw new ErrorWithStatus({
        message: RATING_MESSAGES.RATING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.ratings.deleteOne({ _id: new ObjectId(rating_id) })

    // Update movie's average rating
    await this.updateMovieAverageRating(rating.movie_id.toString())

    return { rating_id }
  }

  async updateMovieAverageRating(movie_id: string) {
    // Calculate average rating (only include non-hidden ratings)
    const pipeline = [
      {
        $match: {
          movie_id: new ObjectId(movie_id),
          is_hidden: { $ne: true } // Exclude hidden ratings
        }
      },
      {
        $group: {
          _id: null,
          average_rating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]

    const result = await databaseService.ratings.aggregate(pipeline).toArray()

    if (result.length > 0) {
      const { average_rating, count } = result[0]

      // Update movie with average rating and rating count
      await databaseService.movies.updateOne(
        { _id: new ObjectId(movie_id) },
        {
          $set: {
            average_rating: parseFloat(average_rating.toFixed(1)),
            ratings_count: count
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    } else {
      // No ratings, set average to 0 and count to 0
      await databaseService.movies.updateOne(
        { _id: new ObjectId(movie_id) },
        {
          $set: {
            average_rating: 0,
            ratings_count: 0
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    }
  }
}

const ratingService = new RatingService()
export default ratingService
