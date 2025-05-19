import { Router } from 'express'
import {
  createRatingController,
  deleteRatingController,
  getRatingByIdController,
  getRatingsController,
  updateRatingController
} from '../controllers/ratings.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { createRatingValidator, ratingIdValidator, updateRatingValidator } from '../middlewares/rating.middlewares'
import { wrapAsync } from '../utils/handler'

const ratingsRouter = Router()

ratingsRouter.get('/', wrapAsync(getRatingsController))
ratingsRouter.get('/:rating_id', ratingIdValidator, wrapAsync(getRatingByIdController))

ratingsRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createRatingValidator,
  wrapAsync(createRatingController)
)

ratingsRouter.put(
  '/:rating_id',
  AccessTokenValidator,
  verifiedUserValidator,
  updateRatingValidator,
  wrapAsync(updateRatingController)
)

ratingsRouter.delete(
  '/:rating_id',
  AccessTokenValidator,
  verifiedUserValidator,
  ratingIdValidator,
  wrapAsync(deleteRatingController)
)

export default ratingsRouter
