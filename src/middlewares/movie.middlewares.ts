import { checkSchema } from 'express-validator'
import { validate } from '../utils/validation'
import { MOVIE_MESSAGES } from '../constants/messages'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { MovieStatus } from '../models/schemas/Movie.shema'

export const createMovieValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.TITLE_IS_REQUIRED
        },
        isString: {
          errorMessage: MOVIE_MESSAGES.TITLE_IS_REQUIRED
        },
        trim: true
      },
      description: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.DESCRIPTION_IS_REQUIRED
        },
        isString: {
          errorMessage: MOVIE_MESSAGES.DESCRIPTION_IS_REQUIRED
        },
        trim: true
      },
      duration: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.DURATION_IS_REQUIRED
        },
        isNumeric: {
          errorMessage: MOVIE_MESSAGES.DURATION_MUST_BE_A_NUMBER
        },
        toInt: true
      },
      genre: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.GENRE_IS_REQUIRED
        },
        isArray: {
          errorMessage: MOVIE_MESSAGES.GENRE_MUST_BE_AN_ARRAY
        }
      },
      language: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.LANGUAGE_IS_REQUIRED
        },
        isString: {
          errorMessage: MOVIE_MESSAGES.LANGUAGE_IS_REQUIRED
        },
        trim: true
      },
      release_date: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.RELEASE_DATE_IS_REQUIRED
        },
        isISO8601: {
          errorMessage: MOVIE_MESSAGES.RELEASE_DATE_MUST_BE_ISO8601
        }
      },
      director: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.DIRECTOR_IS_REQUIRED
        },
        isString: {
          errorMessage: MOVIE_MESSAGES.DIRECTOR_IS_REQUIRED
        },
        trim: true
      },
      cast: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.CAST_IS_REQUIRED
        },
        isArray: {
          errorMessage: MOVIE_MESSAGES.CAST_MUST_BE_AN_ARRAY
        }
      },
      poster_url: {
        notEmpty: {
          errorMessage: MOVIE_MESSAGES.POSTER_URL_IS_REQUIRED
        },
        isString: {
          errorMessage: MOVIE_MESSAGES.POSTER_URL_IS_REQUIRED
        },
        trim: true
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(MovieStatus)],
          errorMessage: MOVIE_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['body']
  )
)

export const updateMovieValidator = validate(
  checkSchema(
    {
      movie_id: {
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
        optional: true,
        isString: {
          errorMessage: MOVIE_MESSAGES.TITLE_IS_REQUIRED
        },
        trim: true
      },
      description: {
        optional: true,
        isString: {
          errorMessage: MOVIE_MESSAGES.DESCRIPTION_IS_REQUIRED
        },
        trim: true
      },
      duration: {
        optional: true,
        isNumeric: {
          errorMessage: MOVIE_MESSAGES.DURATION_MUST_BE_A_NUMBER
        },
        toInt: true
      },
      genre: {
        optional: true,
        isArray: {
          errorMessage: MOVIE_MESSAGES.GENRE_MUST_BE_AN_ARRAY
        }
      },
      language: {
        optional: true,
        isString: {
          errorMessage: MOVIE_MESSAGES.LANGUAGE_IS_REQUIRED
        },
        trim: true
      },
      release_date: {
        optional: true,
        isISO8601: {
          errorMessage: MOVIE_MESSAGES.RELEASE_DATE_MUST_BE_ISO8601
        }
      },
      director: {
        optional: true,
        isString: {
          errorMessage: MOVIE_MESSAGES.DIRECTOR_IS_REQUIRED
        },
        trim: true
      },
      cast: {
        optional: true,
        isArray: {
          errorMessage: MOVIE_MESSAGES.CAST_MUST_BE_AN_ARRAY
        }
      },
      poster_url: {
        optional: true,
        isString: {
          errorMessage: MOVIE_MESSAGES.POSTER_URL_IS_REQUIRED
        },
        trim: true
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(MovieStatus)],
          errorMessage: MOVIE_MESSAGES.INVALID_STATUS
        }
      }
    },
    ['params', 'body']
  )
)

export const movieIdValidator = validate(
  checkSchema(
    {
      movie_id: {
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
      }
    },
    ['params']
  )
)
