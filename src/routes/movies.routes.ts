// src/routes/movies.routes.ts - Enhanced version
import { Router } from 'express'
import {
  createMovieController,
  deleteMovieController,
  getFeaturedMoviesController,
  getMovieByIdController,
  getMovieFeedbacksController,
  getMovieRatingsController,
  getMoviesController,
  updateMovieController,
  // New controllers
  getNowShowingMoviesController,
  getComingSoonMoviesController,
  getTopRatedMoviesController,
  getTrendingMoviesController,
  getMoviesByGenreController,
  getPopularMoviesController,
  getRecentlyAddedMoviesController,
  getMoviesWithShowtimesController,
  searchMoviesController,
  getMovieStatsController,
  getAvailableGenresController,
  getAvailableLanguagesController
} from '../controllers/movies.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createMovieValidator, movieIdValidator, updateMovieValidator } from '../middlewares/movie.middlewares'
import { wrapAsync } from '../utils/handler'

const moviesRouter = Router()

// Basic movie operations
moviesRouter.get('/', wrapAsync(getMoviesController))
moviesRouter.get('/search', wrapAsync(searchMoviesController))
moviesRouter.get('/:movie_id', movieIdValidator, wrapAsync(getMovieByIdController))

// Movie categories and filtering
moviesRouter.get('/categories/featured', wrapAsync(getFeaturedMoviesController))
moviesRouter.get('/categories/now-showing', wrapAsync(getNowShowingMoviesController))
moviesRouter.get('/categories/coming-soon', wrapAsync(getComingSoonMoviesController))
moviesRouter.get('/categories/top-rated', wrapAsync(getTopRatedMoviesController))
moviesRouter.get('/categories/trending', wrapAsync(getTrendingMoviesController))
moviesRouter.get('/categories/popular', wrapAsync(getPopularMoviesController))
moviesRouter.get('/categories/recently-added', wrapAsync(getRecentlyAddedMoviesController))

// Movies by genre
moviesRouter.get('/genre/:genre', wrapAsync(getMoviesByGenreController))

// Movies with showtimes
moviesRouter.get('/with-showtimes', wrapAsync(getMoviesWithShowtimesController))

// Movie metadata
moviesRouter.get('/meta/stats', wrapAsync(getMovieStatsController))
moviesRouter.get('/meta/genres', wrapAsync(getAvailableGenresController))
moviesRouter.get('/meta/languages', wrapAsync(getAvailableLanguagesController))

// Movie ratings and feedback
moviesRouter.get('/:movie_id/ratings', movieIdValidator, wrapAsync(getMovieRatingsController))
moviesRouter.get('/:movie_id/feedbacks', movieIdValidator, wrapAsync(getMovieFeedbacksController))

// ====== PROTECTED ROUTES (Admin only) ======

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

export default moviesRouter
