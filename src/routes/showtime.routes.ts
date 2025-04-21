import { Router } from 'express'
import {
  createShowtimeController,
  deleteShowtimeController,
  getShowtimeByIdController,
  getShowtimesController,
  updateShowtimeController
} from '../controllers/showtimes.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import {
  createShowtimeValidator,
  showtimeIdValidator,
  updateShowtimeValidator
} from '../middlewares/showtime.middlewares'
import { wrapAsync } from '../utils/handler'

const showtimesRouter = Router()

// Public routes
showtimesRouter.get('/', wrapAsync(getShowtimesController))
showtimesRouter.get('/:showtime_id', showtimeIdValidator, wrapAsync(getShowtimeByIdController))

// Protected routes (admin only)
showtimesRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createShowtimeValidator,
  wrapAsync(createShowtimeController)
)

showtimesRouter.put(
  '/:showtime_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateShowtimeValidator,
  wrapAsync(updateShowtimeController)
)

showtimesRouter.delete(
  '/:showtime_id',
  AccessTokenValidator,
  verifiedUserValidator,
  showtimeIdValidator,
  wrapAsync(deleteShowtimeController)
)

export default showtimesRouter
