import { Server as SocketServer, Socket } from 'socket.io'
import showtimeCleanupService from '../services/showtime-cleanup.services'
import couponSocketService from '../services/coupon-socket.services'
import paymentExpirationService from '../services/payment-expiration.services'
import { triggerManualCleanup, getCleanupStats } from './cleanup'

export const setupSocketHandlers = (io: SocketServer) => {
  console.log('📡 Setting up socket handlers...')

  // Set socket instance for services
  showtimeCleanupService.setSocketIO(io)
  couponSocketService.setSocketIO(io)
  paymentExpirationService.setSocketIO(io)

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

    // Handle coupon events
    setupCouponHandlers(socket)

    // Handle payment expiration events
    setupPaymentExpirationHandlers(socket)

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

// Coupon socket handlers
const setupCouponHandlers = (socket: Socket) => {
  // Check and assign coupons based on booking total
  socket.on('check_coupon_eligibility', async (data) => {
    try {
      const { user_id, booking_amount } = data

      if (!user_id || !booking_amount) {
        socket.emit('coupon_eligibility_result', {
          success: false,
          error: 'Missing user_id or booking_amount'
        })
        return
      }

      const assignedCoupons = await couponSocketService.checkAndAssignCoupons(user_id, booking_amount)

      socket.emit('coupon_eligibility_result', {
        success: true,
        assigned_coupons: assignedCoupons,
        message: assignedCoupons.length > 0 ? 'New coupons assigned!' : 'No new coupons available'
      })
    } catch (error: any) {
      console.error('❌ Socket coupon eligibility error:', error)
      socket.emit('coupon_eligibility_result', {
        success: false,
        error: error.message
      })
    }
  })

  // Get user's available coupons
  socket.on('get_user_coupons', async (data) => {
    try {
      const { user_id } = data

      if (!user_id) {
        socket.emit('user_coupons_result', {
          success: false,
          error: 'Missing user_id'
        })
        return
      }

      const userCoupons = await couponSocketService.getUserAvailableCoupons(user_id)

      socket.emit('user_coupons_result', {
        success: true,
        coupons: userCoupons,
        count: userCoupons.length
      })
    } catch (error: any) {
      console.error('❌ Socket get user coupons error:', error)
      socket.emit('user_coupons_result', {
        success: false,
        error: error.message
      })
    }
  })

  // Mark coupon as used
  socket.on('use_coupon', async (data) => {
    try {
      const { user_id, coupon_id, booking_id } = data

      if (!user_id || !coupon_id || !booking_id) {
        socket.emit('coupon_use_result', {
          success: false,
          error: 'Missing required data'
        })
        return
      }

      const success = await couponSocketService.markCouponAsUsed(user_id, coupon_id, booking_id)

      socket.emit('coupon_use_result', {
        success,
        message: success ? 'Coupon used successfully' : 'Failed to use coupon'
      })
    } catch (error: any) {
      console.error('❌ Socket use coupon error:', error)
      socket.emit('coupon_use_result', {
        success: false,
        error: error.message
      })
    }
  })

  // Get user's coupon usage statistics
  socket.on('get_coupon_stats', async (data) => {
    try {
      const { user_id } = data
      const stats = await couponSocketService.getCouponUsageStats(user_id)

      socket.emit('coupon_stats_result', {
        success: true,
        stats
      })
    } catch (error: any) {
      console.error('❌ Socket coupon stats error:', error)
      socket.emit('coupon_stats_result', {
        success: false,
        error: error.message
      })
    }
  })

  // Admin: Get all coupon usage statistics
  socket.on('get_all_coupon_stats', async () => {
    try {
      const stats = await couponSocketService.getCouponUsageStats()

      socket.emit('all_coupon_stats_result', {
        success: true,
        stats
      })
    } catch (error: any) {
      console.error('❌ Socket all coupon stats error:', error)
      socket.emit('all_coupon_stats_result', {
        success: false,
        error: error.message
      })
    }
  })
}

// Payment expiration socket handlers
const setupPaymentExpirationHandlers = (socket: Socket) => {
  // Get payment remaining time
  socket.on('get_payment_remaining_time', async (data) => {
    try {
      const { payment_id } = data

      if (!payment_id) {
        socket.emit('payment_remaining_time_result', {
          success: false,
          error: 'Missing payment_id'
        })
        return
      }

      const remainingTime = paymentExpirationService.getRemainingTime(payment_id)

      socket.emit('payment_remaining_time_result', {
        success: true,
        payment_id,
        remaining_time: remainingTime,
        expires_in_minutes: remainingTime ? Math.ceil(remainingTime / (60 * 1000)) : null
      })
    } catch (error: any) {
      console.error('❌ Socket get payment remaining time error:', error)
      socket.emit('payment_remaining_time_result', {
        success: false,
        error: error.message
      })
    }
  })

  // Get payment expiration stats (admin only)
  socket.on('get_payment_expiration_stats', async () => {
    try {
      const stats = paymentExpirationService.getPaymentExpirationStats()

      socket.emit('payment_expiration_stats_result', {
        success: true,
        stats
      })
    } catch (error: any) {
      console.error('❌ Socket payment expiration stats error:', error)
      socket.emit('payment_expiration_stats_result', {
        success: false,
        error: error.message
      })
    }
  })

  // Clear payment expiration job (admin only - for cancelled payments)
  socket.on('clear_payment_expiration', async (data) => {
    try {
      const { payment_id, admin_id } = data

      if (!payment_id) {
        socket.emit('clear_payment_expiration_result', {
          success: false,
          error: 'Missing payment_id'
        })
        return
      }

      const cleared = paymentExpirationService.clearPaymentExpirationJob(payment_id)

      socket.emit('clear_payment_expiration_result', {
        success: cleared,
        payment_id,
        message: cleared ? 'Payment expiration job cleared' : 'No active job found'
      })

      if (cleared) {
        // Notify admin room
        socket.broadcast.to('admin_room').emit('payment_expiration_cleared', {
          payment_id,
          cleared_by: admin_id || 'unknown',
          timestamp: new Date().toISOString()
        })
      }
    } catch (error: any) {
      console.error('❌ Socket clear payment expiration error:', error)
      socket.emit('clear_payment_expiration_result', {
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

    if (event === 'coupon_assignment') {
      // Emit coupon assignment to specific user
      if (data.user_id) {
        io.to(`user_${data.user_id}`).emit('coupon_assigned', data)
      }

      // Emit to admin room for monitoring
      io.to('admin_room').emit('coupon_assignment_notification', data)
    }

    if (event === 'coupon_usage') {
      // Emit coupon usage to specific user
      if (data.user_id) {
        io.to(`user_${data.user_id}`).emit('coupon_used_notification', data)
      }

      // Emit to admin room for monitoring
      io.to('admin_room').emit('coupon_usage_notification', data)
    }

    if (event === 'payment_expired') {
      // Emit payment expiration to specific user
      if (data.user_id) {
        io.to(`user_${data.user_id}`).emit('payment_expired', data)
      }

      // Emit to admin room for monitoring
      io.to('admin_room').emit('payment_expiration_notification', data)
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
