import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import databaseService from '../../services/database.services'
import { TokenPayload } from '../../models/request/User.request'
import { UserRole } from '../../models/schemas/User.schema'
import { ErrorWithStatus } from '../../models/Errors'
import HTTP_STATUS from '../../constants/httpStatus'

// Middleware để validate showtime creation - đảm bảo movie thuộc về staff
export const validateStaffMovieForShowtimeMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    const { movie_id } = req.body

    if (!movie_id) {
      throw new ErrorWithStatus({
        message: 'Movie ID is required',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể tạo showtime cho bất kỳ movie nào
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Staff chỉ có thể tạo showtime cho movies mà họ tạo
    if (user && user.role === UserRole.Staff) {
      const movie = await databaseService.movies.findOne({
        _id: new ObjectId(movie_id),
        created_by: new ObjectId(user_id)
      })

      if (!movie) {
        throw new ErrorWithStatus({
          message: 'Movie not found or you do not have permission to create showtime for this movie',
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware để validate showtime update - đảm bảo movie thuộc về staff
export const validateStaffMovieForShowtimeUpdateMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    const { showtime_id } = req.params

    if (!showtime_id) {
      throw new ErrorWithStatus({
        message: 'Showtime ID is required',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể update bất kỳ showtime nào
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Staff chỉ có thể update showtime của movies mà họ tạo
    if (user && user.role === UserRole.Staff) {
      const showtime = await databaseService.showtimes.findOne({
        _id: new ObjectId(showtime_id)
      })

      if (!showtime) {
        throw new ErrorWithStatus({
          message: 'Showtime not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      const movie = await databaseService.movies.findOne({
        _id: showtime.movie_id,
        created_by: new ObjectId(user_id)
      })

      if (!movie) {
        throw new ErrorWithStatus({
          message: 'You do not have permission to update this showtime',
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware để filter showtimes - chỉ hiển thị showtimes của movies mà staff tạo
export const filterStaffShowtimesMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể xem tất cả showtimes
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Staff chỉ xem showtimes của movies mà họ tạo
    if (user && user.role === UserRole.Staff) {
      // Get list of movies created by this staff
      const staffMovies = await databaseService.movies
        .find({ created_by: new ObjectId(user_id) }, { projection: { _id: 1 } })
        .toArray()

      const movieIds = staffMovies.map((movie) => movie._id)

      // Add movie filter to query
      if (!req.query.movie_ids) {
        req.query.movie_ids = movieIds.map((id) => id.toString()).join(',')
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}
