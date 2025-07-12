import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import databaseService from '../../services/database.services'
import { TokenPayload } from '../../models/request/User.request'
import { UserRole } from '../../models/schemas/User.schema'
import { ErrorWithStatus } from '../../models/Errors'
import HTTP_STATUS from '../../constants/httpStatus'
import { checkSchema } from 'express-validator'
import { validate } from '../../utils/validation'
import { ScreenStatus, ScreenType } from '../../constants/enums'
import { SCREEN_MESSAGES } from '../../constants/messages'
import { BookingStatus } from '~/models/schemas/Booking.schema'

// Middleware để validate ownership của screen thông qua theater
export const validateStaffScreenOwnershipMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    const { screen_id } = req.params

    if (!screen_id || !ObjectId.isValid(screen_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid screen ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể truy cập tất cả screens
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Staff chỉ có thể truy cập screens của theater mình quản lý
    if (user && user.role === UserRole.Staff) {
      const screen = await databaseService.screens.findOne({ _id: new ObjectId(screen_id) })

      if (!screen) {
        throw new ErrorWithStatus({
          message: 'Screen not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // Check if staff owns the theater that contains this screen
      const theater = await databaseService.theaters.findOne({
        _id: screen.theater_id,
        manager_id: new ObjectId(user_id)
      })

      if (!theater) {
        throw new ErrorWithStatus({
          message: 'You do not have permission to access this screen',
          status: HTTP_STATUS.FORBIDDEN
        })
      }

      // Attach screen and theater info to request for use in controller
      ;(req as any).screen = screen
      ;(req as any).theater = theater
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware để validate theater ownership khi tạo screen
export const validateStaffTheaterForScreenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    const { theater_id } = req.params

    if (!theater_id || !ObjectId.isValid(theater_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid theater ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể tạo screen cho bất kỳ theater nào
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Staff chỉ có thể tạo screen cho theater của mình
    if (user && user.role === UserRole.Staff) {
      const theater = await databaseService.theaters.findOne({
        _id: new ObjectId(theater_id),
        manager_id: new ObjectId(user_id)
      })

      if (!theater) {
        throw new ErrorWithStatus({
          message: 'Theater not found or you do not have permission to manage this theater',
          status: HTTP_STATUS.FORBIDDEN
        })
      }

      // Attach theater info to request
      ;(req as any).theater = theater
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Validator cho create screen request
export const createStaffScreenValidator = validate(
  checkSchema(
    {
      theater_id: {
        notEmpty: {
          errorMessage: SCREEN_MESSAGES.THEATER_ID_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid theater ID',
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            // Additional validation will be done in middleware
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
        trim: true,
        isLength: {
          options: { min: 1, max: 50 },
          errorMessage: 'Screen name must be between 1 and 50 characters'
        }
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
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error(SCREEN_MESSAGES.SEAT_LAYOUT_MUST_BE_AN_ARRAY)
            }

            // Validate seat layout structure
            for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
              const row = value[rowIndex]

              if (!Array.isArray(row)) {
                throw new Error(`Row ${rowIndex + 1} in seat layout must be an array`)
              }

              for (let seatIndex = 0; seatIndex < row.length; seatIndex++) {
                const seat = row[seatIndex]

                if (!seat || typeof seat !== 'object') {
                  throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must be an object`)
                }

                // Validate required seat properties
                if (!seat.row || typeof seat.row !== 'string') {
                  throw new Error(
                    `Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'row' string`
                  )
                }

                if (seat.number === undefined || typeof seat.number !== 'number') {
                  throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'number'`)
                }

                if (!seat.type || !['regular', 'premium', 'recliner', 'couple'].includes(seat.type)) {
                  throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'type'`)
                }

                if (!seat.status || !['active', 'inactive', 'maintenance'].includes(seat.status)) {
                  throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'status'`)
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
            if (value <= 0) {
              throw new Error('Capacity must be greater than 0')
            }

            if (value > 1000) {
              throw new Error('Capacity cannot exceed 1000 seats')
            }

            // Validate capacity matches seat layout if provided
            if (req.body.seat_layout) {
              const seatCount = req.body.seat_layout.reduce((total: number, row: any[]) => total + row.length, 0)

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

// Validator cho update screen request
export const updateStaffScreenValidator = validate(
  checkSchema(
    {
      screen_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: 'Invalid screen ID',
                status: HTTP_STATUS.BAD_REQUEST
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
        trim: true,
        isLength: {
          options: { min: 1, max: 50 },
          errorMessage: 'Screen name must be between 1 and 50 characters'
        }
      },
      seat_layout: {
        optional: true,
        isArray: {
          errorMessage: SCREEN_MESSAGES.SEAT_LAYOUT_MUST_BE_AN_ARRAY
        },
        custom: {
          options: (value) => {
            if (value && (!Array.isArray(value) || value.length === 0)) {
              throw new Error(SCREEN_MESSAGES.SEAT_LAYOUT_MUST_BE_AN_ARRAY)
            }

            if (value) {
              // Same validation as create
              for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
                const row = value[rowIndex]

                if (!Array.isArray(row)) {
                  throw new Error(`Row ${rowIndex + 1} in seat layout must be an array`)
                }

                for (let seatIndex = 0; seatIndex < row.length; seatIndex++) {
                  const seat = row[seatIndex]

                  if (!seat || typeof seat !== 'object') {
                    throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must be an object`)
                  }

                  if (!seat.row || typeof seat.row !== 'string') {
                    throw new Error(
                      `Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'row' string`
                    )
                  }

                  if (seat.number === undefined || typeof seat.number !== 'number') {
                    throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'number'`)
                  }

                  if (!seat.type || !['regular', 'premium', 'recliner', 'couple'].includes(seat.type)) {
                    throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'type'`)
                  }

                  if (!seat.status || !['active', 'inactive', 'maintenance'].includes(seat.status)) {
                    throw new Error(`Seat at row ${rowIndex + 1}, position ${seatIndex + 1} must have a valid 'status'`)
                  }
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
            if (value !== undefined) {
              if (value <= 0) {
                throw new Error('Capacity must be greater than 0')
              }

              if (value > 1000) {
                throw new Error('Capacity cannot exceed 1000 seats')
              }

              // Validate capacity matches seat layout if both are provided
              if (req.body.seat_layout) {
                const seatCount = req.body.seat_layout.reduce((total: number, row: any[]) => total + row.length, 0)

                if (value !== seatCount) {
                  throw new Error('Capacity must match total number of seats in seat layout')
                }
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

// Middleware để check xem screen có thể được xóa không
export const canDeleteScreenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { screen_id } = req.params

    // Check if screen has any future showtimes
    const futureShowtime = await databaseService.showtimes.findOne({
      screen_id: new ObjectId(screen_id),
      start_time: { $gte: new Date() },
      status: { $ne: BookingStatus.CANCELLED as any }
    })

    if (futureShowtime) {
      // Attach warning to request
      ;(req as any).deleteWarning = 'Screen has future showtimes and will be marked as inactive instead of deleted'
    }

    // Check if screen has any bookings
    const hasBookings = await databaseService.bookings.findOne({
      screen_id: new ObjectId(screen_id)
    })

    if (hasBookings && !futureShowtime) {
      ;(req as any).deleteWarning = 'Screen has booking history and will be marked as inactive instead of deleted'
    }

    next()
  } catch (error) {
    next(error)
  }
}
