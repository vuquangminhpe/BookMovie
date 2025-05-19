import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  addFavoriteController,
  checkFavoriteStatusController,
  getUserFavoritesController,
  removeFavoriteController
} from '../controllers/favorites.controllers'
import { ObjectId } from 'mongodb'
import { validate } from '../utils/validation'
import { checkSchema } from 'express-validator'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { FAVORITE_MESSAGES } from '../constants/messages'

const favoritesRouter = Router()

// Apply auth middleware to all routes
favoritesRouter.use(AccessTokenValidator, verifiedUserValidator)

// Get user favorites
favoritesRouter.get('/', wrapAsync(getUserFavoritesController))

// Add to favorites
favoritesRouter.post(
  '/',
  validate(
    checkSchema(
      {
        movie_id: {
          notEmpty: {
            errorMessage: FAVORITE_MESSAGES.INVALID_MOVIE_ID
          },
          custom: {
            options: (value) => {
              if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus({
                  message: FAVORITE_MESSAGES.INVALID_MOVIE_ID,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
              return true
            }
          }
        }
      },
      ['body']
    )
  ),
  wrapAsync(addFavoriteController)
)

// Remove from favorites
favoritesRouter.delete(
  '/:movie_id',
  validate(
    checkSchema(
      {
        movie_id: {
          custom: {
            options: (value) => {
              if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus({
                  message: FAVORITE_MESSAGES.INVALID_MOVIE_ID,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
              return true
            }
          }
        }
      },
      ['params']
    )
  ),
  wrapAsync(removeFavoriteController)
)

// Check if movie is in favorites
favoritesRouter.get(
  '/:movie_id/status',
  validate(
    checkSchema(
      {
        movie_id: {
          custom: {
            options: (value) => {
              if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus({
                  message: FAVORITE_MESSAGES.INVALID_MOVIE_ID,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
              return true
            }
          }
        }
      },
      ['params']
    )
  ),
  wrapAsync(checkFavoriteStatusController)
)

export default favoritesRouter
