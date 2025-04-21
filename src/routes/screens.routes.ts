import { Router } from 'express'
import {
  createScreenController,
  deleteScreenController,
  getScreenByIdController,
  getScreensController,
  updateScreenController
} from '../controllers/screen.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createScreenValidator, screenIdValidator, updateScreenValidator } from '../middlewares/screen.middlewares'
import { wrapAsync } from '../utils/handler'

const screensRouter = Router()

// Public routes (to get screen info for seating charts)
screensRouter.get('/', wrapAsync(getScreensController))
screensRouter.get('/:screen_id', screenIdValidator, wrapAsync(getScreenByIdController))

// Protected routes (admin only)
screensRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createScreenValidator,
  wrapAsync(createScreenController)
)

screensRouter.put(
  '/:screen_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateScreenValidator,
  wrapAsync(updateScreenController)
)

screensRouter.delete(
  '/:screen_id',
  AccessTokenValidator,
  verifiedUserValidator,
  screenIdValidator,
  wrapAsync(deleteScreenController)
)

export default screensRouter
