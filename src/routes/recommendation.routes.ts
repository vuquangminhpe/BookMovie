import { Router } from 'express'
import {
  getPersonalizedRecommendationsController,
  getSimilarMoviesController,
  getPopularRecommendationsController,
  getHighlyRatedMoviesController
} from '../controllers/recommendations.controllers'
import { AccessTokenValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'

const recommendationRouter = Router()

// Get personalized recommendations for a user (requires auth)
recommendationRouter.get(
  '/personalized/:user_id',
  AccessTokenValidator,
  wrapAsync(getPersonalizedRecommendationsController)
)

// Get similar movies to a specific movie
recommendationRouter.get('/similar/:movie_id', wrapAsync(getSimilarMoviesController))

// Get popular movies
recommendationRouter.get('/popular', wrapAsync(getPopularRecommendationsController))

// Get highly rated movies
recommendationRouter.get('/rated', wrapAsync(getHighlyRatedMoviesController))

export default recommendationRouter
