import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { MOVIE_MESSAGES } from '../../../constants/messages'
import databaseService from '../../../services/database.services'
import { TokenPayload } from '../../../models/request/User.request'
import { ObjectId } from 'mongodb'
import { MovieStatus } from '../../../models/schemas/Movie.shema'

// Staff tìm kiếm phim có sẵn trong hệ thống để tạo showtime
export const staffSearchAvailableMoviesController = async (
  req: Request<ParamsDictionary, any, any, { 
    search?: string
    page?: string 
    limit?: string
    genre?: string
    language?: string
    status?: string
  }>,
  res: Response
) => {
  const { search = '', page = '1', limit = '10', genre, language, status } = req.query

  const filter: any = {}

  // Search by title
  if (search) {
    filter.title = { $regex: search, $options: 'i' }
  }

  // Filter by genre
  if (genre) {
    filter.genre = genre
  }

  // Filter by language
  if (language) {
    filter.language = language
  }

  // Filter by status (default to NOW_SHOWING and COMING_SOON)
  if (status) {
    filter.status = status
  } else {
    filter.status = { $in: [MovieStatus.NOW_SHOWING, MovieStatus.COMING_SOON] }
  }

  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum

  const totalMovies = await databaseService.movies.countDocuments(filter)

  const movies = await databaseService.movies
    .find(filter, {
      projection: {
        _id: 1,
        title: 1,
        description: 1,
        duration: 1,
        genre: 1,
        language: 1,
        release_date: 1,
        director: 1,
        poster_url: 1,
        status: 1,
        average_rating: 1,
        ratings_count: 1,
        created_at: 1
      }
    })
    .sort({ title: 1 })
    .skip(skip)
    .limit(limitNum)
    .toArray()

  res.json({
    message: 'Get available movies success',
    result: {
      movies,
      total: totalMovies,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalMovies / limitNum)
    }
  })
}

// Staff xem chi tiết phim để quyết định có muốn tạo showtime không
export const staffGetMovieDetailsController = async (
  req: Request<{ movie_id: string }>,
  res: Response
) => {
  const { movie_id } = req.params

  if (!ObjectId.isValid(movie_id)) {
    res.status(400).json({
      message: 'Invalid movie ID'
    })
    return
  }

  const movie = await databaseService.movies.findOne({ _id: new ObjectId(movie_id) })

  if (!movie) {
    res.status(404).json({
      message: 'Movie not found'
    })
    return
  }

  // Get movie statistics
  const [ratingsCount, feedbacksCount, showtimesCount] = await Promise.all([
    databaseService.ratings.countDocuments({ movie_id: movie._id }),
    databaseService.feedbacks.countDocuments({ movie_id: movie._id }),
    databaseService.showtimes.countDocuments({ movie_id: movie._id })
  ])

  res.json({
    message: MOVIE_MESSAGES.GET_MOVIE_SUCCESS,
    result: {
      ...movie,
      statistics: {
        ratings_count: ratingsCount,
        feedbacks_count: feedbacksCount,
        showtimes_count: showtimesCount
      }
    }
  })
}

// Staff xem các phim phổ biến để tham khảo
export const staffGetPopularMoviesController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10

  const popularMovies = await databaseService.movies
    .find({
      status: { $in: [MovieStatus.NOW_SHOWING, MovieStatus.COMING_SOON] }
    })
    .sort({ 
      average_rating: -1,
      ratings_count: -1
    })
    .limit(limit)
    .toArray()

  res.json({
    message: 'Get popular movies success',
    result: {
      movies: popularMovies
    }
  })
}
