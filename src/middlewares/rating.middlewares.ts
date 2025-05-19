import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { MOVIE_MESSAGES, RATING_MESSAGES } from '../constants/messages'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import { Request } from 'express'

export const createRatingValidator = validate(
  checkSchema(
    {
      movie_id: {
        notEmpty: {
          errorMessage: RATING_MESSAGES.MOVIE_ID_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: MOVIE_MESSAGES.INVALID_MOVIE_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const movie = await databaseService.movies.findOne({ _id: new ObjectId(value) })
            if (!movie) {
              throw new ErrorWithStatus({
                message: MOVIE_MESSAGES.MOVIE_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      rating: {
        notEmpty: {
          errorMessage: RATING_MESSAGES.RATING_IS_REQUIRED
        },
        isNumeric: {
          errorMessage: RATING_MESSAGES.RATING_MUST_BE_A_NUMBER
        },
        custom: {
          options: (value) => {
            const ratingValue = Number(value)
            if (ratingValue < 1 || ratingValue > 5) {
              throw new Error(RATING_MESSAGES.RATING_MUST_BE_BETWEEN_1_AND_5)
            }
            return true
          }
        },
        toFloat: true
      },
      comment: {
        optional: true,
        isString: {
          errorMessage: RATING_MESSAGES.COMMENT_MUST_BE_A_STRING
        },
        isLength: {
          options: { max: 1000 },
          errorMessage: RATING_MESSAGES.COMMENT_LENGTH_MUST_BE_LESS_THAN_1000
        },
        trim: true
      }
    },
    ['body']
  )
)

export const updateRatingValidator = validate(
  checkSchema(
    {
      rating_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: RATING_MESSAGES.INVALID_RATING_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const rating = await databaseService.ratings.findOne({ _id: new ObjectId(value) })
            if (!rating) {
              throw new ErrorWithStatus({
                message: RATING_MESSAGES.RATING_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Check if the user is the owner of the rating
            const { user_id } = req.decode_authorization as TokenPayload
            if (rating.user_id.toString() !== user_id) {
              throw new ErrorWithStatus({
                message: RATING_MESSAGES.USER_CAN_ONLY_UPDATE_OWN_RATINGS,
                status: HTTP_STATUS.FORBIDDEN
              })
            }

            return true
          }
        }
      },
      rating: {
        optional: true,
        isNumeric: {
          errorMessage: RATING_MESSAGES.RATING_MUST_BE_A_NUMBER
        },
        custom: {
          options: (value) => {
            const ratingValue = Number(value)
            if (ratingValue < 1 || ratingValue > 5) {
              throw new Error(RATING_MESSAGES.RATING_MUST_BE_BETWEEN_1_AND_5)
            }
            return true
          }
        },
        toFloat: true
      },
      comment: {
        optional: true,
        isString: {
          errorMessage: RATING_MESSAGES.COMMENT_MUST_BE_A_STRING
        },
        isLength: {
          options: { max: 1000 },
          errorMessage: RATING_MESSAGES.COMMENT_LENGTH_MUST_BE_LESS_THAN_1000
        },
        trim: true
      }
    },
    ['params', 'body']
  )
)

export const ratingIdValidator = validate(
  checkSchema(
    {
      rating_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: RATING_MESSAGES.INVALID_RATING_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const rating = await databaseService.ratings.findOne({ _id: new ObjectId(value) })
            if (!rating) {
              throw new ErrorWithStatus({
                message: RATING_MESSAGES.RATING_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // For delete operations, check if the user is the owner
            if (req.method === 'DELETE') {
              const { user_id } = req.decode_authorization as TokenPayload
              if (rating.user_id.toString() !== user_id) {
                throw new ErrorWithStatus({
                  message: RATING_MESSAGES.USER_CAN_ONLY_DELETE_OWN_RATINGS,
                  status: HTTP_STATUS.FORBIDDEN
                })
              }
            }

            return true
          }
        }
      }
    },
    ['params']
  )
)
