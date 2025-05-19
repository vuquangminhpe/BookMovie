import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { FEEDBACK_MESSAGES, MOVIE_MESSAGES } from '../constants/messages'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { TokenPayload } from '../models/request/User.request'
import { Request } from 'express'
import { FeedbackStatus } from '../models/schemas/Feedback.schema'
import { UserRole } from '../models/schemas/User.schema'

export const createFeedbackValidator = validate(
  checkSchema(
    {
      movie_id: {
        notEmpty: {
          errorMessage: FEEDBACK_MESSAGES.MOVIE_ID_IS_REQUIRED
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
      title: {
        notEmpty: {
          errorMessage: FEEDBACK_MESSAGES.TITLE_IS_REQUIRED
        },
        isString: {
          errorMessage: FEEDBACK_MESSAGES.TITLE_MUST_BE_A_STRING
        },
        isLength: {
          options: { min: 5, max: 100 },
          errorMessage: FEEDBACK_MESSAGES.TITLE_LENGTH_MUST_BE_BETWEEN_5_AND_100
        },
        trim: true
      },
      content: {
        notEmpty: {
          errorMessage: FEEDBACK_MESSAGES.CONTENT_IS_REQUIRED
        },
        isString: {
          errorMessage: FEEDBACK_MESSAGES.CONTENT_MUST_BE_A_STRING
        },
        isLength: {
          options: { min: 10, max: 2000 },
          errorMessage: FEEDBACK_MESSAGES.CONTENT_LENGTH_MUST_BE_BETWEEN_10_AND_2000
        },
        trim: true
      },
      is_spoiler: {
        optional: true,
        isBoolean: {
          errorMessage: FEEDBACK_MESSAGES.IS_SPOILER_MUST_BE_A_BOOLEAN
        },
        toBoolean: true
      }
    },
    ['body']
  )
)

export const updateFeedbackValidator = validate(
  checkSchema(
    {
      feedback_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.INVALID_FEEDBACK_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const feedback = await databaseService.feedbacks.findOne({ _id: new ObjectId(value) })
            if (!feedback) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.FEEDBACK_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Check if the user is the owner of the feedback
            const { user_id } = req.decode_authorization as TokenPayload
            if (feedback.user_id.toString() !== user_id) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.USER_CAN_ONLY_UPDATE_OWN_FEEDBACKS,
                status: HTTP_STATUS.FORBIDDEN
              })
            }

            return true
          }
        }
      },
      title: {
        optional: true,
        isString: {
          errorMessage: FEEDBACK_MESSAGES.TITLE_MUST_BE_A_STRING
        },
        isLength: {
          options: { min: 5, max: 100 },
          errorMessage: FEEDBACK_MESSAGES.TITLE_LENGTH_MUST_BE_BETWEEN_5_AND_100
        },
        trim: true
      },
      content: {
        optional: true,
        isString: {
          errorMessage: FEEDBACK_MESSAGES.CONTENT_MUST_BE_A_STRING
        },
        isLength: {
          options: { min: 10, max: 2000 },
          errorMessage: FEEDBACK_MESSAGES.CONTENT_LENGTH_MUST_BE_BETWEEN_10_AND_2000
        },
        trim: true
      },
      is_spoiler: {
        optional: true,
        isBoolean: {
          errorMessage: FEEDBACK_MESSAGES.IS_SPOILER_MUST_BE_A_BOOLEAN
        },
        toBoolean: true
      }
    },
    ['params', 'body']
  )
)

export const updateFeedbackStatusValidator = validate(
  checkSchema(
    {
      feedback_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.INVALID_FEEDBACK_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const feedback = await databaseService.feedbacks.findOne({ _id: new ObjectId(value) })
            if (!feedback) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.FEEDBACK_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            return true
          }
        }
      },
      status: {
        notEmpty: {
          errorMessage: FEEDBACK_MESSAGES.INVALID_STATUS
        },
        isIn: {
          options: [Object.values(FeedbackStatus)],
          errorMessage: FEEDBACK_MESSAGES.INVALID_STATUS
        },
        custom: {
          options: async (value, { req }) => {
            // Check if the user is an admin
            const { user_id } = req.decode_authorization as TokenPayload
            const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

            if (user?.role !== UserRole.Admin) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.ONLY_ADMIN_CAN_UPDATE_STATUS,
                status: HTTP_STATUS.FORBIDDEN
              })
            }

            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const feedbackIdValidator = validate(
  checkSchema(
    {
      feedback_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.INVALID_FEEDBACK_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const feedback = await databaseService.feedbacks.findOne({ _id: new ObjectId(value) })
            if (!feedback) {
              throw new ErrorWithStatus({
                message: FEEDBACK_MESSAGES.FEEDBACK_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            if (req.method === 'DELETE') {
              const { user_id } = req.decode_authorization as TokenPayload
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

              if (feedback.user_id.toString() !== user_id && user?.role !== UserRole.Admin) {
                throw new ErrorWithStatus({
                  message: FEEDBACK_MESSAGES.USER_CAN_ONLY_DELETE_OWN_FEEDBACKS,
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
