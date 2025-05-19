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
