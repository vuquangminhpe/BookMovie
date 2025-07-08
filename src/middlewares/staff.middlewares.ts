import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { TokenPayload } from '../models/request/User.request'
import { UserRole } from '../models/schemas/User.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { ContractStatus } from '~/models/schemas/Contact.schema'

// Middleware để check staff role
export const isStaffMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    if (!user || (user.role !== UserRole.Staff && user.role !== UserRole.Admin)) {
      throw new ErrorWithStatus({
        message: 'Access denied. Staff or Admin role required.',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware để check staff có hợp đồng hợp lệ
export const hasValidContractMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể bỏ qua check contract
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Check contract cho staff
    if (user && user.role === UserRole.Staff) {
      const contract = await databaseService.contracts.findOne({
        staff_id: new ObjectId(user_id),
        status: ContractStatus.ACTIVE,
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() }
      })

      if (!contract) {
        throw new ErrorWithStatus({
          message: 'Access denied. Valid contract required.',
          status: HTTP_STATUS.FORBIDDEN
        })
      }

      // Gắn contract info vào request để sử dụng trong controller
      ;(req as any).contract = contract
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware để check staff chỉ có thể truy cập theater của mình
export const ownTheaterOnlyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    const { theater_id } = req.params

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể truy cập tất cả
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Staff chỉ có thể truy cập theater của mình
    if (user && user.role === UserRole.Staff) {
      const theater = await databaseService.theaters.findOne({ _id: new ObjectId(theater_id) })

      if (!theater) {
        throw new ErrorWithStatus({
          message: 'Theater not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      // Check xem staff có là manager của theater này không
      if (theater.manager_id && theater.manager_id.toString() !== user_id) {
        throw new ErrorWithStatus({
          message: 'Access denied. You can only manage your own theater.',
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware để check staff chỉ có thể tạo 1 theater
export const canCreateTheaterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload

    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    // Admin có thể tạo nhiều theater
    if (user && user.role === UserRole.Admin) {
      return next()
    }

    // Staff chỉ có thể tạo 1 theater
    if (user && user.role === UserRole.Staff) {
      const existingTheater = await databaseService.theaters.findOne({
        manager_id: new ObjectId(user_id)
      })

      if (existingTheater) {
        throw new ErrorWithStatus({
          message: 'You can only manage one theater. Existing theater found.',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}
