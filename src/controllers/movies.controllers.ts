import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { MOVIE_MESSAGES } from '../constants/messages'
import {
  CreateMovieReqBody,
  GetMoviesReqQuery,
  MovieIdReqParams,
  UpdateMovieReqBody
} from '../models/request/Movie.request'
import movieService from '../services/movie.services'

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
