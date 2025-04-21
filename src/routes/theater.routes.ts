import { Router } from 'express'
import {
  createTheaterController,
  deleteTheaterController,
  getTheaterByIdController,
  getTheatersController,
  updateTheaterController
} from '../controllers/theater.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createTheaterValidator, theaterIdValidator, updateTheaterValidator } from '../middlewares/theater.middlewares'
import { wrapAsync } from '../utils/handler'

const theatersRouter = Router()

// Public routes
theatersRouter.get('/', wrapAsync(getTheatersController))
theatersRouter.get('/:theater_id', theaterIdValidator, wrapAsync(getTheaterByIdController))

// Protected routes (admin only)
theatersRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createTheaterValidator,
  wrapAsync(createTheaterController)
)

theatersRouter.put(
  '/:theater_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateTheaterValidator,
  wrapAsync(updateTheaterController)
)

theatersRouter.delete(
  '/:theater_id',
  AccessTokenValidator,
  verifiedUserValidator,
  theaterIdValidator,
  wrapAsync(deleteTheaterController)
)

export default theatersRouter
