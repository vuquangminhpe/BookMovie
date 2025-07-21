import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ADMIN_MESSAGES, BANNER_MESSAGES, PAYMENT_MESSAGES } from '../constants/messages'
import {
  GetUsersReqQuery,
  UserIdReqParams,
  UpdateUserRoleReqBody,
  GetDashboardStatsReqQuery,
  FeatureMovieReqBody,
  ModerateFeedbackReqBody,
  ModerateRatingReqBody,
  UpdateUserReqBody
} from '../models/request/Admin.request'
import adminService from '../services/admin.services'
import { TokenPayload } from '../models/request/User.request'
import { FeedbackStatus } from '../models/schemas/Feedback.schema'
import { MovieIdReqParams } from '../models/request/Movie.request'
import feedbackService from '../services/feedback.services'
import { FeedbackIdReqParams } from '../models/request/Feedback.request'
import ratingService from '../services/rating.services'
import { RatingIdReqParams } from '../models/request/Rating.request'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import bannerService from '~/services/banner.services'
import {
  BannerIdReqParams,
  CreateBannerReqBody,
  GetBannersReqQuery,
  UpdateBannerReqBody
} from '~/models/request/Banner.request'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { BookingStatus, PaymentStatus } from '~/models/schemas/Booking.schema'

// User Management
export const getUsersController = async (req: Request<ParamsDictionary, any, any, GetUsersReqQuery>, res: Response) => {
  const result = await adminService.getUsers(req.query)
  res.json({
    message: ADMIN_MESSAGES.GET_USERS_SUCCESS,
    result
  })
}

export const getUserByIdController = async (req: Request<UserIdReqParams>, res: Response) => {
  const { user_id } = req.params
  const result = await adminService.getUserById(user_id)
  res.json({
    message: ADMIN_MESSAGES.GET_USERS_SUCCESS,
    result
  })
}

export const updateUserRoleController = async (
  req: Request<UserIdReqParams, any, UpdateUserRoleReqBody>,
  res: Response
) => {
  const { user_id } = req.params
  const { user_id: admin_id } = req.decode_authorization as TokenPayload

  const result = await adminService.updateUserRole(user_id, admin_id, req.body)
  res.json({
    message: ADMIN_MESSAGES.UPDATE_USER_ROLE_SUCCESS,
    result
  })
}

export const banUserController = async (req: Request<UserIdReqParams>, res: Response) => {
  const { user_id } = req.params
  const { user_id: admin_id } = req.decode_authorization as TokenPayload

  const result = await adminService.banUser(user_id, admin_id)
  res.json({
    message: ADMIN_MESSAGES.BAN_USER_SUCCESS,
    result
  })
}

export const unbanUserController = async (req: Request<UserIdReqParams>, res: Response) => {
  const { user_id } = req.params
  const result = await adminService.unbanUser(user_id)
  res.json({
    message: ADMIN_MESSAGES.UNBAN_USER_SUCCESS,
    result
  })
}

// Dashboard Stats
export const getDashboardStatsController = async (
  req: Request<ParamsDictionary, any, any, GetDashboardStatsReqQuery>,
  res: Response
) => {
  const result = await adminService.getDashboardStats(req.query)
  res.json({
    message: ADMIN_MESSAGES.GET_DASHBOARD_STATS_SUCCESS,
    result
  })
}

// Movie Management
export const updateMovieFeatureStatusController = async (
  req: Request<MovieIdReqParams, any, FeatureMovieReqBody>,
  res: Response
) => {
  const { movie_id } = req.params
  const result = await adminService.updateMovieFeatureStatus(movie_id, req.body)

  const message = req.body.is_featured ? ADMIN_MESSAGES.FEATURE_MOVIE_SUCCESS : ADMIN_MESSAGES.UNFEATURE_MOVIE_SUCCESS

  res.json({
    message,
    result
  })
}

// Feedback Moderation
export const getPendingFeedbacksController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const result = await adminService.getFeedbacksForModeration(page, limit, FeedbackStatus.PENDING)

  res.json({
    message: ADMIN_MESSAGES.GET_USERS_SUCCESS,
    result
  })
}

export const moderateFeedbackController = async (
  req: Request<FeedbackIdReqParams, any, ModerateFeedbackReqBody>,
  res: Response
) => {
  const { feedback_id } = req.params

  // Use existing feedback service to update status
  const result = await feedbackService.updateFeedbackStatus(feedback_id, {
    status: req.body.status
  })

  res.json({
    message: ADMIN_MESSAGES.MODERATE_FEEDBACK_SUCCESS,
    result
  })
}

// Rating Moderation
export const getRatingsForModerationController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const showHidden = req.query.show_hidden === 'true'

  const result = await adminService.getRatingsForModeration(page, limit, showHidden)

  res.json({
    message: ADMIN_MESSAGES.GET_USERS_SUCCESS,
    result
  })
}

export const moderateRatingController = async (
  req: Request<RatingIdReqParams, any, ModerateRatingReqBody>,
  res: Response
) => {
  const { rating_id } = req.params

  // First, update the rating with the "is_hidden" flag
  await databaseService.ratings.updateOne(
    { _id: new ObjectId(rating_id) },
    {
      $set: {
        is_hidden: req.body.is_hidden,
        moderation_note: req.body.moderation_note || ''
      },
      $currentDate: { updated_at: true }
    }
  )

  // If hiding a rating, recalculate movie average rating
  const rating = await databaseService.ratings.findOne({ _id: new ObjectId(rating_id) })
  if (rating) {
    // Use existing service to update movie's average rating
    await ratingService.updateMovieAverageRating(rating.movie_id.toString())
  }

  res.json({
    message: ADMIN_MESSAGES.MODERATE_RATING_SUCCESS,
    result: { rating_id }
  })
}
export const adminGetBannersController = async (
  req: Request<ParamsDictionary, any, any, GetBannersReqQuery>,
  res: Response
) => {
  const result = await bannerService.getBanners(req.query)
  res.json({
    message: BANNER_MESSAGES.GET_BANNERS_SUCCESS,
    result
  })
}

export const adminGetBannerByIdController = async (req: Request<BannerIdReqParams>, res: Response) => {
  const { banner_id } = req.params
  const result = await bannerService.getBannerById(banner_id)
  res.json({
    message: BANNER_MESSAGES.GET_BANNER_SUCCESS,
    result
  })
}

export const adminCreateBannerController = async (
  req: Request<ParamsDictionary, any, CreateBannerReqBody>,
  res: Response
) => {
  const result = await bannerService.createBanner(req.body)
  res.json({
    message: BANNER_MESSAGES.CREATE_BANNER_SUCCESS,
    result
  })
}

export const adminUpdateBannerController = async (
  req: Request<BannerIdReqParams, any, UpdateBannerReqBody>,
  res: Response
) => {
  const { banner_id } = req.params
  const result = await bannerService.updateBanner(banner_id, req.body)
  res.json({
    message: BANNER_MESSAGES.UPDATE_BANNER_SUCCESS,
    result
  })
}

export const adminDeleteBannerController = async (req: Request<BannerIdReqParams>, res: Response) => {
  const { banner_id } = req.params
  const result = await bannerService.deleteBanner(banner_id)
  res.json({
    message: BANNER_MESSAGES.DELETE_BANNER_SUCCESS,
    result
  })
}
export const adminGetAllPaymentsController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const status = req.query.status as string
  const payment_method = req.query.payment_method as string
  const sort_by = (req.query.sort_by as string) || 'created_at'
  const sort_order = (req.query.sort_order as string) || 'desc'
  const date_from = req.query.date_from as string
  const date_to = req.query.date_to as string
  const search = req.query.search as string

  // Build filter
  const filter: any = {}

  if (status) {
    filter.status = status
  }

  if (payment_method) {
    filter.payment_method = payment_method
  }

  // Date range filter
  if (date_from || date_to) {
    filter.payment_time = {}
    if (date_from) {
      filter.payment_time.$gte = new Date(date_from)
    }
    if (date_to) {
      filter.payment_time.$lte = new Date(date_to)
    }
  }

  // Search in transaction_id
  if (search) {
    filter.$or = [{ transaction_id: { $regex: search, $options: 'i' } }]
  }

  // Create sort object
  const sortObj: any = {}
  sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

  // Calculate pagination
  const skip = (page - 1) * limit

  // Get total count
  const totalPayments = await databaseService.payments.countDocuments(filter)

  // Get payments with pagination
  const payments = await databaseService.payments.find(filter).sort(sortObj).skip(skip).limit(limit).toArray()

  // Enhance payments with user, booking, and movie details
  const enhancedPayments = await Promise.all(
    payments.map(async (payment) => {
      const [user, booking] = await Promise.all([
        databaseService.users.findOne(
          { _id: payment.user_id },
          { projection: { _id: 1, name: 1, email: 1, username: 1 } }
        ),
        databaseService.bookings.findOne({ _id: payment.booking_id })
      ])

      let movie = null
      let theater = null
      let showtime = null

      if (booking) {
        ;[movie, theater, showtime] = await Promise.all([
          databaseService.movies.findOne(
            { _id: booking.movie_id },
            { projection: { _id: 1, title: 1, poster_url: 1 } }
          ),
          databaseService.theaters.findOne(
            { _id: booking.theater_id },
            { projection: { _id: 1, name: 1, location: 1 } }
          ),
          databaseService.showtimes.findOne(
            { _id: booking.showtime_id },
            { projection: { _id: 1, start_time: 1, end_time: 1 } }
          )
        ])
      }

      return {
        ...payment,
        user,
        booking: booking
          ? {
              _id: booking._id,
              ticket_code: booking.ticket_code,
              status: booking.status,
              payment_status: booking.payment_status,
              total_amount: booking.total_amount,
              seats: booking.seats.length
            }
          : null,
        movie,
        theater,
        showtime
      }
    })
  )

  res.json({
    message: PAYMENT_MESSAGES.GET_PAYMENTS_SUCCESS,
    result: {
      payments: enhancedPayments,
      total: totalPayments,
      page,
      limit,
      total_pages: Math.ceil(totalPayments / limit)
    }
  })
}

export const adminGetPaymentByIdController = async (req: Request, res: Response) => {
  const { payment_id } = req.params

  if (!ObjectId.isValid(payment_id)) {
    throw new ErrorWithStatus({
      message: PAYMENT_MESSAGES.INVALID_PAYMENT_ID,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  const payment = await databaseService.payments.findOne({ _id: new ObjectId(payment_id) })

  if (!payment) {
    throw new ErrorWithStatus({
      message: PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  // Get detailed information
  const [user, booking] = await Promise.all([
    databaseService.users.findOne(
      { _id: payment.user_id },
      { projection: { _id: 1, name: 1, email: 1, username: 1, avatar: 1 } }
    ),
    databaseService.bookings.findOne({ _id: payment.booking_id })
  ])

  let movie = null
  let theater = null
  let showtime = null
  let screen = null

  if (booking) {
    ;[movie, theater, showtime, screen] = await Promise.all([
      databaseService.movies.findOne({ _id: booking.movie_id }),
      databaseService.theaters.findOne({ _id: booking.theater_id }),
      databaseService.showtimes.findOne({ _id: booking.showtime_id }),
      databaseService.screens.findOne({ _id: booking.screen_id })
    ])
  }

  const result = {
    ...payment,
    user,
    booking,
    movie,
    theater,
    showtime,
    screen
  }

  res.json({
    message: PAYMENT_MESSAGES.GET_PAYMENT_SUCCESS,
    result
  })
}

export const adminUpdatePaymentStatusController = async (req: Request, res: Response) => {
  const { payment_id } = req.params
  const { status, transaction_id, admin_note } = req.body

  if (!ObjectId.isValid(payment_id)) {
    throw new ErrorWithStatus({
      message: PAYMENT_MESSAGES.INVALID_PAYMENT_ID,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  // Check if status is valid
  if (!Object.values(PaymentStatus).includes(status)) {
    throw new ErrorWithStatus({
      message: PAYMENT_MESSAGES.INVALID_STATUS,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  const payment = await databaseService.payments.findOne({ _id: new ObjectId(payment_id) })

  if (!payment) {
    throw new ErrorWithStatus({
      message: PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  // Update payment
  const updateData: any = {
    status,
    admin_note: admin_note || ''
  }

  if (transaction_id) {
    updateData.transaction_id = transaction_id
  }

  await databaseService.payments.updateOne(
    { _id: new ObjectId(payment_id) },
    {
      $set: updateData,
      $currentDate: { updated_at: true }
    }
  )

  // Update booking payment status
  if (payment.booking_id) {
    await databaseService.bookings.updateOne(
      { _id: payment.booking_id },
      {
        $set: {
          payment_status: status,
          // If payment is completed, update booking status to confirmed
          ...(status === PaymentStatus.COMPLETED && { status: BookingStatus.CONFIRMED })
        },
        $currentDate: { updated_at: true }
      }
    )
  }

  res.json({
    message: PAYMENT_MESSAGES.UPDATE_PAYMENT_SUCCESS,
    result: { payment_id }
  })
}

export const adminGetPaymentStatsController = async (req: Request, res: Response) => {
  const { period = 'all', start_date, end_date } = req.query

  // Prepare date filters based on period
  const dateFilter: any = {}
  const now = new Date()

  if (start_date && end_date) {
    dateFilter.$gte = new Date(start_date as string)
    dateFilter.$lte = new Date(end_date as string)
  } else if (period === 'today') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    dateFilter.$gte = today
  } else if (period === 'week') {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    dateFilter.$gte = weekStart
  } else if (period === 'month') {
    const monthStart = new Date(now)
    monthStart.setMonth(now.getMonth() - 1)
    dateFilter.$gte = monthStart
  } else if (period === 'year') {
    const yearStart = new Date(now)
    yearStart.setFullYear(now.getFullYear() - 1)
    dateFilter.$gte = yearStart
  }

  // Get payment stats
  const [totalPayments, completedPayments, pendingPayments, failedPayments, refundedPayments, totalRevenue] =
    await Promise.all([
      // Total payments
      databaseService.payments.countDocuments(dateFilter.$gte ? { payment_time: dateFilter } : {}),

      // Completed payments
      databaseService.payments.countDocuments({
        ...(dateFilter.$gte ? { payment_time: dateFilter } : {}),
        status: PaymentStatus.COMPLETED
      }),

      // Pending payments
      databaseService.payments.countDocuments({
        ...(dateFilter.$gte ? { payment_time: dateFilter } : {}),
        status: PaymentStatus.PENDING
      }),

      // Failed payments
      databaseService.payments.countDocuments({
        ...(dateFilter.$gte ? { payment_time: dateFilter } : {}),
        status: PaymentStatus.FAILED
      }),

      // Refunded payments
      databaseService.payments.countDocuments({
        ...(dateFilter.$gte ? { payment_time: dateFilter } : {}),
        status: PaymentStatus.REFUNDED
      }),

      // Total revenue from completed payments
      databaseService.payments
        .aggregate([
          {
            $match: {
              ...(dateFilter.$gte ? { payment_time: dateFilter } : {}),
              status: PaymentStatus.COMPLETED
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ])
        .toArray()
    ])

  // Get payment methods breakdown
  const paymentMethodsBreakdown = await databaseService.payments
    .aggregate([
      {
        $match: dateFilter.$gte ? { payment_time: dateFilter } : {}
      },
      {
        $group: {
          _id: '$payment_method',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    .toArray()

  // Get payment status breakdown
  const paymentStatusBreakdown = await databaseService.payments
    .aggregate([
      {
        $match: dateFilter.$gte ? { payment_time: dateFilter } : {}
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    .toArray()

  // Get payment trends by day
  const paymentTrends = await databaseService.payments
    .aggregate([
      {
        $match: dateFilter.$gte ? { payment_time: dateFilter } : {}
      },
      {
        $group: {
          _id: {
            year: { $year: '$payment_time' },
            month: { $month: '$payment_time' },
            day: { $dayOfMonth: '$payment_time' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', PaymentStatus.COMPLETED] }, 1, 0]
            }
          },
          completed_amount: {
            $sum: {
              $cond: [{ $eq: ['$status', PaymentStatus.COMPLETED] }, '$amount', 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ])
    .toArray()

  // Format payment trends for chart
  const formattedPaymentTrends = paymentTrends.map((item) => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    total_payments: item.count,
    total_amount: item.amount,
    completed_payments: item.completed,
    completed_amount: item.completed_amount
  }))

  res.json({
    message: 'Get payment statistics success',
    result: {
      period,
      overview: {
        total_payments: totalPayments,
        completed_payments: completedPayments,
        pending_payments: pendingPayments,
        failed_payments: failedPayments,
        refunded_payments: refundedPayments,
        total_revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      },
      payment_methods: paymentMethodsBreakdown,
      payment_status: paymentStatusBreakdown,
      payment_trends: formattedPaymentTrends
    }
  })
}
export const adminUpdateUserController = async (
  req: Request<UserIdReqParams, any, UpdateUserReqBody>,
  res: Response
) => {
  const { user_id } = req.params
  const { user_id: admin_id } = req.decode_authorization as TokenPayload

  const result = await adminService.updateUser(user_id, admin_id, req.body)
  res.json({
    message: ADMIN_MESSAGES.UPDATE_USER_SUCCESS,
    result
  })
}

export const adminDeleteUserController = async (req: Request<UserIdReqParams>, res: Response) => {
  const { user_id } = req.params
  const { user_id: admin_id } = req.decode_authorization as TokenPayload

  const result = await adminService.deleteUser(user_id, admin_id)
  res.json({
    message: ADMIN_MESSAGES.DELETE_USER_SUCCESS,
    result
  })
}

// Payment Email Controllers
export const sendPaymentSuccessEmailController = async (req: Request, res: Response) => {
  const { booking_id } = req.params

  const result = await adminService.sendPaymentSuccessEmailService(booking_id)
  res.json({
    message: 'Payment success email sent successfully',
    result
  })
}

export const sendPaymentFailedEmailController = async (req: Request, res: Response) => {
  const { booking_id } = req.params
  const { failure_reason } = req.body

  const result = await adminService.sendPaymentFailedEmailService(booking_id, failure_reason)
  res.json({
    message: 'Payment failed email sent successfully',
    result
  })
}
export const adminCreateConciergeController = async (req: Request, res: Response) => {
  const { user_id: admin_id } = req.decode_authorization as TokenPayload

  const result = await adminService.createConcierge(admin_id, req.body)
  res.json({
    message: ADMIN_MESSAGES.CREATE_CONCIERGE_SUCCESS,
    result
  })
}
export const getAllConciergeController = async (req: Request, res: Response) => {
  const { limit, page, search } = req.query
  const result = await adminService.getAllConcierge({
    limit: parseInt(limit as string) || 10,
    page: parseInt(page as string) || 1,
    search: search as string
  })
  res.json({
    message: ADMIN_MESSAGES.GET_ALL_CONCIERGE_SUCCESS,
    result: {
      concierges: result.concierges,
      total: result.concierges.length,
      page: page,
      total_pages: result.totalPages
    }
  })
}
export const updateConciergeController = async (req: Request<any, any, UpdateUserReqBody>, res: Response) => {
  const { concierge_id } = req.params
  const result = await adminService.updateConcierge(concierge_id, req.body)
  res.json({
    message: ADMIN_MESSAGES.UPDATE_CONCIERGE_SUCCESS,
    result
  })
}
export const deleteConciergeController = async (req: Request<UserIdReqParams>, res: Response) => {
  const { concierge_id } = req.params
  const result = await adminService.deleteConcierge(concierge_id)
  res.json({
    message: ADMIN_MESSAGES.DELETE_CONCIERGE_SUCCESS,
    result
  })
}
