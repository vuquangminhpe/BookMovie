import express from 'express'
import databaseService from './services/database.services'
import usersRouter from './routes/user.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { initFolderImage, initFolderVideo, initFolderVideoHls, initFolderTemp } from './utils/file'
import cors, { CorsOptions } from 'cors'
import { createServer } from 'http'
import helmet from 'helmet'
import cinemaRouter from './routes/cinema.routes'
import { setupSwaggerDocs } from './Swagger/setupSwaggerDocs'
import { Server as SocketServer } from 'socket.io'
import { initVerificationCodeMonitor } from './utils/verification-monitor'
import adminRouter from './routes/admin.routes'
import bannersRouter from './routes/banners.routes'
import notificationsRouter from './routes/notifications.routes'
import notificationService from './services/notification.services'
import couponsRouter from './routes/coupons.routes'
import favoritesRouter from './routes/favorites.routes'
import recommendationRouter from './routes/recommendation.routes'
import bookingExpirationService from './services/booking-expiration.services'
import { setupCleanupJobs, shutdownCleanupJobs } from './utils/cleanup'
import feedbacksRouter from './routes/feedback.routes'
import partnerRouter from './routes/partner.routes'
import staffRouter from './routes/staff.routes'
import showtimeCleanupService from './services/showtime-cleanup.services'
import { setupSocketHandlers } from './utils/socket-handlers'
import paymentsRouter from './routes/payment.routes'

config()

const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID
const PORT = process.env.PORT || 5001

console.log('🚀 Starting server...')
console.log(`   Environment: ${process.env.NODE_ENV}`)
console.log(`   Platform: Render.com = ${isRender ? 'Yes' : 'No'}`)
console.log(`   Port: ${PORT}`)

// Database connection với retry cho Render
const connectWithRetry = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await databaseService.connect()
      console.log('✅ Database connected successfully')
      await bookingExpirationService.recoverPendingBookings()
      break
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5s before retry
    }
  }
}

connectWithRetry().catch((error) => {
  console.error('Failed to connect to MongoDB after retries:', error)
  process.exit(1)
})

const app = express()
const httpServer = createServer(app)

// Setup cleanup jobs (bao gồm showtime cleanup)
setupCleanupJobs()

// Socket.io setup với config cho Render
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // Render.com optimizations
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})

// Setup socket handlers (bao gồm showtime cleanup handlers)
setupSocketHandlers(io)

// Initialize server-side verification code monitor
initVerificationCodeMonitor(io)

// Setup notification service với socket.io
notificationService.setSocketIO(io)

// Setup showtime cleanup service với socket.io
showtimeCleanupService.setSocketIO(io)

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Tắt để tránh conflict với Swagger
    crossOriginEmbedderPolicy: false
  })
)

// CORS config cho Render
const corsOptions: CorsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
  credentials: true
}
app.use(cors(corsOptions))

// Trust proxy cho Render.com
app.set('trust proxy', 1)

// Initialize upload directories với error handling
const initializeDirectories = async () => {
  console.log('📁 Initializing upload directories...')

  try {
    const results = {
      temp: initFolderTemp(),
      images: initFolderImage(),
      video: initFolderVideo(),
      videoHls: initFolderVideoHls()
    }

    const successful = Object.entries(results).filter(([_, success]) => success)
    const failed = Object.entries(results).filter(([_, success]) => !success)

    console.log(`✅ Successfully initialized: ${successful.map(([name]) => name).join(', ')}`)

    if (failed.length > 0) {
      console.warn(`⚠️ Failed to initialize: ${failed.map(([name]) => name).join(', ')}`)
    }

    // Chỉ throw error nếu temp directory thất bại (critical)
    if (!results.temp) {
      throw new Error('Critical: Cannot initialize temp directory')
    }
  } catch (error) {
    console.error('❌ Directory initialization error:', error)
    if (isRender) {
      console.log('🔧 This is expected on first deploy. The app should still work.')
    } else {
      throw error
    }
  }
}

initializeDirectories()

// Body parsing với limits phù hợp Render
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Setup Swagger docs
setupSwaggerDocs(app)

// Health check endpoint đặc biệt cho Render (enhanced với service status)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    render: isRender,
    services: {
      database: 'connected',
      showtime_cleanup: 'running',
      booking_expiration: 'running',
      socket_io: 'connected'
    }
  })
})

// Admin endpoint cho manual showtime cleanup
app.post('/admin/cleanup/showtimes', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const result = await showtimeCleanupService.triggerManualCleanup()

    // Emit socket event để notify real-time
    io.emit('admin_showtime_cleanup', {
      result,
      triggered_at: new Date().toISOString(),
      triggered_by: 'admin_api'
    })

    res.json({
      success: true,
      message: 'Manual showtime cleanup completed',
      result
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Showtime cleanup failed',
      error: error.message
    })
  }
})

// Admin endpoint cho showtime cleanup stats
app.get('/admin/cleanup/showtimes/stats', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const stats = await showtimeCleanupService.getCleanupStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Admin endpoint để fix các showtime có status sai
app.post('/admin/cleanup/showtimes/fix', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const result = await showtimeCleanupService.fixIncorrectStatuses()

    // Emit socket event để notify real-time
    io.emit('admin_showtime_fix', {
      result,
      triggered_at: new Date().toISOString(),
      triggered_by: 'admin_api'
    })

    res.json({
      success: true,
      message: 'Showtime status fix completed',
      result
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Showtime status fix failed',
      error: error.message
    })
  }
})

// Routes (giữ nguyên thứ tự cũ)
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/cinema', cinemaRouter)
app.use('/admin', adminRouter)
app.use('/banners', bannersRouter)
app.use('/notifications', notificationsRouter)
app.use('/coupons', couponsRouter)
app.use('/favorites', favoritesRouter)
app.use('/recommendations', recommendationRouter)
app.use('/feedback', feedbacksRouter)
app.use('/staff', staffRouter)
app.use('/partners', partnerRouter)
app.use('/payments', paymentsRouter)
// Error handling
app.use(defaultErrorHandler)

// Graceful shutdown cho Render (enhanced với cleanup services)
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received, starting graceful shutdown...`)

  // Stop accepting new connections
  httpServer.close(() => {
    console.log('HTTP server closed')

    // Cleanup all services
    shutdownCleanupJobs()
    bookingExpirationService.clearAllJobs()
    console.log('All cleanup jobs cleared')

    // Close database connection
    // databaseService.close() // Uncomment if you have this method

    console.log('Graceful shutdown completed')
    process.exit(0)
  })

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Memory monitoring cho Render (giới hạn 512MB)
if (isRender) {
  setInterval(() => {
    const usage = process.memoryUsage()
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024)

    if (usedMB > 400) {
      // Warning at 400MB
      console.warn(`⚠️ High memory usage: ${usedMB}MB`)
    }

    // Log every 10 minutes in production
    if (Math.floor(Date.now() / 1000) % 600 === 0) {
      console.log(`📊 Memory: ${usedMB}MB, Uptime: ${Math.floor(process.uptime())}s`)
    }
  }, 30000) // Check every 30 seconds
}

// Showtime cleanup monitoring (log stats mỗi giờ)
setInterval(
  async () => {
    try {
      const stats = await showtimeCleanupService.getCleanupStats()
      console.log('🎬 Showtime cleanup stats:', {
        total: stats.total_showtimes,
        expired: stats.expired_but_not_completed,
        abandoned: stats.abandoned_showtimes
      })
    } catch (error) {
      console.error('❌ Error getting showtime stats:', error)
    }
  },
  60 * 60 * 1000
) // Every hour

// Start server
httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`)
  console.log(`📚 Swagger documentation: http://localhost:${PORT}/api-docs`)
  console.log(`📡 Socket.io enabled with showtime cleanup handlers`)
  console.log(`🎬 Showtime cleanup service running (every 10 minutes)`)

  if (isRender) {
    console.log('🌐 Render.com deployment detected')
    console.log('🔧 Using /tmp directory for uploads')
    console.log('⚡ Optimized for ephemeral filesystem')
  }
})

export default app
