import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { MOVIE_MESSAGES, SCREEN_MESSAGES, SHOWTIME_MESSAGES, THEATER_MESSAGES } from '../constants/messages'
import { ShowtimeStatus } from '../models/schemas/Showtime.schema'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

export const createShowtimeValidator = validate(
  checkSchema(
    {
      movie_id: {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.MOVIE_ID_IS_REQUIRED
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
      screen_id: {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.SCREEN_ID_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: SCREEN_MESSAGES.INVALID_SCREEN_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const screen = await databaseService.screens.findOne({ _id: new ObjectId(value) })
            if (!screen) {
              throw new ErrorWithStatus({
                message: SCREEN_MESSAGES.SCREEN_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      theater_id: {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.THEATER_ID_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: THEATER_MESSAGES.INVALID_THEATER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const theater = await databaseService.theaters.findOne({ _id: new ObjectId(value) })
            if (!theater) {
              throw new ErrorWithStatus({
                message: THEATER_MESSAGES.THEATER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      start_time: {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.START_TIME_IS_REQUIRED
        },
        isISO8601: {
          errorMessage: SHOWTIME_MESSAGES.START_TIME_MUST_BE_ISO8601
        },
        custom: {
          options: (value) => {
            const startTime = new Date(value)
            const now = new Date()
            if (startTime < now) {
              throw new Error(SHOWTIME_MESSAGES.SHOWTIME_IN_PAST)
            }
            return true
          }
        }
      },
      end_time: {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.END_TIME_IS_REQUIRED
        },
        isISO8601: {
          errorMessage: SHOWTIME_MESSAGES.END_TIME_MUST_BE_ISO8601
        },
        custom: {
          options: (value, { req }) => {
            const startTime = new Date(req.body.start_time)
            const endTime = new Date(value)
            if (endTime <= startTime) {
              throw new Error('End time must be greater than start time')
            }
            return true
          }
        }
      },
      price: {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_IS_REQUIRED
        },
        isObject: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_IS_REQUIRED
        },
        custom: {
          options: (value) => {
            if (!value.regular || typeof value.regular !== 'number') {
              throw new Error(SHOWTIME_MESSAGES.REGULAR_PRICE_IS_REQUIRED)
            }
            return true
          }
        }
      },
      'price.regular': {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.REGULAR_PRICE_IS_REQUIRED
        },
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      'price.premium': {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      'price.recliner': {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      'price.couple': {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      available_seats: {
        notEmpty: {
          errorMessage: SHOWTIME_MESSAGES.AVAILABLE_SEATS_IS_REQUIRED
        },
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.AVAILABLE_SEATS_MUST_BE_A_NUMBER
        },
        toInt: true
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(ShowtimeStatus)],
          errorMessage: SHOWTIME_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['body']
  )
)

export const updateShowtimeValidator = validate(
  checkSchema(
    {
      showtime_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: SHOWTIME_MESSAGES.INVALID_SHOWTIME_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(value) })
            if (!showtime) {
              throw new ErrorWithStatus({
                message: SHOWTIME_MESSAGES.SHOWTIME_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      start_time: {
        optional: true,
        isISO8601: {
          errorMessage: SHOWTIME_MESSAGES.START_TIME_MUST_BE_ISO8601
        },
        custom: {
          options: (value) => {
            const startTime = new Date(value)
            const now = new Date()
            if (startTime < now) {
              throw new Error(SHOWTIME_MESSAGES.SHOWTIME_IN_PAST)
            }
            return true
          }
        }
      },
      end_time: {
        optional: true,
        isISO8601: {
          errorMessage: SHOWTIME_MESSAGES.END_TIME_MUST_BE_ISO8601
        },
        custom: {
          options: (value, { req }) => {
            const startTime = req.body.start_time ? new Date(req.body.start_time) : null
            const endTime = new Date(value)

            if (startTime && endTime <= startTime) {
              throw new Error('End time must be greater than start time')
            }
            return true
          }
        }
      },
      price: {
        optional: true,
        isObject: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_IS_REQUIRED
        }
      },
      'price.regular': {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      'price.premium': {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      'price.recliner': {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      'price.couple': {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.PRICE_MUST_BE_A_NUMBER
        },
        toFloat: true
      },
      available_seats: {
        optional: true,
        isNumeric: {
          errorMessage: SHOWTIME_MESSAGES.AVAILABLE_SEATS_MUST_BE_A_NUMBER
        },
        toInt: true
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(ShowtimeStatus)],
          errorMessage: SHOWTIME_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['params', 'body']
  )
)

export const showtimeIdValidator = validate(
  checkSchema(
    {
      showtime_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: SHOWTIME_MESSAGES.INVALID_SHOWTIME_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const showtime = await databaseService.showtimes.findOne({ _id: new ObjectId(value) })
            if (!showtime) {
              throw new ErrorWithStatus({
                message: SHOWTIME_MESSAGES.SHOWTIME_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)
