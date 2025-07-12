// src/controllers/staff/movie.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { MOVIE_MESSAGES } from '~/constants/messages'
import {
  CreateMovieReqBody,
  GetMoviesReqQuery,
  MovieIdReqParams,
  UpdateMovieReqBody
} from '~/models/request/Movie.request'
import { TokenPayload } from '~/models/request/User.request'
import staffMovieService from '~/services/Staff/movie.services'

// Staff tạo movie
export const staffCreateMovieController = async (
  req: Request<ParamsDictionary, any, CreateMovieReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffMovieService.createMovie(user_id, req.body)
  res.json({
    message: MOVIE_MESSAGES.CREATE_MOVIE_SUCCESS,
    result
  })
}

// Staff lấy danh sách movies của mình
export const staffGetMyMoviesController = async (
  req: Request<ParamsDictionary, any, any, GetMoviesReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffMovieService.getMyMovies(user_id, req.query)
  res.json({
    message: MOVIE_MESSAGES.GET_MOVIES_SUCCESS,
    result
  })
}

// Staff lấy chi tiết movie của mình
export const staffGetMyMovieByIdController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffMovieService.getMyMovieById(user_id, movie_id)
  res.json({
    message: MOVIE_MESSAGES.GET_MOVIE_SUCCESS,
    result
  })
}

// Staff cập nhật movie của mình
export const staffUpdateMyMovieController = async (
  req: Request<MovieIdReqParams, any, UpdateMovieReqBody>,
  res: Response
) => {
  const { movie_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffMovieService.updateMyMovie(user_id, movie_id, req.body)
  res.json({
    message: MOVIE_MESSAGES.UPDATE_MOVIE_SUCCESS,
    result
  })
}

// Staff xóa movie của mình
export const staffDeleteMyMovieController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffMovieService.deleteMyMovie(user_id, movie_id)
  res.json({
    message: MOVIE_MESSAGES.DELETE_MOVIE_SUCCESS,
    result
  })
}

// Staff xem ratings của movie mình tạo
export const staffGetMyMovieRatingsController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const result = await staffMovieService.getMyMovieRatings(user_id, movie_id, page, limit)
  res.json({
    message: 'Get my movie ratings success',
    result
  })
}

// Staff xem feedbacks của movie mình tạo
export const staffGetMyMovieFeedbacksController = async (req: Request<MovieIdReqParams>, res: Response) => {
  const { movie_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const includeAll = req.query.include_all === 'true'

  const result = await staffMovieService.getMyMovieFeedbacks(user_id, movie_id, page, limit, includeAll)
  res.json({
    message: 'Get my movie feedbacks success',
    result
  })
}

// Staff xem thống kê movies của mình
export const staffGetMyMovieStatsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffMovieService.getMyMovieStats(user_id)
  res.json({
    message: 'Get my movie statistics success',
    result
  })
}

// Staff xem top rated movies của mình
export const staffGetMyTopRatedMoviesController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const limit = parseInt(req.query.limit as string) || 5

  const result = await staffMovieService.getMyTopRatedMovies(user_id, limit)
  res.json({
    message: 'Get my top rated movies success',
    result
  })
}
