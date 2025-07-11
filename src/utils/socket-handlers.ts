import { Server as SocketServer, Socket } from 'socket.io'
import showtimeCleanupService from '../services/showtime-cleanup.services'
import { triggerManualCleanup, getCleanupStats } from './cleanup'

export const setupSocketHandlers = (io: SocketServer) => {
  console.log('📡 Setting up socket handlers...')

  // Set socket instance for showtime cleanup service
  showtimeCleanupService.setSocketIO(io)

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    // Join specific rooms for different types of users
    socket.on('join_room', (data) => {
      const { room, user_role } = data
      socket.join(room)
      console.log(`👤 User (${user_role}) joined room: ${room}`)
    })

    // Handle showtime cleanup events
    setupShowtimeCleanupHandlers(socket)

    // Handle admin cleanup events
    setupAdminCleanupHandlers(socket)

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`)
    })
  })

  // Broadcast system-wide events
  setupSystemBroadcasts(io)
}

// Showtime cleanup socket handlers
const setupShowtimeCleanupHandlers = (socket: Socket) => {
  // Manual showtime cleanup trigger (staff/admin only)
  socket.on('trigger_showtime_cleanup', async (data) => {
    try {
      console.log(`🔧 Manual showtime cleanup triggered by ${socket.id}`)

      const result = await showtimeCleanupService.triggerManualCleanup()

      // Emit to all connected clients
      socket.broadcast.emit('showtime_cleanup_completed', {
        ...result,
        triggered_by: data.user_id || 'unknown',
        timestamp: new Date().toISOString()
      })

      // Confirm to requester
      socket.emit('showtime_cleanup_result', {
        success: true,
        result,
        message: 'Showtime cleanup completed successfully'
      })
    } catch (error: any) {
      console.error('❌ Socket showtime cleanup error:', error)
      socket.emit('showtime_cleanup_result', {
        success: false,
        error: error.message,
        message: 'Showtime cleanup failed'
      })
    }
  })

  // Get showtime cleanup stats
  socket.on('get_showtime_stats', async () => {
    try {
      const stats = await showtimeCleanupService.getCleanupStats()
      socket.emit('showtime_stats', {
        success: true,
        data: stats
      })
    } catch (error: any) {
      socket.emit('showtime_stats', {
        success: false,
        error: error.message
      })
    }
  })

  // Check specific showtime status
  socket.on('check_showtime', async (data) => {
    try {
      const { showtime_id } = data
      const result = await showtimeCleanupService.checkAndUpdateShowtime(showtime_id)

      socket.emit('showtime_check_result', {
        success: true,
        showtime_id,
        result
      })
    } catch (error: any) {
      socket.emit('showtime_check_result', {
        success: false,
        showtime_id: data.showtime_id,
        error: error.message
      })
    }
  })
}

// Admin cleanup handlers
const setupAdminCleanupHandlers = (socket: Socket) => {
  // Full system cleanup (admin only)
  socket.on('trigger_full_cleanup', async (data) => {
    try {
      console.log(`🔧 Full system cleanup triggered by admin ${socket.id}`)

      const result = await triggerManualCleanup()

      // Broadcast to all connected clients
      socket.broadcast.emit('system_cleanup_completed', {
        ...result,
        triggered_by: data.admin_id || 'unknown',
        timestamp: new Date().toISOString()
      })

      socket.emit('full_cleanup_result', {
        success: true,
        result,
        message: 'Full system cleanup completed'
      })
    } catch (error: any) {
      console.error('❌ Socket full cleanup error:', error)
      socket.emit('full_cleanup_result', {
        success: false,
        error: error.message
      })
    }
  })

  // Get all cleanup stats
  socket.on('get_cleanup_stats', async () => {
    try {
      const stats = await getCleanupStats()
      socket.emit('cleanup_stats', {
        success: true,
        data: stats
      })
    } catch (error: any) {
      socket.emit('cleanup_stats', {
        success: false,
        error: error.message
      })
    }
  })
}

// System-wide broadcasts
const setupSystemBroadcasts = (io: SocketServer) => {
  // Broadcast showtime status changes to specific theater rooms
  const originalEmit = io.emit.bind(io)

  // Override emit to add custom logic for showtime events
  io.emit = function (event: string, data: any) {
    if (event === 'showtime_updated' && data.showtime_id) {
      // Emit to theater-specific room
      io.to(`theater_${data.theater_id}`).emit('showtime_updated', data)

      // Emit to staff room for the specific staff
      if (data.staff_id) {
        io.to(`staff_${data.staff_id}`).emit('my_showtime_updated', data)
      }
    }

    if (event === 'showtime_cleanup') {
      // Emit to admin room
      io.to('admin_room').emit('showtime_cleanup_notification', data)

      // Emit to all staff
      io.to('staff_room').emit('showtime_cleanup_notification', data)
    }

    // Call original emit
    return originalEmit(event, data)
  }
}

// Helper functions for room management
export const joinUserToRooms = (socket: Socket, user: any) => {
  const { _id, role } = user

  // Join role-based room
  socket.join(`${role}_room`)

  // Join user-specific room
  socket.join(`user_${_id}`)

  // Join additional rooms based on role
  if (role === 'staff') {
    socket.join('staff_room')
    // If staff has theater, join theater room
    // This would need theater info from user data
  } else if (role === 'admin') {
    socket.join('admin_room')
  }

  console.log(`👤 User ${_id} (${role}) joined appropriate rooms`)
}

export const emitToUserRole = (io: SocketServer, role: string, event: string, data: any) => {
  io.to(`${role}_room`).emit(event, data)
}

export const emitToSpecificUser = (io: SocketServer, userId: string, event: string, data: any) => {
  io.to(`user_${userId}`).emit(event, data)
}

export const emitToTheater = (io: SocketServer, theaterId: string, event: string, data: any) => {
  io.to(`theater_${theaterId}`).emit(event, data)
}
