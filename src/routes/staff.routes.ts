import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import {
  isStaffMiddleware,
  hasValidContractMiddleware,
  ownTheaterOnlyMiddleware,
  canCreateTheaterMiddleware
} from '../middlewares/staff.middlewares'
import { wrapAsync } from '../utils/handler'

// Import controllers
import { getMyContractController } from '../controllers/contract.controllers'

import {
  createTheaterController,
  getTheaterByIdController,
  updateTheaterController,
  getTheatersController
} from '../controllers/theater.controllers'

import {
  createScreenController,
  getScreensController,
  getScreenByIdController,
  updateScreenController,
  deleteScreenController
} from '../controllers/screen.controllers'

import {
  createMovieController,
  getMoviesController,
  getMovieByIdController,
  updateMovieController,
  deleteMovieController
} from '../controllers/movies.controllers'

import {
  createShowtimeController,
  getShowtimesController,
  getShowtimeByIdController,
  updateShowtimeController,
  deleteShowtimeController
} from '../controllers/showtimes.controllers'

import { getMyBookingsController, getBookingByIdController } from '../controllers/bookings.controllers'
import databaseService from '~/services/database.services'
import { ObjectId } from 'bson'

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
 * SCREEN MANAGEMENT (Requires valid contract + own theater)
 * =============================================================================
 */

/**
 * Description: Create screen for my theater
 * Path: /staff/theater/:theater_id/screens
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateScreenReqBody
 */
staffRouter.post('/theater/:theater_id/screens', ownTheaterOnlyMiddleware, wrapAsync(createScreenController))

/**
 * Description: Get screens of my theater
 * Path: /staff/theater/:theater_id/screens
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/theater/:theater_id/screens', ownTheaterOnlyMiddleware, wrapAsync(getScreensController))

/**
 * Description: Get screen details
 * Path: /staff/screens/:screen_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/screens/:screen_id', wrapAsync(getScreenByIdController))

/**
 * Description: Update screen
 * Path: /staff/screens/:screen_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateScreenReqBody
 */
staffRouter.put('/screens/:screen_id', wrapAsync(updateScreenController))

/**
 * Description: Delete screen
 * Path: /staff/screens/:screen_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.delete('/screens/:screen_id', wrapAsync(deleteScreenController))

/**
 * =============================================================================
 * MOVIE MANAGEMENT (Staff can create movies for their theater)
 * =============================================================================
 */

/**
 * Description: Create movie
 * Path: /staff/movies
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateMovieReqBody
 */
staffRouter.post('/movies', wrapAsync(createMovieController))

/**
 * Description: Get movies
 * Path: /staff/movies
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/movies', wrapAsync(getMoviesController))

/**
 * Description: Get movie details
 * Path: /staff/movies/:movie_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/movies/:movie_id', wrapAsync(getMovieByIdController))

/**
 * Description: Update movie
 * Path: /staff/movies/:movie_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateMovieReqBody
 */
staffRouter.put('/movies/:movie_id', wrapAsync(updateMovieController))

/**
 * Description: Delete movie
 * Path: /staff/movies/:movie_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.delete('/movies/:movie_id', wrapAsync(deleteMovieController))

/**
 * =============================================================================
 * SHOWTIME MANAGEMENT
 * =============================================================================
 */

/**
 * Description: Create showtime for my theater
 * Path: /staff/showtimes
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateShowtimeReqBody
 */
staffRouter.post('/showtimes', wrapAsync(createShowtimeController))

/**
 * Description: Get showtimes for my theater
 * Path: /staff/showtimes
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/showtimes', wrapAsync(getShowtimesController))

/**
 * Description: Get showtime details
 * Path: /staff/showtimes/:showtime_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.get('/showtimes/:showtime_id', wrapAsync(getShowtimeByIdController))

/**
 * Description: Update showtime
 * Path: /staff/showtimes/:showtime_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateShowtimeReqBody
 */
staffRouter.put('/showtimes/:showtime_id', wrapAsync(updateShowtimeController))

/**
 * Description: Delete showtime
 * Path: /staff/showtimes/:showtime_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
staffRouter.delete('/showtimes/:showtime_id', wrapAsync(deleteShowtimeController))

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
          databaseService.movies.countDocuments({}), // All movies available
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
            available_movies: totalMovies
          }
        }
      })
    }
  )
)

export default staffRouter
