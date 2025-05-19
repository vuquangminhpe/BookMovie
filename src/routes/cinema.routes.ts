import { Router } from 'express'
import moviesRouter from './movies.routes'
import theatersRouter from './theater.routes'
import screensRouter from './screens.routes'
import showtimesRouter from './showtime.routes'
import bookingsRouter from './booking.routes'
import paymentsRouter from './payment.routes'
import ratingsRouter from './ratings.routes'
import feedbacksRouter from './feedback.routes'

const cinemaRouter = Router()

cinemaRouter.use('/movies', moviesRouter)
cinemaRouter.use('/theaters', theatersRouter)
cinemaRouter.use('/screens', screensRouter)
cinemaRouter.use('/showtimes', showtimesRouter)
cinemaRouter.use('/bookings', bookingsRouter)
cinemaRouter.use('/payments', paymentsRouter)
cinemaRouter.use('/ratings', ratingsRouter)
cinemaRouter.use('/feedbacks', feedbacksRouter)
export default cinemaRouter
