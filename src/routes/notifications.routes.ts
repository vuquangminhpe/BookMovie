import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  deleteNotificationController,
  getNotificationsController,
  getUnreadCountController,
  markAllAsReadController,
  markAsReadController
} from '../controllers/notifications.controllers'
import { ObjectId } from 'mongodb'
import { validate } from '../utils/validation'
import { checkSchema } from 'express-validator'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

const notificationsRouter = Router()

// Apply auth middleware to all routes
notificationsRouter.use(AccessTokenValidator, verifiedUserValidator)

// Get all notifications
notificationsRouter.get('/', wrapAsync(getNotificationsController))

// Get unread count
notificationsRouter.get('/unread-count', wrapAsync(getUnreadCountController))

// Mark all as read
notificationsRouter.put('/mark-all-read', wrapAsync(markAllAsReadController))

// Mark as read
notificationsRouter.put(
  '/:notification_id/read',
  validate(
    checkSchema(
      {
        notification_id: {
          custom: {
            options: (value) => {
              if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus({
                  message: 'Invalid notification ID',
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
              return true
            }
          }
        }
      },
      ['params']
    )
  ),
  wrapAsync(markAsReadController)
)

// Delete notification
notificationsRouter.delete(
  '/:notification_id',
  validate(
    checkSchema(
      {
        notification_id: {
          custom: {
            options: (value) => {
              if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus({
                  message: 'Invalid notification ID',
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
              return true
            }
          }
        }
      },
      ['params']
    )
  ),
  wrapAsync(deleteNotificationController)
)

export default notificationsRouter
