import { ObjectId } from 'mongodb'
import Favorite from '../models/schemas/Favorite.schema'
import databaseService from './database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { FAVORITE_MESSAGES, MOVIE_MESSAGES } from '../constants/messages'

class FavoriteService {
  async addFavorite(user_id: string, movie_id: string) {
    if (!ObjectId.isValid(movie_id)) {
      throw new ErrorWithStatus({
        message: FAVORITE_MESSAGES.INVALID_MOVIE_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if movie exists
    const movie = await databaseService.movies.findOne({ _id: new ObjectId(movie_id) })
    if (!movie) {
      throw new ErrorWithStatus({
        message: MOVIE_MESSAGES.MOVIE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if already favorited
    const existingFavorite = await databaseService.favorites.findOne({
      user_id: new ObjectId(user_id),
      movie_id: new ObjectId(movie_id)
    })

    if (existingFavorite) {
      throw new ErrorWithStatus({
        message: FAVORITE_MESSAGES.MOVIE_ALREADY_FAVORITED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Add to favorites
    const favorite_id = new ObjectId()

    await databaseService.favorites.insertOne(
      new Favorite({
        _id: favorite_id,
        user_id: new ObjectId(user_id),
        movie_id: new ObjectId(movie_id)
      })
    )

    return { favorite_id: favorite_id.toString() }
  }

  async removeFavorite(user_id: string, movie_id: string) {
    if (!ObjectId.isValid(movie_id)) {
      throw new ErrorWithStatus({
        message: FAVORITE_MESSAGES.INVALID_MOVIE_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if exists in favorites
    const existingFavorite = await databaseService.favorites.findOne({
      user_id: new ObjectId(user_id),
      movie_id: new ObjectId(movie_id)
    })

    if (!existingFavorite) {
      throw new ErrorWithStatus({
        message: FAVORITE_MESSAGES.MOVIE_NOT_FAVORITED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Remove from favorites
    await databaseService.favorites.deleteOne({
      user_id: new ObjectId(user_id),
      movie_id: new ObjectId(movie_id)
    })

    return { success: true }
  }

  async getUserFavorites(user_id: string, page: number = 1, limit: number = 10) {
    // Calculate pagination
    const skip = (page - 1) * limit

    // Get favorites with pagination
    const favorites = await databaseService.favorites
      .find({ user_id: new ObjectId(user_id) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count
    const total = await databaseService.favorites.countDocuments({ user_id: new ObjectId(user_id) })

    // Get movie details for each favorite
    const favoritesWithMovies = await Promise.all(
      favorites.map(async (favorite) => {
        const movie = await databaseService.movies.findOne({ _id: favorite.movie_id })
        return {
          ...favorite,
          movie
        }
      })
    )

    return {
      favorites: favoritesWithMovies,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  }

  async checkFavoriteStatus(user_id: string, movie_id: string) {
    if (!ObjectId.isValid(movie_id)) {
      throw new ErrorWithStatus({
        message: FAVORITE_MESSAGES.INVALID_MOVIE_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const favorite = await databaseService.favorites.findOne({
      user_id: new ObjectId(user_id),
      movie_id: new ObjectId(movie_id)
    })

    return { is_favorite: !!favorite }
  }
}

const favoriteService = new FavoriteService()
export default favoriteService
