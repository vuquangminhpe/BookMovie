import { Router } from 'express'
import {
  createMovieController,
  deleteMovieController,
  getFeaturedMoviesController,
  getMovieByIdController,
  getMovieFeedbacksController,
  getMovieRatingsController,
  getMoviesController,
  updateMovieController
} from '../controllers/movies.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createMovieValidator, movieIdValidator, updateMovieValidator } from '../middlewares/movie.middlewares'
import { wrapAsync } from '../utils/handler'

const moviesRouter = Router()

// Public routes
moviesRouter.get('/', wrapAsync(getMoviesController))
moviesRouter.get('/:movie_id', movieIdValidator, wrapAsync(getMovieByIdController))

// Protected routes (admin only)
moviesRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createMovieValidator,
  wrapAsync(createMovieController)
)

moviesRouter.put(
  '/:movie_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateMovieValidator,
  wrapAsync(updateMovieController)
)

moviesRouter.delete(
  '/:movie_id',
  AccessTokenValidator,
  verifiedUserValidator,
  movieIdValidator,
  wrapAsync(deleteMovieController)
)
moviesRouter.get('/:movie_id/ratings', movieIdValidator, wrapAsync(getMovieRatingsController))
moviesRouter.get('/:movie_id/feedbacks', movieIdValidator, wrapAsync(getMovieFeedbacksController))
moviesRouter.get('/featured', wrapAsync(getFeaturedMoviesController))
export default moviesRouter
