import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { THEATER_MESSAGES } from '../constants/messages'
import { TheaterStatus } from '../models/schemas/Theater.schema'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

export const createTheaterValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: THEATER_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: THEATER_MESSAGES.NAME_IS_REQUIRED
        },
        trim: true
      },
      location: {
        notEmpty: {
          errorMessage: THEATER_MESSAGES.LOCATION_IS_REQUIRED
        },
        isString: {
          errorMessage: THEATER_MESSAGES.LOCATION_IS_REQUIRED
        },
        trim: true
      },
      address: {
        notEmpty: {
          errorMessage: THEATER_MESSAGES.ADDRESS_IS_REQUIRED
        },
        isString: {
          errorMessage: THEATER_MESSAGES.ADDRESS_IS_REQUIRED
        },
        trim: true
      },
      city: {
        notEmpty: {
          errorMessage: THEATER_MESSAGES.CITY_IS_REQUIRED
        },
        isString: {
          errorMessage: THEATER_MESSAGES.CITY_IS_REQUIRED
        },
        trim: true
      },
      state: {
        notEmpty: {
          errorMessage: THEATER_MESSAGES.STATE_IS_REQUIRED
        },
        isString: {
          errorMessage: THEATER_MESSAGES.STATE_IS_REQUIRED
        },
        trim: true
      },
      pincode: {
        notEmpty: {
          errorMessage: THEATER_MESSAGES.PINCODE_IS_REQUIRED
        },
        isString: {
          errorMessage: THEATER_MESSAGES.PINCODE_IS_REQUIRED
        },
        trim: true
      },
      screens: {
        notEmpty: {
          errorMessage: THEATER_MESSAGES.SCREENS_IS_REQUIRED
        },
        isNumeric: {
          errorMessage: THEATER_MESSAGES.SCREENS_MUST_BE_A_NUMBER
        },
        toInt: true
      },
      amenities: {
        optional: true,
        isArray: {
          errorMessage: THEATER_MESSAGES.AMENITIES_MUST_BE_AN_ARRAY
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(TheaterStatus)],
          errorMessage: THEATER_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['body']
  )
)

export const updateTheaterValidator = validate(
  checkSchema(
    {
      theater_id: {
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
      name: {
        optional: true,
        isString: {
          errorMessage: THEATER_MESSAGES.NAME_IS_REQUIRED
        },
        trim: true
      },
      location: {
        optional: true,
        isString: {
          errorMessage: THEATER_MESSAGES.LOCATION_IS_REQUIRED
        },
        trim: true
      },
      address: {
        optional: true,
        isString: {
          errorMessage: THEATER_MESSAGES.ADDRESS_IS_REQUIRED
        },
        trim: true
      },
      city: {
        optional: true,
        isString: {
          errorMessage: THEATER_MESSAGES.CITY_IS_REQUIRED
        },
        trim: true
      },
      state: {
        optional: true,
        isString: {
          errorMessage: THEATER_MESSAGES.STATE_IS_REQUIRED
        },
        trim: true
      },
      pincode: {
        optional: true,
        isString: {
          errorMessage: THEATER_MESSAGES.PINCODE_IS_REQUIRED
        },
        trim: true
      },
      screens: {
        optional: true,
        isNumeric: {
          errorMessage: THEATER_MESSAGES.SCREENS_MUST_BE_A_NUMBER
        },
        toInt: true
      },
      amenities: {
        optional: true,
        isArray: {
          errorMessage: THEATER_MESSAGES.AMENITIES_MUST_BE_AN_ARRAY
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(TheaterStatus)],
          errorMessage: THEATER_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['params', 'body']
  )
)

export const theaterIdValidator = validate(
  checkSchema(
    {
      theater_id: {
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
      }
    },
    ['params']
  )
)
