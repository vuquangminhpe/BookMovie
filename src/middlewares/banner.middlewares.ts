import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { BANNER_MESSAGES } from '../constants/messages'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { BannerStatus, BannerTypes } from '../models/schemas/Banner.schema'

export const createBannerValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: {
          errorMessage: BANNER_MESSAGES.TITLE_IS_REQUIRED
        },
        isString: {
          errorMessage: BANNER_MESSAGES.TITLE_IS_REQUIRED
        },
        trim: true,
        custom: {
          options: async (value) => {
            // Check if banner with this title already exists
            const existingBanner = await databaseService.banners.findOne({ title: value })
            if (existingBanner) {
              throw new Error(BANNER_MESSAGES.BANNER_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      image_url: {
        notEmpty: {
          errorMessage: BANNER_MESSAGES.IMAGE_URL_IS_REQUIRED
        },
        isString: {
          errorMessage: BANNER_MESSAGES.IMAGE_URL_IS_REQUIRED
        },
        trim: true
      },
      link_url: {
        optional: true,
        isString: {
          errorMessage: 'Link URL must be a string'
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
      type: {
        notEmpty: {
          errorMessage: BANNER_MESSAGES.BANNER_TYPE_IS_REQUIRED
        },
        isIn: {
          options: [Object.values(BannerTypes)],
          errorMessage: BANNER_MESSAGES.INVALID_BANNER_TYPE
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(BannerStatus)],
          errorMessage: BANNER_MESSAGES.INVALID_BANNER_STATUS
        }
      },
      position: {
        optional: true,
        isInt: {
          options: { min: 0 },
          errorMessage: BANNER_MESSAGES.INVALID_POSITION
        },
        toInt: true
      },
      movie_id: {
        optional: true,
        custom: {
          options: async (value) => {
            if (!value) return true

            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid movie ID')
            }

            const movie = await databaseService.movies.findOne({ _id: new ObjectId(value) })
            if (!movie) {
              throw new Error('Movie not found')
            }

            return true
          }
        }
      },
      start_date: {
        optional: true,
        isISO8601: {
          errorMessage: 'Start date must be a valid ISO8601 date'
        }
      },
      end_date: {
        optional: true,
        isISO8601: {
          errorMessage: 'End date must be a valid ISO8601 date'
        },
        custom: {
          options: (value, { req }) => {
            if (!value || !req.body.start_date) return true

            const startDate = new Date(req.body.start_date)
            const endDate = new Date(value)

            if (endDate <= startDate) {
              throw new Error(BANNER_MESSAGES.INVALID_DATE_RANGE)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateBannerValidator = validate(
  checkSchema(
    {
      banner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: BANNER_MESSAGES.INVALID_BANNER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const banner = await databaseService.banners.findOne({ _id: new ObjectId(value) })
            if (!banner) {
              throw new ErrorWithStatus({
                message: BANNER_MESSAGES.BANNER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            return true
          }
        }
      },
      title: {
        optional: true,
        isString: {
          errorMessage: BANNER_MESSAGES.TITLE_IS_REQUIRED
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            // Check if banner with this title already exists (excluding current banner)
            const banner_id = req?.params?.banner_id
            const existingBanner = await databaseService.banners.findOne({
              title: value,
              _id: { $ne: new ObjectId(banner_id) }
            })

            if (existingBanner) {
              throw new Error(BANNER_MESSAGES.BANNER_ALREADY_EXISTS)
            }

            return true
          }
        }
      },
      image_url: {
        optional: true,
        isString: {
          errorMessage: BANNER_MESSAGES.IMAGE_URL_IS_REQUIRED
        },
        trim: true
      },
      link_url: {
        optional: true,
        isString: {
          errorMessage: 'Link URL must be a string'
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
      type: {
        optional: true,
        isIn: {
          options: [Object.values(BannerTypes)],
          errorMessage: BANNER_MESSAGES.INVALID_BANNER_TYPE
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(BannerStatus)],
          errorMessage: BANNER_MESSAGES.INVALID_BANNER_STATUS
        }
      },
      position: {
        optional: true,
        isInt: {
          options: { min: 0 },
          errorMessage: BANNER_MESSAGES.INVALID_POSITION
        },
        toInt: true
      },
      movie_id: {
        optional: true,
        custom: {
          options: async (value) => {
            if (!value) return true

            if (!ObjectId.isValid(value)) {
              throw new Error('Invalid movie ID')
            }

            const movie = await databaseService.movies.findOne({ _id: new ObjectId(value) })
            if (!movie) {
              throw new Error('Movie not found')
            }

            return true
          }
        }
      },
      start_date: {
        optional: true,
        isISO8601: {
          errorMessage: 'Start date must be a valid ISO8601 date'
        }
      },
      end_date: {
        optional: true,
        isISO8601: {
          errorMessage: 'End date must be a valid ISO8601 date'
        },
        custom: {
          options: (value, { req }) => {
            if (!value) return true

            const startDateFromRequest = req.body.start_date

            if (startDateFromRequest) {
              const startDate = new Date(startDateFromRequest)
              const endDate = new Date(value)

              if (endDate <= startDate) {
                throw new Error(BANNER_MESSAGES.INVALID_DATE_RANGE)
              }
            } else {
              // Need to check with existing start_date in the database
              // This will be validated in the service
            }

            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const bannerIdValidator = validate(
  checkSchema(
    {
      banner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: BANNER_MESSAGES.INVALID_BANNER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const banner = await databaseService.banners.findOne({ _id: new ObjectId(value) })
            if (!banner) {
              throw new ErrorWithStatus({
                message: BANNER_MESSAGES.BANNER_NOT_FOUND,
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
