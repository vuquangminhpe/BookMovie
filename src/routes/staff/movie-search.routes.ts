import { Router } from 'express'
import { 
  staffSearchAvailableMoviesController,
  staffGetMovieDetailsController,
  staffGetPopularMoviesController
} from '../../controllers/staff/controllers/movie-search.controllers'
import { isStaffMiddleware } from '../../middlewares/staff.middlewares'
import { AccessTokenValidator } from '../../middlewares/users.middlewares'

const staffMovieSearchRouter = Router()

/**
 * Description: Staff search available movies in system to create showtimes
 * Path: /staff/movies/search
 * Method: GET
 * Query: { search?: string, page?: string, limit?: string, genre?: string, language?: string, status?: string }
 * Headers: { Authorization: Bearer <access_token> }
 */
staffMovieSearchRouter.get('/search', AccessTokenValidator, isStaffMiddleware, staffSearchAvailableMoviesController)

/**
 * Description: Staff get popular movies for reference
 * Path: /staff/movies/popular
 * Method: GET  
 * Query: { limit?: string }
 * Headers: { Authorization: Bearer <access_token> }
 */
staffMovieSearchRouter.get('/popular', AccessTokenValidator, isStaffMiddleware, staffGetPopularMoviesController)

/**
 * Description: Staff get movie details
 * Path: /staff/movies/:movie_id
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 */
staffMovieSearchRouter.get('/:movie_id', AccessTokenValidator, isStaffMiddleware, staffGetMovieDetailsController)

export default staffMovieSearchRouter
