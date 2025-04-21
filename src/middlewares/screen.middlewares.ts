import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { SCREEN_MESSAGES, THEATER_MESSAGES } from '../constants/messages'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { ScreenStatus, ScreenType } from '../constants/enums'

export const createScreenValidator = validate(
  checkSchema(
    {
      theater_id: {
        notEmpty: {
          errorMessage: SCREEN_MESSAGES.THEATER_ID_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: SCREEN_MESSAGES.INVALID_THEATER_ID,
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
      name: {
        notEmpty: {
          errorMessage: SCREEN_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: SCREEN_MESSAGES.NAME_IS_REQUIRED
        },
        trim: true
      },
      seat_layout: {
        notEmpty: {
          errorMessage: SCREEN_MESSAGES.SEAT_LAYOUT_IS_REQUIRED
        },
        isArray: {
          errorMessage: SCREEN_MESSAGES.SEAT_LAYOUT_MUST_BE_AN_ARRAY
        },
        custom: {
          options: (value) => {
            // Basic validation for seat layout structure
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error(SCREEN_MESSAGES.SEAT_LAYOUT_MUST_BE_AN_ARRAY)
            }

            // Check if each row is an array
            for (const row of value) {
              if (!Array.isArray(row)) {
                throw new Error('Each row in seat layout must be an array')
              }

              // Check if each seat has required properties
              for (const seat of row) {
                if (!seat.row || seat.number === undefined || seat.type === undefined || seat.status === undefined) {
                  throw new Error('Each seat must have row, number, type and status properties')
                }
              }
            }

            return true
          }
        }
      },
      capacity: {
        notEmpty: {
          errorMessage: SCREEN_MESSAGES.CAPACITY_IS_REQUIRED
        },
        isNumeric: {
          errorMessage: SCREEN_MESSAGES.CAPACITY_MUST_BE_A_NUMBER
        },
        toInt: true,
        custom: {
          options: (value, { req }) => {
            // Optional: Check if capacity matches seat layout count
            if (req.body.seat_layout) {
              const seatCount = req.body.seat_layout.reduce((total: any, row: string | any[]) => total + row.length, 0)
              if (value !== seatCount) {
                throw new Error('Capacity must match total number of seats in seat layout')
              }
            }
            return true
          }
        }
      },
      screen_type: {
        optional: true,
        isIn: {
          options: [Object.values(ScreenType)],
          errorMessage: SCREEN_MESSAGES.INVALID_SCREEN_TYPE
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(ScreenStatus)],
          errorMessage: SCREEN_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['body']
  )
)

export const updateScreenValidator = validate(
  checkSchema(
    {
      screen_id: {
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
      name: {
        optional: true,
        isString: {
          errorMessage: SCREEN_MESSAGES.NAME_IS_REQUIRED
        },
        trim: true
      },
      seat_layout: {
        optional: true,
        isArray: {
          errorMessage: SCREEN_MESSAGES.SEAT_LAYOUT_MUST_BE_AN_ARRAY
        },
        custom: {
          options: (value) => {
            // Basic validation for seat layout structure
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error(SCREEN_MESSAGES.SEAT_LAYOUT_MUST_BE_AN_ARRAY)
            }

            // Check if each row is an array
            for (const row of value) {
              if (!Array.isArray(row)) {
                throw new Error('Each row in seat layout must be an array')
              }

              // Check if each seat has required properties
              for (const seat of row) {
                if (!seat.row || seat.number === undefined || seat.type === undefined || seat.status === undefined) {
                  throw new Error('Each seat must have row, number, type and status properties')
                }
              }
            }

            return true
          }
        }
      },
      capacity: {
        optional: true,
        isNumeric: {
          errorMessage: SCREEN_MESSAGES.CAPACITY_MUST_BE_A_NUMBER
        },
        toInt: true,
        custom: {
          options: (value, { req }) => {
            // Optional: Check if capacity matches seat layout count
            if (req.body.seat_layout) {
              const seatCount = req.body.seat_layout.reduce((total: any, row: string | any[]) => total + row.length, 0)
              if (value !== seatCount) {
                throw new Error('Capacity must match total number of seats in seat layout')
              }
            }
            return true
          }
        }
      },
      screen_type: {
        optional: true,
        isIn: {
          options: [Object.values(ScreenType)],
          errorMessage: SCREEN_MESSAGES.INVALID_SCREEN_TYPE
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(ScreenStatus)],
          errorMessage: SCREEN_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['params', 'body']
  )
)

export const screenIdValidator = validate(
  checkSchema(
    {
      screen_id: {
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
      }
    },
    ['params']
  )
)
