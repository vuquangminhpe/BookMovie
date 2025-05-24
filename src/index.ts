import express from 'express'
import databaseService from './services/database.services'
import usersRouter from './routes/user.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { initFolderImage, initFolderVideo, initFolderVideoHls } from './utils/file'
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
import { setupCleanupJobs } from './utils/cleanup'

config()
databaseService
  .connect()
  .then(async () => {
    await bookingExpirationService.recoverPendingBookings()
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error)
  })

const app = express()
const httpServer = createServer(app)
const port = 5001
setupCleanupJobs()
// Set up Socket.io for server-side monitoring only
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Initialize server-side verification code monitor
initVerificationCodeMonitor(io)

app.use(helmet())
const corsOptions: CorsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

try {
  initFolderImage()
  initFolderVideo()
  initFolderVideoHls()
} catch (error) {
  // console.error('Error initializing directories:', error)
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
setupSwaggerDocs(app)
notificationService.setSocketIO(io)
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
app.use(defaultErrorHandler)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, clearing booking expiration jobs...')
  bookingExpirationService.clearAllJobs()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, clearing booking expiration jobs...')
  bookingExpirationService.clearAllJobs()
  process.exit(0)
})
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`)
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`)
})

export default app
