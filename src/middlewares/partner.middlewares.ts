import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { ObjectId } from 'mongodb'
import { PartnerStatus } from '../models/schemas/Partner.schema'
import { MovieStatus } from '../models/schemas/Movie.shema'
import { PARTNER_MESSAGES } from '../constants/messages'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

export const createPartnerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: PARTNER_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: PARTNER_MESSAGES.NAME_IS_REQUIRED
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Name must be between 2-100 characters'
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: PARTNER_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: PARTNER_MESSAGES.INVALID_EMAIL_FORMAT
        },
        normalizeEmail: true,
        custom: {
          options: async (value) => {
            const existingPartner = await databaseService.partners.findOne({ email: value })
            if (existingPartner) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      },
      phone: {
        notEmpty: {
          errorMessage: PARTNER_MESSAGES.PHONE_IS_REQUIRED
        },
        matches: {
          options: /^[0-9]{10,11}$/,
          errorMessage: PARTNER_MESSAGES.INVALID_PHONE_FORMAT
        }
      },
      company_name: {
        notEmpty: {
          errorMessage: PARTNER_MESSAGES.COMPANY_NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: PARTNER_MESSAGES.COMPANY_NAME_IS_REQUIRED
        },
        isLength: {
          options: { min: 2, max: 200 },
          errorMessage: 'Company name must be between 2-200 characters'
        },
        trim: true
      },
      theater_id: {
        notEmpty: {
          errorMessage: PARTNER_MESSAGES.THEATER_ID_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid theater ID format',
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            // Check if theater exists
            const theater = await databaseService.theaters.findOne({ _id: new ObjectId(value) })
            if (!theater) {
              throw new ErrorWithStatus({
                message: 'Theater not found',
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Check if theater already has an active partner
            const existingPartner = await databaseService.partners.findOne({
              theater_id: new ObjectId(value),
              status: PartnerStatus.ACTIVE
            })
            if (existingPartner) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.THEATER_ALREADY_HAS_PARTNER,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            return true
          }
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(PartnerStatus)],
          errorMessage: PARTNER_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['body']
  )
)

export const updatePartnerValidator = validate(
  checkSchema(
    {
      partner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.INVALID_PARTNER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const partner = await databaseService.partners.findOne({ _id: new ObjectId(value) })
            if (!partner) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
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
          errorMessage: PARTNER_MESSAGES.NAME_IS_REQUIRED
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Name must be between 2-100 characters'
        },
        trim: true
      },
      email: {
        optional: true,
        isEmail: {
          errorMessage: PARTNER_MESSAGES.INVALID_EMAIL_FORMAT
        },
        normalizeEmail: true,
        custom: {
          options: async (value, { req }) => {
            const partner_id = req.params?.partner_id
            if (partner_id) {
              const existingPartner = await databaseService.partners.findOne({
                email: value,
                _id: { $ne: new ObjectId(partner_id) }
              })
              if (existingPartner) {
                throw new ErrorWithStatus({
                  message: PARTNER_MESSAGES.EMAIL_ALREADY_EXISTS,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
            }
            return true
          }
        }
      },
      phone: {
        optional: true,
        matches: {
          options: /^[0-9]{10,11}$/,
          errorMessage: PARTNER_MESSAGES.INVALID_PHONE_FORMAT
        }
      },
      company_name: {
        optional: true,
        isString: {
          errorMessage: PARTNER_MESSAGES.COMPANY_NAME_IS_REQUIRED
        },
        isLength: {
          options: { min: 2, max: 200 },
          errorMessage: 'Company name must be between 2-200 characters'
        },
        trim: true
      },
      theater_id: {
        optional: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid theater ID format',
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            // Check if theater exists
            const theater = await databaseService.theaters.findOne({ _id: new ObjectId(value) })
            if (!theater) {
              throw new ErrorWithStatus({
                message: 'Theater not found',
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            // Check if theater already has another active partner
            const partner_id = req.params?.partner_id
            if (partner_id) {
              const existingPartner = await databaseService.partners.findOne({
                theater_id: new ObjectId(value),
                status: PartnerStatus.ACTIVE,
                _id: { $ne: new ObjectId(partner_id) }
              })
              if (existingPartner) {
                throw new ErrorWithStatus({
                  message: PARTNER_MESSAGES.THEATER_ALREADY_HAS_PARTNER,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
            }

            return true
          }
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(PartnerStatus)],
          errorMessage: PARTNER_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['params', 'body']
  )
)

export const partnerIdValidator = validate(
  checkSchema(
    {
      partner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.INVALID_PARTNER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const partner = await databaseService.partners.findOne({ _id: new ObjectId(value) })
            if (!partner) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
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

// =============================================================================
// PARTNER MOVIE VALIDATION
// =============================================================================

export const createPartnerMovieValidator = validate(
  checkSchema(
    {
      partner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.INVALID_PARTNER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const partner = await databaseService.partners.findOne({
              _id: new ObjectId(value),
              status: PartnerStatus.ACTIVE
            })
            if (!partner) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      title: {
        notEmpty: {
          errorMessage: 'Title is required'
        },
        isString: {
          errorMessage: 'Title must be a string'
        },
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Title must be between 1-200 characters'
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
      duration: {
        notEmpty: {
          errorMessage: 'Duration is required'
        },
        isInt: {
          options: { min: 1, max: 500 },
          errorMessage: 'Duration must be between 1-500 minutes'
        },
        toInt: true
      },
      genre: {
        isArray: {
          options: { min: 1 },
          errorMessage: 'At least one genre is required'
        }
      },
      language: {
        notEmpty: {
          errorMessage: 'Language is required'
        },
        isString: {
          errorMessage: 'Language must be a string'
        },
        trim: true
      },
      release_date: {
        notEmpty: {
          errorMessage: 'Release date is required'
        },
        isISO8601: {
          errorMessage: 'Release date must be valid ISO8601 format'
        }
      },
      director: {
        notEmpty: {
          errorMessage: 'Director is required'
        },
        isString: {
          errorMessage: 'Director must be a string'
        },
        trim: true
      },
      cast: {
        optional: true,
        isArray: {
          errorMessage: 'Cast must be an array'
        }
      },
      poster_url: {
        notEmpty: {
          errorMessage: 'Poster URL is required'
        },
        isURL: {
          errorMessage: 'Poster URL must be valid URL'
        }
      },
      trailer_url: {
        optional: true,
        isURL: {
          errorMessage: 'Trailer URL must be valid URL'
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(MovieStatus)],
          errorMessage: 'Invalid movie status'
        }
      }
    },
    ['params', 'body']
  )
)

export const updatePartnerMovieValidator = validate(
  checkSchema(
    {
      partner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.INVALID_PARTNER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const partner = await databaseService.partners.findOne({
              _id: new ObjectId(value),
              status: PartnerStatus.ACTIVE
            })
            if (!partner) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      movie_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid movie ID',
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const partner_id = req.params?.partner_id
            if (partner_id) {
              const movie = await databaseService.movies.findOne({
                _id: new ObjectId(value),
                partner_id: new ObjectId(partner_id)
              })
              if (!movie) {
                throw new ErrorWithStatus({
                  message: PARTNER_MESSAGES.MOVIE_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
            }
            return true
          }
        }
      },
      title: {
        optional: true,
        isString: {
          errorMessage: 'Title must be a string'
        },
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Title must be between 1-200 characters'
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
      duration: {
        optional: true,
        isInt: {
          options: { min: 1, max: 500 },
          errorMessage: 'Duration must be between 1-500 minutes'
        },
        toInt: true
      },
      genre: {
        optional: true,
        isArray: {
          options: { min: 1 },
          errorMessage: 'At least one genre is required'
        }
      },
      language: {
        optional: true,
        isString: {
          errorMessage: 'Language must be a string'
        },
        trim: true
      },
      release_date: {
        optional: true,
        isISO8601: {
          errorMessage: 'Release date must be valid ISO8601 format'
        }
      },
      director: {
        optional: true,
        isString: {
          errorMessage: 'Director must be a string'
        },
        trim: true
      },
      cast: {
        optional: true,
        isArray: {
          errorMessage: 'Cast must be an array'
        }
      },
      poster_url: {
        optional: true,
        isURL: {
          errorMessage: 'Poster URL must be valid URL'
        }
      },
      trailer_url: {
        optional: true,
        isURL: {
          errorMessage: 'Trailer URL must be valid URL'
        }
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(MovieStatus)],
          errorMessage: 'Invalid movie status'
        }
      }
    },
    ['params', 'body']
  )
)

export const partnerMovieIdValidator = validate(
  checkSchema(
    {
      partner_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.INVALID_PARTNER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const partner = await databaseService.partners.findOne({ _id: new ObjectId(value) })
            if (!partner) {
              throw new ErrorWithStatus({
                message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      movie_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid movie ID',
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const partner_id = req.params?.partner_id
            if (partner_id) {
              const movie = await databaseService.movies.findOne({
                _id: new ObjectId(value),
                partner_id: new ObjectId(partner_id)
              })
              if (!movie) {
                throw new ErrorWithStatus({
                  message: PARTNER_MESSAGES.MOVIE_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
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
