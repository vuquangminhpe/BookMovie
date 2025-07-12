// src/routes/staff.routes.ts - Fixed version with proper middleware usage
import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import {
  isStaffMiddleware,
  hasValidContractMiddleware,
  ownTheaterOnlyMiddleware,
  canCreateTheaterMiddleware
} from '../middlewares/staff.middlewares'

// Import staff screen middlewares (NOW PROPERLY USED)
import {
  validateStaffScreenOwnershipMiddleware,
  validateStaffTheaterForScreenMiddleware,
  createStaffScreenValidator,
  updateStaffScreenValidator,
  canDeleteScreenMiddleware
} from '../middlewares/staff/screen.middlewares'

import { wrapAsync } from '../utils/handler'

// Import controllers
import { getMyContractController } from '../controllers/contract.controllers'

import {
  createTheaterController,
  getTheaterByIdController,
  updateTheaterController
} from '../controllers/theater.controllers'

// Import staff screen controllers
import {
  staffCreateScreenController,
  staffGetMyTheaterScreensController,
  staffGetMyScreenByIdController,
  staffUpdateMyScreenController,
  staffDeleteMyScreenController,
  staffGetMyScreenStatsController
} from '../controllers/staff/controllers/screen.controllers'

// Import staff movie controllers
import {
  staffCreateMovieController,
  staffGetMyMoviesController,
  staffGetMyMovieByIdController,
  staffUpdateMyMovieController,
  staffDeleteMyMovieController,
  staffGetMyMovieRatingsController,
  staffGetMyMovieFeedbacksController,
  staffGetMyMovieStatsController,
  staffGetMyTopRatedMoviesController
} from '../controllers/staff/controllers/movie.controllers'

// Import staff showtime controllers
import {
  staffCreateShowtimeController,
  staffGetMyShowtimesController,
  staffGetMyShowtimeByIdController,
  staffUpdateMyShowtimeController,
  staffDeleteMyShowtimeController
} from '../controllers/staff/controllers/showtime.controllers'

import { getBookingByIdController } from '../controllers/bookings.controllers'
import databaseService from '~/services/database.services'
import { ObjectId } from 'bson'
import staffMovieSearchRouter from './staff/movie-search.routes'

const staffRouter = Router()

// Apply authentication and staff role middleware to all routes
staffRouter.use(AccessTokenValidator, verifiedUserValidator, isStaffMiddleware)

/**
 * =============================================================================
 * CONTRACT MANAGEMENT
 * =============================================================================
 */

/**
 * Description: Get my contract details
 * Path: /staff/contract
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/contract', wrapAsync(getMyContractController))

/**
 * =============================================================================
 * MOVIE SEARCH FOR SHOWTIMES (Browse system movies)
 * =============================================================================
 */

/**
 * Mount movie search routes for staff to browse available movies
 * Paths: /staff/movies/*
 */
staffRouter.use('/movies', staffMovieSearchRouter)

/**
 * =============================================================================
 * THEATER MANAGEMENT (Requires valid contract)
 * =============================================================================
 */

// Apply contract validation for theater management
staffRouter.use('/theater', hasValidContractMiddleware)

/**
 * Description: Create new theater (staff can only create one)
 * Path: /staff/theater
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateTheaterReqBody
 */
staffRouter.post('/theater', canCreateTheaterMiddleware, wrapAsync(createTheaterController))

/**
 * Description: Get my theater details
 * Path: /staff/theater/mine
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get(
  '/theater/mine',
  wrapAsync(
    async (
      req: { decode_authorization: any },
      res: {
        status: (arg0: number) => {
          (): any
          new (): any
          json: { (arg0: { message: string; result: null }): any; new (): any }
        }
        json: (arg0: { message: string; result: any }) => void
      }
    ) => {
      const { user_id } = req.decode_authorization as any

      // Find theater managed by this staff
      const theater = await databaseService.theaters.findOne({
        manager_id: new ObjectId(user_id as string)
      })

      if (!theater) {
        return res.status(404).json({
          message: 'No theater found. Please create your theater first.',
          result: null
        })
      }

      res.json({
        message: 'Get my theater success',
        result: theater
      })
    }
  )
)

/**
 * Description: Update my theater
 * Path: /staff/theater/:theater_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateTheaterReqBody
 */
staffRouter.put('/theater/:theater_id', ownTheaterOnlyMiddleware, wrapAsync(updateTheaterController))

/**
 * Description: Get theater details
 * Path: /staff/theater/:theater_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/theater/:theater_id', ownTheaterOnlyMiddleware, wrapAsync(getTheaterByIdController))

/**
 * =============================================================================
 * SCREEN MANAGEMENT (Using dedicated staff screen middlewares)
 * =============================================================================
 */

/**
 * Description: Create screen for my theater
 * Path: /staff/theater/:theater_id/screens
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateScreenReqBody
 */
staffRouter.post(
  '/theater/:theater_id/screens',
  validateStaffTheaterForScreenMiddleware, // Validate theater ownership
  createStaffScreenValidator, // Validate request body
  wrapAsync(staffCreateScreenController)
)

/**
 * Description: Get screens of my theater
 * Path: /staff/theater/:theater_id/screens
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get(
  '/theater/:theater_id/screens',
  validateStaffTheaterForScreenMiddleware, // Validate theater ownership
  wrapAsync(staffGetMyTheaterScreensController)
)

/**
 * Description: Get screen details
 * Path: /staff/screens/:screen_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get(
  '/screens/:screen_id',
  validateStaffScreenOwnershipMiddleware, // Validate screen ownership via theater
  wrapAsync(staffGetMyScreenByIdController)
)

/**
 * Description: Update screen
 * Path: /staff/screens/:screen_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateScreenReqBody
 */
staffRouter.put(
  '/screens/:screen_id',
  validateStaffScreenOwnershipMiddleware, // Validate screen ownership
  updateStaffScreenValidator, // Validate request body
  wrapAsync(staffUpdateMyScreenController)
)

/**
 * Description: Delete screen
 * Path: /staff/screens/:screen_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.delete(
  '/screens/:screen_id',
  validateStaffScreenOwnershipMiddleware, // Validate screen ownership
  canDeleteScreenMiddleware, // Check delete constraints
  wrapAsync(staffDeleteMyScreenController)
)

/**
 * Description: Get screen statistics
 * Path: /staff/screens/stats
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/screens/stats', wrapAsync(staffGetMyScreenStatsController))

/**
 * =============================================================================
 * MOVIE MANAGEMENT (Staff chỉ quản lý movies của mình)
 * =============================================================================
 */

/**
 * Description: Create movie (Tạo movie mới)
 * Path: /staff/movies
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateMovieReqBody
 */
staffRouter.post('/movies', wrapAsync(staffCreateMovieController))

/**
 * Description: Get my movies (Lấy danh sách movies của mình)
 * Path: /staff/movies
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: GetMoviesReqQuery
 */
staffRouter.get('/movies', wrapAsync(staffGetMyMoviesController))

/**
 * Description: Get my movie details (Lấy chi tiết movie của mình)
 * Path: /staff/movies/:movie_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/movies/:movie_id', wrapAsync(staffGetMyMovieByIdController))

/**
 * Description: Update my movie (Cập nhật movie của mình)
 * Path: /staff/movies/:movie_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateMovieReqBody
 */
staffRouter.put('/movies/:movie_id', wrapAsync(staffUpdateMyMovieController))

/**
 * Description: Delete my movie (Xóa movie của mình)
 * Path: /staff/movies/:movie_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.delete('/movies/:movie_id', wrapAsync(staffDeleteMyMovieController))

/**
 * Description: Get ratings for my movie (Xem ratings của movie mình tạo)
 * Path: /staff/movies/:movie_id/ratings
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: page, limit
 */
staffRouter.get('/movies/:movie_id/ratings', wrapAsync(staffGetMyMovieRatingsController))

/**
 * Description: Get feedbacks for my movie (Xem feedbacks của movie mình tạo)
 * Path: /staff/movies/:movie_id/feedbacks
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: page, limit, include_all
 */
staffRouter.get('/movies/:movie_id/feedbacks', wrapAsync(staffGetMyMovieFeedbacksController))

/**
 * Description: Get my movie statistics (Thống kê movies của mình)
 * Path: /staff/movies/stats
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/movies/stats', wrapAsync(staffGetMyMovieStatsController))

/**
 * Description: Get my top rated movies (Top movies có rating cao nhất của mình)
 * Path: /staff/movies/top-rated
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: limit (default: 5)
 */
staffRouter.get('/movies/top-rated', wrapAsync(staffGetMyTopRatedMoviesController))

/**
 * =============================================================================
 * SHOWTIME MANAGEMENT (Staff chỉ quản lý showtimes cho movies của mình)
 * =============================================================================
 */

/**
 * Description: Create showtime for my movie
 * Path: /staff/showtimes
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateShowtimeReqBody
 */
staffRouter.post('/showtimes', wrapAsync(staffCreateShowtimeController))

/**
 * Description: Get showtimes for my movies
 * Path: /staff/showtimes
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/showtimes', wrapAsync(staffGetMyShowtimesController))

/**
 * Description: Get my showtime details
 * Path: /staff/showtimes/:showtime_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/showtimes/:showtime_id', wrapAsync(staffGetMyShowtimeByIdController))

/**
 * Description: Update my showtime
 * Path: /staff/showtimes/:showtime_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateShowtimeReqBody
 */
staffRouter.put('/showtimes/:showtime_id', wrapAsync(staffUpdateMyShowtimeController))

/**
 * Description: Delete my showtime
 * Path: /staff/showtimes/:showtime_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.delete('/showtimes/:showtime_id', wrapAsync(staffDeleteMyShowtimeController))

/**
 * =============================================================================
 * BOOKING MANAGEMENT (View bookings for my theater)
 * =============================================================================
 */

/**
 * Description: Get bookings for my theater
 * Path: /staff/bookings
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get(
  '/bookings',
  wrapAsync(
    async (
      req: { decode_authorization: any; query: { limit: string; page: string } },
      res: {
        status: (arg0: number) => {
          (): any
          new (): any
          json: { (arg0: { message: string; result: { bookings: never[]; total: number } }): any; new (): any }
        }
        json: (arg0: { message: string; result: { bookings: any; total: any; page: number; limit: number } }) => void
      }
    ) => {
      const { user_id } = req.decode_authorization as any

      // Find theater managed by this staff
      const theater = await databaseService.theaters.findOne({
        manager_id: new ObjectId(user_id as string)
      })

      if (!theater) {
        return res.status(404).json({
          message: 'No theater found',
          result: { bookings: [], total: 0 }
        })
      }

      // Get bookings for this theater
      const bookings = await databaseService.bookings
        .find({ theater_id: theater._id })
        .sort({ booking_time: -1 })
        .limit(parseInt(req.query.limit as string) || 20)
        .skip((parseInt(req.query.page as string) || 1 - 1) * (parseInt(req.query.limit as string) || 20))
        .toArray()

      const total = await databaseService.bookings.countDocuments({
        theater_id: theater._id
      })

      res.json({
        message: 'Get theater bookings success',
        result: {
          bookings,
          total,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20
        }
      })
    }
  )
)

/**
 * Description: Get booking details
 * Path: /staff/bookings/:booking_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/bookings/:booking_id', wrapAsync(getBookingByIdController))

/**
 * =============================================================================
 * STATISTICS & REPORTS
 * =============================================================================
 */

/**
 * Description: Get theater statistics
 * Path: /staff/stats
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get(
  '/stats',
  wrapAsync(
    async (
      req: { decode_authorization: any },
      res: {
        status: (arg0: number) => {
          (): any
          new (): any
          json: { (arg0: { message: string; result: {} }): any; new (): any }
        }
        json: (arg0: {
          message: string
          result: {
            theater_info: { name: any; location: any; total_screens: any }
            statistics: {
              total_bookings: any
              completed_bookings: any
              today_bookings: any
              total_revenue: any
              available_movies: any
            }
          }
        }) => void
      }
    ) => {
      const { user_id } = req.decode_authorization as any

      // Find theater managed by this staff
      const theater = await databaseService.theaters.findOne({
        manager_id: new ObjectId(user_id as string)
      })

      if (!theater) {
        return res.status(404).json({
          message: 'No theater found',
          result: {}
        })
      }

      // Get statistics
      const [totalBookings, completedBookings, totalRevenue, todayBookings, totalMovies, totalScreens] =
        await Promise.all([
          databaseService.bookings.countDocuments({ theater_id: theater._id }),
          databaseService.bookings.countDocuments({
            theater_id: theater._id,
            status: 'completed' as any
          }),
          databaseService.bookings
            .aggregate([
              { $match: { theater_id: theater._id, payment_status: 'completed' } },
              { $group: { _id: null, total: { $sum: '$total_amount' } } }
            ])
            .toArray(),
          databaseService.bookings.countDocuments({
            theater_id: theater._id,
            booking_time: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }),
          databaseService.movies.countDocuments({ created_by: new ObjectId(user_id) }), // Movies created by this staff
          databaseService.screens.countDocuments({ theater_id: theater._id })
        ])

      res.json({
        message: 'Get theater statistics success',
        result: {
          theater_info: {
            name: theater.name,
            location: theater.location,
            total_screens: totalScreens
          },
          statistics: {
            total_bookings: totalBookings,
            completed_bookings: completedBookings,
            today_bookings: todayBookings,
            total_revenue: totalRevenue[0]?.total || 0,
            available_movies: totalMovies // Chỉ movies mà staff này tạo
          }
        }
      })
    }
  )
)

export default staffRouter
