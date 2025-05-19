import { Router } from 'express'
import {
  createFeedbackController,
  deleteFeedbackController,
  getFeedbackByIdController,
  getFeedbacksController,
  updateFeedbackController,
  updateFeedbackStatusController
} from '../controllers/feedbacks.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import {
  createFeedbackValidator,
  feedbackIdValidator,
  updateFeedbackStatusValidator,
  updateFeedbackValidator
} from '../middlewares/feedback.middlewares'
import { wrapAsync } from '../utils/handler'

const feedbacksRouter = Router()

// Public route to get feedbacks
feedbacksRouter.get('/', wrapAsync(getFeedbacksController))
feedbacksRouter.get('/:feedback_id', feedbackIdValidator, wrapAsync(getFeedbackByIdController))

// Protected routes for creating, updating, and deleting feedbacks
feedbacksRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createFeedbackValidator,
  wrapAsync(createFeedbackController)
)

feedbacksRouter.put(
  '/:feedback_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateFeedbackValidator,
  wrapAsync(updateFeedbackController)
)

// Admin route for updating feedback status
feedbacksRouter.put(
  '/:feedback_id/status',
  AccessTokenValidator,
  verifiedUserValidator,
  updateFeedbackStatusValidator,
  wrapAsync(updateFeedbackStatusController)
)

feedbacksRouter.delete(
  '/:feedback_id',
  AccessTokenValidator,
  verifiedUserValidator,
  feedbackIdValidator,
  wrapAsync(deleteFeedbackController)
)

export default feedbacksRouter
