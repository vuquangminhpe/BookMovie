import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { FEEDBACK_MESSAGES, MOVIE_MESSAGES, RATING_MESSAGES } from '../constants/messages'
import {
  CreateMovieReqBody,
  GetMoviesReqQuery,
  MovieIdReqParams,
  UpdateMovieReqBody
} from '../models/request/Movie.request'
import movieService from '../services/movie.services'
import databaseService from '~/services/database.services'
import { TokenPayload } from '~/models/request/User.request'
import { ObjectId } from 'mongodb'
import { UserRole } from '~/models/schemas/User.schema'

export const createMovieController = async (req: Request<ParamsDictionary, any, CreateMovieReqBody>, res: Response) => {
  const result = await movieService.createMovie(req.body)
  res.json({
    message: MOVIE_MESSAGES.CREATE_MOVIE_SUCCESS,
    result
  })
}

export const getMoviesController = async (
  req: Request<ParamsDictionary, any, any, GetMoviesReqQuery>,
  res: Response
) => {
  const result = await movieService.getMovies(req.query)
  res.json({
    message: MOVIE_MESSAGES.GET_MOVIES_SUCCESS,
    result
  })
}

export const getMovieByIdController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const result = await movieService.getMovieById(movie_id)
  res.json({
    message: MOVIE_MESSAGES.GET_MOVIE_SUCCESS,
    result
  })
}

export const updateMovieController = async (req: Request<MovieIdReqParams, any, UpdateMovieReqBody>, res: Response) => {
  const { movie_id } = req.params
  const result = await movieService.updateMovie(movie_id, req.body)
  res.json({
    message: MOVIE_MESSAGES.UPDATE_MOVIE_SUCCESS,
    result
  })
}

export const deleteMovieController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const result = await movieService.deleteMovie(movie_id)
  res.json({
    message: MOVIE_MESSAGES.DELETE_MOVIE_SUCCESS,
    result
  })
}
export const getMovieRatingsController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const result = await movieService.getMovieRatings(movie_id, page, limit)
  res.json({
    message: RATING_MESSAGES.GET_RATINGS_SUCCESS,
    result
  })
}

export const getMovieFeedbacksController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const includeAll = req.query.include_all === 'true'

  let isAdmin = false
  if (req.decode_authorization) {
    const { user_id } = req.decode_authorization as TokenPayload
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    isAdmin = user?.role === UserRole.Admin
  }

  const showAll = isAdmin && includeAll

  const result = await movieService.getMovieFeedbacks(movie_id, page, limit, showAll)
  res.json({
    message: FEEDBACK_MESSAGES.GET_FEEDBACKS_SUCCESS,
    result
  })
}
export const getFeaturedMoviesController = async (req: Request, res: Response) => {
  const result = await movieService.getFeaturedMovies()
  res.json({
    message: MOVIE_MESSAGES.GET_MOVIES_SUCCESS,
    result
  })
}
export const getNowShowingMoviesController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const sort_by = (req.query.sort_by as string) || 'release_date'
  const sort_order = (req.query.sort_order as 'asc' | 'desc') || 'desc'

  const result = await movieService.getNowShowingMovies(page, limit, sort_by, sort_order)
  res.json({
    message: 'Get now showing movies success',
    result
  })
}

export const getComingSoonMoviesController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const sort_by = (req.query.sort_by as string) || 'release_date'
  const sort_order = (req.query.sort_order as 'asc' | 'desc') || 'asc'

  const result = await movieService.getComingSoonMovies(page, limit, sort_by, sort_order)
  res.json({
    message: 'Get coming soon movies success',
    result
  })
}

export const getTopRatedMoviesController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const min_ratings_count = parseInt(req.query.min_ratings_count as string) || 5
  const time_period = req.query.time_period as string // 'week', 'month', 'year', 'all'

  const result = await movieService.getTopRatedMovies(limit, min_ratings_count, time_period)
  res.json({
    message: 'Get top rated movies success',
    result
  })
}

export const getTrendingMoviesController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const days = parseInt(req.query.days as string) || 7 // Default last 7 days

  const result = await movieService.getTrendingMovies(limit, days)
  res.json({
    message: 'Get trending movies success',
    result
  })
}

export const getMoviesByGenreController = async (req: Request, res: Response) => {
  const { genre } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const sort_by = (req.query.sort_by as string) || 'release_date'
  const sort_order = (req.query.sort_order as 'asc' | 'desc') || 'desc'

  const result = await movieService.getMoviesByGenre(genre, page, limit, sort_by, sort_order)
  res.json({
    message: `Get ${genre} movies success`,
    result
  })
}

export const getPopularMoviesController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const time_period = (req.query.time_period as string) || 'month' // 'week', 'month', 'year'

  const result = await movieService.getPopularMovies(limit, time_period)
  res.json({
    message: 'Get popular movies success',
    result
  })
}

export const getRecentlyAddedMoviesController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const days = parseInt(req.query.days as string) || 30 // Default last 30 days

  const result = await movieService.getRecentlyAddedMovies(limit, days)
  res.json({
    message: 'Get recently added movies success',
    result
  })
}

export const getMoviesWithShowtimesController = async (req: Request, res: Response) => {
  const city = req.query.city as string
  const date = req.query.date as string // Format: YYYY-MM-DD
  const theater_id = req.query.theater_id as string
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const result = await movieService.getMoviesWithShowtimes(city, date, theater_id, page, limit)
  res.json({
    message: 'Get movies with showtimes success',
    result
  })
}

export const searchMoviesController = async (req: Request, res: Response) => {
  const query = req.query.q as string
  const filters = {
    genre: req.query.genre as string,
    year: req.query.year ? parseInt(req.query.year as string) : undefined,
    language: req.query.language as string,
    rating_min: req.query.rating_min ? parseFloat(req.query.rating_min as string) : undefined,
    rating_max: req.query.rating_max ? parseFloat(req.query.rating_max as string) : undefined,
    duration_min: req.query.duration_min ? parseInt(req.query.duration_min as string) : undefined,
    duration_max: req.query.duration_max ? parseInt(req.query.duration_max as string) : undefined
  }
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const result = await movieService.searchMovies(query, filters, page, limit)
  res.json({
    message: 'Search movies success',
    result
  })
}

export const getMovieStatsController = async (req: Request, res: Response) => {
  const result = await movieService.getMovieStats()
  res.json({
    message: 'Get movie statistics success',
    result
  })
}

export const getAvailableGenresController = async (req: Request, res: Response) => {
  const result = await movieService.getAvailableGenres()
  res.json({
    message: 'Get available genres success',
    result
  })
}

export const getAvailableLanguagesController = async (req: Request, res: Response) => {
  const result = await movieService.getAvailableLanguages()
  res.json({
    message: 'Get available languages success',
    result
  })
}

export const getTopRevenueMoviesController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const result = await movieService.getTopRevenueMovies(limit)
  res.json({
    message: 'Top 10 phim có doanh thu cao nhất',
    result
  })
}
