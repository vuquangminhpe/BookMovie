import { NextFunction, Request, Response } from 'express'
import omit from 'lodash/omit'
import HTTP_STATUS from '../constants/httpStatus'
import { ErrorWithStatus } from '../models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErrorWithStatus) {
      res.status(err.status).json(omit(err, ['status']))
    }
    const finalError: any = {}

    Object.getOwnPropertyNames(err).forEach((key) => {
      if (
        !Object.getOwnPropertyDescriptor(err, key)?.configurable ||
        !Object.getOwnPropertyDescriptor(err, key)?.writable
      ) {
        return
      }
      finalError[key] = err[key]
    })
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: err.message,
      errorInfo: omit(finalError, ['stack'])
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      errorInfo: omit(error as any, ['stack'])
    })
  }
}
