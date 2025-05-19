import { ObjectId } from 'mongodb'
import Notification, { NotificationTypes } from '../models/schemas/Notification.schema'
import databaseService from './database.services'
import { Server as SocketServer } from 'socket.io'

class NotificationService {
  private io: SocketServer | null = null
  private userSocketMap: Map<string, string[]> = new Map() // Map user_id to socket ids

  // Set socket.io instance
  setSocketIO(io: SocketServer) {
    this.io = io
    this.setupSocketListeners()
    return this
  }

  // Setup socket listeners
  private setupSocketListeners() {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      // Handle user authentication - client sends user_id after auth
      socket.on('authenticate', (user_id: string) => {
        if (!ObjectId.isValid(user_id)) {
          socket.emit('auth_error', 'Invalid user ID')
          return
        }

        // Add socket to user's sockets
        const userSockets = this.userSocketMap.get(user_id) || []
        userSockets.push(socket.id)
        this.userSocketMap.set(user_id, userSockets)

        socket.data.user_id = user_id
        console.log(`Socket ${socket.id} authenticated for user ${user_id}`)

        // Emit unread count to the user
        this.getUnreadCount(user_id).then((count) => {
          socket.emit('unread_count', count)
        })
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        const user_id = socket.data.user_id
        if (user_id) {
          // Remove this socket from user's sockets
          const userSockets = this.userSocketMap.get(user_id) || []
          const updatedSockets = userSockets.filter((id) => id !== socket.id)

          if (updatedSockets.length > 0) {
            this.userSocketMap.set(user_id, updatedSockets)
          } else {
            this.userSocketMap.delete(user_id)
          }
        }
        console.log(`Socket disconnected: ${socket.id}`)
      })

      // Handle mark notifications as read
      socket.on('mark_read', async (notification_id: string) => {
        const user_id = socket.data.user_id
        if (!user_id) {
          socket.emit('error', 'Not authenticated')
          return
        }

        try {
          await this.markAsRead(notification_id, user_id)
          const unreadCount = await this.getUnreadCount(user_id)
          socket.emit('unread_count', unreadCount)
        } catch (error) {
          socket.emit('error', 'Failed to mark notification as read')
        }
      })

      // Handle mark all notifications as read
      socket.on('mark_all_read', async () => {
        const user_id = socket.data.user_id
        if (!user_id) {
          socket.emit('error', 'Not authenticated')
          return
        }

        try {
          await this.markAllAsRead(user_id)
          socket.emit('unread_count', 0)
        } catch (error) {
          socket.emit('error', 'Failed to mark all notifications as read')
        }
      })
    })
  }

  // Create a notification
  async createNotification(data: {
    user_id: string
    title: string
    content: string
    type: NotificationTypes
    link?: string
    related_id?: string
  }) {
    const notification_id = new ObjectId()

    const notification = new Notification({
      _id: notification_id,
      user_id: new ObjectId(data.user_id),
      title: data.title,
      content: data.content,
      type: data.type,
      link: data.link,
      is_read: false,
      related_id: data.related_id ? new ObjectId(data.related_id) : undefined
    })

    await databaseService.notifications.insertOne(notification as any)

    // Send realtime notification if user is online
    this.sendRealTimeNotification(data.user_id, notification)

    return { notification_id: notification_id.toString() }
  }

  // Send realtime notification
  private sendRealTimeNotification(user_id: string, notification: Notification) {
    if (!this.io) return

    const userSockets = this.userSocketMap.get(user_id)
    if (!userSockets || userSockets.length === 0) return

    // Send to all user's connected sockets
    userSockets.forEach((socketId) => {
      this.io?.to(socketId).emit('new_notification', notification)
    })

    // Update unread count
    this.getUnreadCount(user_id).then((count) => {
      userSockets.forEach((socketId) => {
        this.io?.to(socketId).emit('unread_count', count)
      })
    })
  }

  // Get user notifications
  async getUserNotifications(user_id: string, page: number = 1, limit: number = 20) {
    if (!ObjectId.isValid(user_id)) {
      throw new Error('Invalid user ID')
    }

    const skip = (page - 1) * limit

    const notifications = await databaseService.notifications
      .find({ user_id: new ObjectId(user_id) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await databaseService.notifications.countDocuments({ user_id: new ObjectId(user_id) })

    return {
      notifications,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  }

  // Get unread notifications count
  async getUnreadCount(user_id: string) {
    if (!ObjectId.isValid(user_id)) {
      throw new Error('Invalid user ID')
    }

    const count = await databaseService.notifications.countDocuments({
      user_id: new ObjectId(user_id),
      is_read: false
    })

    return count
  }

  // Mark notification as read
  async markAsRead(notification_id: string, user_id: string) {
    if (!ObjectId.isValid(notification_id) || !ObjectId.isValid(user_id)) {
      throw new Error('Invalid ID')
    }

    const result = await databaseService.notifications.updateOne(
      {
        _id: new ObjectId(notification_id),
        user_id: new ObjectId(user_id)
      },
      {
        $set: { is_read: true },
        $currentDate: { updated_at: true }
      }
    )

    return { success: result.modifiedCount > 0 }
  }

  // Mark all notifications as read
  async markAllAsRead(user_id: string) {
    if (!ObjectId.isValid(user_id)) {
      throw new Error('Invalid user ID')
    }

    const result = await databaseService.notifications.updateMany(
      {
        user_id: new ObjectId(user_id),
        is_read: false
      },
      {
        $set: { is_read: true },
        $currentDate: { updated_at: true }
      }
    )

    return { success: true, modified_count: result.modifiedCount }
  }

  // Delete notification
  async deleteNotification(notification_id: string, user_id: string) {
    if (!ObjectId.isValid(notification_id) || !ObjectId.isValid(user_id)) {
      throw new Error('Invalid ID')
    }

    const result = await databaseService.notifications.deleteOne({
      _id: new ObjectId(notification_id),
      user_id: new ObjectId(user_id)
    })

    return { success: result.deletedCount > 0 }
  }

  // Create system notification for multiple users
  async createSystemNotification(data: { user_ids: string[]; title: string; content: string; link?: string }) {
    const validUserIds = data.user_ids.filter((id) => ObjectId.isValid(id))

    const notifications = validUserIds.map((user_id) => ({
      _id: new ObjectId(),
      user_id: new ObjectId(user_id),
      title: data.title,
      content: data.content,
      type: NotificationTypes.SYSTEM,
      link: data.link || '',
      is_read: false
    }))

    if (notifications.length > 0) {
      await databaseService.notifications.insertMany(notifications as any)
      notifications.forEach((notification) => {
        this.sendRealTimeNotification(notification.user_id.toString(), new Notification(notification))
      })
    }

    return { success: true, count: notifications.length }
  }
}

const notificationService = new NotificationService()
export default notificationService
