import { NextFunction, Request, Response } from 'express'
import { UserRole } from '../models/schemas/User.schema'
import { TokenPayload } from '../models/request/User.request'
import databaseService from '../services/database.services'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

export const isAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload

    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })

    if (!user || user.role !== UserRole.Admin) {
      return next(
        new ErrorWithStatus({
          message: 'You do not have permission to access this resource',
          status: HTTP_STATUS.FORBIDDEN
        })
      )
    }
    req.user = user
    next()
  } catch (error) {
    next(
      new ErrorWithStatus({
        message: 'Failed to verify admin status',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    )
  }
}
