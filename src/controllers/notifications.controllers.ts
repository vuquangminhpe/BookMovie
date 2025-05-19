import { Request, Response } from 'express'
import notificationService from '../services/notification.services'
import { TokenPayload } from '../models/request/User.request'

export const getNotificationsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20

  const result = await notificationService.getUserNotifications(user_id, page, limit)

  res.json({
    message: 'Get notifications success',
    result
  })
}

export const getUnreadCountController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const count = await notificationService.getUnreadCount(user_id)

  res.json({
    message: 'Get unread count success',
    result: { count }
  })
}

export const markAsReadController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { notification_id } = req.params

  const result = await notificationService.markAsRead(notification_id, user_id)

  res.json({
    message: 'Mark notification as read success',
    result
  })
}

export const markAllAsReadController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await notificationService.markAllAsRead(user_id)

  res.json({
    message: 'Mark all notifications as read success',
    result
  })
}

export const deleteNotificationController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { notification_id } = req.params

  const result = await notificationService.deleteNotification(notification_id, user_id)

  res.json({
    message: 'Delete notification success',
    result
  })
}

// Admin controllers
export const createSystemNotificationController = async (req: Request, res: Response) => {
  const { user_ids, title, content, link } = req.body

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      message: 'Invalid user IDs'
    })
  }

  if (!title || !content) {
    return res.status(400).json({
      message: 'Title and content are required'
    })
  }

  const result = await notificationService.createSystemNotification({
    user_ids,
    title,
    content,
    link
  })

  res.json({
    message: 'Create system notification success',
    result
  })
}
