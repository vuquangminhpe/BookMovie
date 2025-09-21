import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

export const createBannerSliderHomeValidator = validate(
  checkSchema(
    {
      image: {
        notEmpty: {
          errorMessage: 'Image is required'
        },
        isString: {
          errorMessage: 'Image must be a string'
        },
        trim: true
      },
      author: {
        notEmpty: {
          errorMessage: 'Author is required'
        },
        isString: {
          errorMessage: 'Author must be a string'
        },
        trim: true
      },
      title: {
        notEmpty: {
          errorMessage: 'Title is required'
        },
        isString: {
          errorMessage: 'Title must be a string'
        },
        trim: true
      },
      topic: {
        optional: true,
        isString: {
          errorMessage: 'Topic must be a string'
        },
        trim: true
      },
      description: {
        notEmpty: {
          errorMessage: 'Description is required'
        },
        isString: {
          errorMessage: 'Description must be a string'
        },
        trim: true
      },
      active: {
        optional: true,
        isBoolean: {
          errorMessage: 'Active must be a boolean'
        },
        toBoolean: true
      },
      time_active: {
        optional: true,
        isISO8601: {
          errorMessage: 'Time active must be a valid ISO8601 date'
        },
        custom: {
          options: (value) => {
            if (value) {
              const timeActive = new Date(value)
              const now = new Date()
              if (timeActive <= now) {
                throw new Error('Time active must be in the future')
              }
            }
            return true
          }
        }
      },
      auto_active: {
        optional: true,
        isBoolean: {
          errorMessage: 'Auto active must be a boolean'
        },
        toBoolean: true
      }
    },
    ['body']
  )
)

export const updateBannerSliderHomeValidator = validate(
  checkSchema(
    {
      banner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid banner ID',
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const banner = await databaseService.banners_slider_home.findOne({ _id: new ObjectId(value) })
            if (!banner) {
              throw new ErrorWithStatus({
                message: 'Banner slider home not found',
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            return true
          }
        }
      },
      image: {
        optional: true,
        isString: {
          errorMessage: 'Image must be a string'
        },
        trim: true
      },
      author: {
        optional: true,
        isString: {
          errorMessage: 'Author must be a string'
        },
        trim: true
      },
      title: {
        optional: true,
        isString: {
          errorMessage: 'Title must be a string'
        },
        trim: true
      },
      topic: {
        optional: true,
        isString: {
          errorMessage: 'Topic must be a string'
        },
        trim: true
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Description must be a string'
        },
        trim: true
      },
      active: {
        optional: true,
        isBoolean: {
          errorMessage: 'Active must be a boolean'
        },
        toBoolean: true
      },
      time_active: {
        optional: true,
        custom: {
          options: (value) => {
            if (value === null || value === '') {
              return true // Allow clearing time_active
            }

            // Check if it's a valid ISO8601 date
            const date = new Date(value)
            if (isNaN(date.getTime())) {
              throw new Error('Time active must be a valid ISO8601 date')
            }

            return true
          }
        }
      },
      auto_active: {
        optional: true,
        isBoolean: {
          errorMessage: 'Auto active must be a boolean'
        },
        toBoolean: true
      }
    },
    ['params', 'body']
  )
)

export const bannerSliderHomeIdValidator = validate(
  checkSchema(
    {
      banner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid banner ID',
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const banner = await databaseService.banners_slider_home.findOne({ _id: new ObjectId(value) })
            if (!banner) {
              throw new ErrorWithStatus({
                message: 'Banner slider home not found',
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