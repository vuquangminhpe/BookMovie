import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import {
  GetUsersReqQuery,
  UpdateUserRoleReqBody,
  GetDashboardStatsReqQuery,
  FeatureMovieReqBody,
  UpdateUserReqBody,
  GetAdminTheatersReqQuery
} from '../models/request/Admin.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { ADMIN_MESSAGES, MOVIE_MESSAGES, USERS_MESSAGES } from '../constants/messages'
import { UserRole } from '../models/schemas/User.schema'
import { UserVerifyStatus } from '../constants/enums'
import { FeedbackStatus } from '../models/schemas/Feedback.schema'
import { BookingStatus, PaymentStatus } from '../models/schemas/Booking.schema'
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from '../utils/sendmail'
import Contract, { ContractStatus } from '../models/schemas/Contact.schema'

class AdminService {
  // User management
  async getUsers(query: GetUsersReqQuery) {
    const { page = '1', limit = '10', search = '', role, verify, sort_by = 'created_at', sort_order = 'desc' } = query

    const filter: any = {}

    // Search by name, email, or username
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by role
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filter.role = role
    }

    // Filter by verification status
    if (verify && verify in UserVerifyStatus) {
      filter.verify = parseInt(verify, 10)
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count
    const totalUsers = await databaseService.users.countDocuments(filter)

    // Get users with pagination
    const users = await databaseService.users
      .find(filter, {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0
        }
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .toArray()

    // Get additional stats for each user
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const [bookingsCount, ratingsCount, feedbacksCount] = await Promise.all([
          databaseService.bookings.countDocuments({ user_id: user._id }),
          databaseService.ratings.countDocuments({ user_id: user._id }),
          databaseService.feedbacks.countDocuments({ user_id: user._id })
        ])

        // If user is staff, include theaters they manage
        let theatersManaged: any[] = []
        if (user.role === UserRole.Staff) {
          try {
            const managerObjectId = new ObjectId(String((user as any)._id))
            theatersManaged = await databaseService.theaters
              .find({ manager_id: managerObjectId }, { projection: { _id: 1, name: 1, location: 1 } })
              .toArray()
          } catch (err) {
            theatersManaged = []
          }
        }

        return {
          ...user,
          stats: {
            bookings_count: bookingsCount,
            ratings_count: ratingsCount,
            feedbacks_count: feedbacksCount
          },
          theaters_managed: theatersManaged.map((t) => ({ _id: t._id, name: t.name, location: t.location }))
        }
      })
    )

    return {
      users: enhancedUsers,
      total: totalUsers,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalUsers / limitNum)
    }
  }

  async getUserById(user_id: string) {
    if (!ObjectId.isValid(user_id)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.INVALID_USER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0
        }
      }
    )

    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get additional user stats
    const [bookings, ratings, feedbacks] = await Promise.all([
      databaseService.bookings.find({ user_id: user._id }).toArray(),
      databaseService.ratings.find({ user_id: user._id }).toArray(),
      databaseService.feedbacks.find({ user_id: user._id }).toArray()
    ])

    // If user is staff, find theaters they manage
    let theatersManaged: any[] = []
    if (user.role === UserRole.Staff) {
      try {
        const managerObjectId = new ObjectId(String((user as any)._id))
        theatersManaged = await databaseService.theaters.find({ manager_id: managerObjectId }, { projection: { _id: 1, name: 1, location: 1 } }).toArray()
      } catch (err) {
        theatersManaged = []
      }
    }

    return {
      ...user,
      stats: {
        bookings_count: bookings.length,
        ratings_count: ratings.length,
        feedbacks_count: feedbacks.length,
        total_spent: bookings.reduce((total, booking) => total + booking.total_amount, 0)
      },
      recent_activity: {
        recent_bookings: bookings.slice(0, 5),
        recent_ratings: ratings.slice(0, 5),
        recent_feedbacks: feedbacks.slice(0, 5)
      },
      theaters_managed: theatersManaged.map((t) => ({ _id: t._id, name: t.name, location: t.location }))
    }
  }

  async updateUserRole(user_id: string, admin_id: string, payload: UpdateUserRoleReqBody) {
    if (!ObjectId.isValid(user_id)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.INVALID_USER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if role is valid
    if (!Object.values(UserRole).includes(payload.role)) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.INVALID_ROLE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get target user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if trying to update another admin
    if (user.role === UserRole.Admin && user_id !== admin_id) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.CANNOT_UPDATE_ADMIN_ROLE,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Update user role
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { role: payload.role },
        $currentDate: { updated_at: true }
      }
    )

    return { user_id }
  }

  async banUser(user_id: string, admin_id: string) {
    if (!ObjectId.isValid(user_id)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.INVALID_USER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get target user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if trying to ban an admin
    if (user.role === UserRole.Admin) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.CANNOT_UPDATE_ADMIN_ROLE,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if user is already banned
    if (user.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.USER_ALREADY_BANNED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Ban user
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { verify: UserVerifyStatus.Banned },
        $currentDate: { updated_at: true }
      }
    )

    return { user_id }
  }

  async unbanUser(user_id: string) {
    if (!ObjectId.isValid(user_id)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.INVALID_USER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get target user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if user is not banned
    if (user.verify !== UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.USER_NOT_BANNED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Unban user (set to verified)
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { verify: UserVerifyStatus.Verified },
        $currentDate: { updated_at: true }
      }
    )

    return { user_id }
  }

  // Dashboard Statistics
  async getDashboardStats(query: GetDashboardStatsReqQuery) {
    const { period = 'all', start_date, end_date } = query

    // Prepare date filters based on period
    const dateFilter: any = {}
    const now = new Date()

    if (start_date && end_date) {
      dateFilter.$gte = new Date(start_date)
      dateFilter.$lte = new Date(end_date)
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

    // Get counts and stats
    const [
      totalUsers,
      newUsers,
      totalBookings,
      completedBookings,
      totalRevenue,
      totalMovies,
      totalTheaters,
      totalScreens,
      totalRatings,
      totalFeedbacks,
      totalContracts,
      totalStaff
    ] = await Promise.all([
      // Total users
      databaseService.users.countDocuments({}),

      // New users in period
      databaseService.users.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Total bookings
      databaseService.bookings.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Completed bookings
      databaseService.bookings.countDocuments({
        ...(dateFilter.$gte ? { created_at: dateFilter } : {}),
        status: BookingStatus.COMPLETED
      }),

      // Total revenue
      databaseService.bookings
        .aggregate([
          {
            $match: {
              ...(dateFilter.$gte ? { created_at: dateFilter } : {}),
              payment_status: PaymentStatus.COMPLETED
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total_amount' }
            }
          }
        ])
        .toArray(),

      // Total movies
      databaseService.movies.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Total theaters
      databaseService.theaters.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Total screens
      databaseService.screens.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Total ratings
      databaseService.ratings.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Total feedbacks
      databaseService.feedbacks.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Total contracts
      databaseService.contracts.countDocuments(dateFilter.$gte ? { created_at: dateFilter } : {}),

      // Total staff (users with role = 'staff')
      databaseService.users.countDocuments({
        ...(dateFilter.$gte ? { created_at: dateFilter } : {}),
        role: UserRole.Staff
      })
    ])

    // Get revenue by status
    const revenueByStatus = await databaseService.bookings
      .aggregate([
        {
          $match: {
            ...(dateFilter.$gte ? { created_at: dateFilter } : {}),
            status: { $ne: BookingStatus.CANCELLED }
          }
        },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$total_amount' }
          }
        }
      ])
      .toArray()

    // Get bookings per day for chart
    const bookingsPerDay = await databaseService.bookings
      .aggregate([
        {
          $match: {
            ...(dateFilter.$gte ? { created_at: dateFilter } : {}),
            status: { $ne: BookingStatus.CANCELLED }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$created_at' },
              month: { $month: '$created_at' },
              day: { $dayOfMonth: '$created_at' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$total_amount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ])
      .toArray()

    // Format bookings per day for chart
    const formattedBookingsPerDay = bookingsPerDay.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      bookings: item.count,
      revenue: item.revenue
    }))

    // Get top movies by tickets sold (sum of seats in bookings)
    const topMovies = await databaseService.bookings
      .aggregate([
        {
          $match: {
            ...(dateFilter.$gte ? { created_at: dateFilter } : {}),
            status: { $ne: BookingStatus.CANCELLED },
            payment_status: PaymentStatus.COMPLETED
          }
        },
        {
          $group: {
            _id: '$movie_id',
            tickets_sold: { $sum: { $size: '$seats' } },
            revenue: { $sum: '$total_amount' }
          }
        },
        {
          $sort: { tickets_sold: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'movies',
            localField: '_id',
            foreignField: '_id',
            as: 'movie_info'
          }
        },
        {
          $unwind: '$movie_info'
        },
        {
          $project: {
            movie_id: '$_id',
            title: '$movie_info.title',
            poster_url: '$movie_info.poster_url',
            tickets_sold: 1,
            revenue: 1
          }
        }
      ])
      .toArray()

    // Get top theaters by bookings
    const topTheaters = await databaseService.bookings
      .aggregate([
        {
          $match: {
            ...(dateFilter.$gte ? { created_at: dateFilter } : {}),
            status: { $ne: BookingStatus.CANCELLED }
          }
        },
        {
          $group: {
            _id: '$theater_id',
            bookings_count: { $sum: 1 },
            revenue: { $sum: '$total_amount' }
          }
        },
        {
          $sort: { bookings_count: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'theaters',
            localField: '_id',
            foreignField: '_id',
            as: 'theater_info'
          }
        },
        {
          $unwind: '$theater_info'
        },
        {
          $project: {
            theater_id: '$_id',
            name: '$theater_info.name',
            location: '$theater_info.location',
            bookings_count: 1,
            revenue: 1
          }
        }
      ])
      .toArray()

    return {
      period,
      user_stats: {
        total_users: totalUsers,
        new_users: newUsers
      },
      booking_stats: {
        total_bookings: totalBookings,
        completed_bookings: completedBookings,
        revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        revenue_by_status: revenueByStatus
      },
      content_stats: {
        total_movies: totalMovies,
        total_theaters: totalTheaters,
        total_screens: totalScreens,
        total_ratings: totalRatings,
        total_feedbacks: totalFeedbacks
      },
      hr_stats: {
        total_contracts: totalContracts,
        total_staff: totalStaff
      },
      charts: {
        bookings_per_day: formattedBookingsPerDay
      },
      top_performers: {
        top_movies: topMovies,
        top_theaters: topTheaters
      }
    }
  }

  async updateMovieFeatureStatus(movie_id: string, payload: FeatureMovieReqBody) {
    if (!ObjectId.isValid(movie_id)) {
      throw new ErrorWithStatus({
        message: MOVIE_MESSAGES.INVALID_MOVIE_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const movie = await databaseService.movies.findOne({ _id: new ObjectId(movie_id) })
    if (!movie) {
      throw new ErrorWithStatus({
        message: MOVIE_MESSAGES.MOVIE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (movie.is_featured === payload.is_featured) {
      throw new ErrorWithStatus({
        message: payload.is_featured ? ADMIN_MESSAGES.MOVIE_ALREADY_FEATURED : ADMIN_MESSAGES.MOVIE_NOT_FEATURED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    await databaseService.movies.updateOne(
      { _id: new ObjectId(movie_id) },
      {
        $set: {
          is_featured: payload.is_featured,
          featured_order: payload.is_featured ? payload.featured_order || 0 : null
        },
        $currentDate: { updated_at: true }
      }
    )

    return { movie_id }
  }

  async getFeedbacksForModeration(
    page: number = 1,
    limit: number = 10,
    status: FeedbackStatus = FeedbackStatus.PENDING
  ) {
    const filter = { status }

    const totalFeedbacks = await databaseService.feedbacks.countDocuments(filter)

    const skip = (page - 1) * limit

    const feedbacks = await databaseService.feedbacks
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const enhancedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        const [user, movie] = await Promise.all([
          databaseService.users.findOne(
            { _id: feedback.user_id },
            { projection: { _id: 1, name: 1, username: 1, email: 1, avatar: 1 } }
          ),
          databaseService.movies.findOne(
            { _id: feedback.movie_id },
            { projection: { _id: 1, title: 1, poster_url: 1 } }
          )
        ])

        return {
          ...feedback,
          user: user || null,
          movie: movie || null
        }
      })
    )

    return {
      feedbacks: enhancedFeedbacks,
      total: totalFeedbacks,
      page,
      limit,
      total_pages: Math.ceil(totalFeedbacks / limit)
    }
  }

  async getRatingsForModeration(page: number = 1, limit: number = 10, isHidden: boolean = false) {
    const filter = { is_hidden: isHidden }

    const totalRatings = await databaseService.ratings.countDocuments(filter)

    const skip = (page - 1) * limit

    const ratings = await databaseService.ratings
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const enhancedRatings = await Promise.all(
      ratings.map(async (rating) => {
        const [user, movie] = await Promise.all([
          databaseService.users.findOne(
            { _id: rating.user_id },
            { projection: { _id: 1, name: 1, username: 1, email: 1, avatar: 1 } }
          ),
          databaseService.movies.findOne({ _id: rating.movie_id }, { projection: { _id: 1, title: 1, poster_url: 1 } })
        ])

        return {
          ...rating,
          user: user || null,
          movie: movie || null
        }
      })
    )

    return {
      ratings: enhancedRatings,
      total: totalRatings,
      page,
      limit,
      total_pages: Math.ceil(totalRatings / limit)
    }
  }
  async updateUser(user_id: string, admin_id: string, payload: UpdateUserReqBody) {
    if (!ObjectId.isValid(user_id)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.INVALID_USER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get target user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if trying to update another admin (except self)
    if (user.role === UserRole.Admin && user_id !== admin_id) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.CANNOT_UPDATE_ADMIN_ROLE,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // If updating email, check if new email already exists
    if (payload.email && payload.email !== user.email) {
      const existingUser = await databaseService.users.findOne({
        email: payload.email,
        _id: { $ne: new ObjectId(user_id) }
      })
      if (existingUser) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (payload.name) updateData.name = payload.name
    if (payload.email) updateData.email = payload.email
    if (payload.phone) updateData.phone = payload.phone
    if (payload.address) updateData.address = { ...user.address, ...payload.address }
    if (payload.role && Object.values(UserRole).includes(payload.role)) {
      updateData.role = payload.role
    }
    if (payload.verify !== undefined && Object.values(UserVerifyStatus).includes(payload.verify)) {
      updateData.verify = payload.verify
    }

    // Update user
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: updateData,
        $currentDate: { updated_at: true }
      }
    )

    // Return updated user info (without sensitive data)
    const updatedUser = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          forgot_password_token: 0,
          email_verify_token: 0,
          email_verify_code: 0
        }
      }
    )

    return updatedUser
  }

  async deleteUser(user_id: string, admin_id: string) {
    if (!ObjectId.isValid(user_id)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.INVALID_USER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Cannot delete self
    if (user_id === admin_id) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.CANNOT_DELETE_SELF,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Get target user
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Cannot delete another admin
    if (user.role === UserRole.Admin) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.CANNOT_DELETE_ADMIN,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if user has active bookings
    const activeBookings = await databaseService.bookings.countDocuments({
      user_id: new ObjectId(user_id),
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }
    })

    if (activeBookings > 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.CANNOT_DELETE_USER_WITH_ACTIVE_BOOKINGS,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Delete user and related data
    await Promise.all([
      // Delete user
      databaseService.users.deleteOne({ _id: new ObjectId(user_id) }),

      // Delete user's ratings
      databaseService.ratings.deleteMany({ user_id: new ObjectId(user_id) }),

      // Delete user's feedback
      databaseService.feedbacks.deleteMany({ user_id: new ObjectId(user_id) }),

      // Delete user's notifications
      databaseService.notifications.deleteMany({ user_id: new ObjectId(user_id) }),

      // Delete user's favorites
      databaseService.favorites.deleteMany({ user_id: new ObjectId(user_id) }),

      // Update completed/cancelled bookings to mark user as deleted
      databaseService.bookings.updateMany(
        {
          user_id: new ObjectId(user_id),
          status: { $in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] }
        },
        {
          $set: { user_deleted: true },
          $currentDate: { updated_at: true }
        }
      )
    ])

    return { user_id, deleted: true }
  }

  // Payment Email Services
  async sendPaymentSuccessEmailService(bookingId: string) {
    if (!ObjectId.isValid(bookingId)) {
      throw new ErrorWithStatus({
        message: 'Invalid booking ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get booking details
    const booking = await databaseService.bookings.findOne({ _id: new ObjectId(bookingId) })

    if (!booking) {
      throw new ErrorWithStatus({
        message: 'Booking not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get payment details for this booking
    const payment = await databaseService.payments.findOne({ booking_id: new ObjectId(bookingId) })

    if (!payment) {
      throw new ErrorWithStatus({
        message: 'Payment not found for this booking',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get related data
    const [user, movie, theater, showtime] = await Promise.all([
      databaseService.users.findOne({ _id: booking.user_id }),
      databaseService.movies.findOne({ _id: booking.movie_id }),
      databaseService.theaters.findOne({ _id: booking.theater_id }),
      databaseService.showtimes.findOne({ _id: booking.showtime_id })
    ])

    if (!user || !movie || !theater || !showtime) {
      throw new ErrorWithStatus({
        message: 'Required booking details not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Format seats display
    const seatsDisplay = booking.seats.map((seat: any) => `${seat.row}${seat.number}`).join(', ')

    // Format data for email
    const paymentData = {
      customerName: user.name || user.email.split('@')[0],
      transactionId: payment.transaction_id || payment._id.toString(),
      paymentMethod: payment.payment_method,
      amount: booking.total_amount.toLocaleString('vi-VN'),
      paymentDate: payment.payment_time?.toLocaleDateString('vi-VN') || new Date().toLocaleDateString('vi-VN'),
      movieTitle: movie.title,
      theaterName: theater.name,
      showDateTime: new Date(showtime.start_time).toLocaleString('vi-VN'),
      seats: seatsDisplay,
      ticketCode: booking.ticket_code
    }

    // Send email
    const emailSent = await sendPaymentSuccessEmail(user.email, paymentData)

    if (!emailSent) {
      throw new ErrorWithStatus({
        message: 'Failed to send payment success email',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    return {
      message: 'Payment success email sent successfully',
      booking_id: bookingId,
      email: user.email
    }
  }

  async sendPaymentFailedEmailService(bookingId: string, failureReason: string = 'Payment processing failed') {
    if (!ObjectId.isValid(bookingId)) {
      throw new ErrorWithStatus({
        message: 'Invalid booking ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Get booking details
    const booking = await databaseService.bookings.findOne({ _id: new ObjectId(bookingId) })

    if (!booking) {
      throw new ErrorWithStatus({
        message: 'Booking not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get payment details for this booking
    const payment = await databaseService.payments.findOne({ booking_id: new ObjectId(bookingId) })

    if (!payment) {
      throw new ErrorWithStatus({
        message: 'Payment not found for this booking',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get user data
    const user = await databaseService.users.findOne({ _id: booking.user_id })

    if (!user) {
      throw new ErrorWithStatus({
        message: 'User not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Format data for email
    const paymentData = {
      customerName: user.name || user.email.split('@')[0],
      transactionId: payment.transaction_id || payment._id.toString(),
      paymentMethod: payment.payment_method,
      amount: booking.total_amount.toLocaleString('vi-VN'),
      attemptDate: payment.payment_time?.toLocaleDateString('vi-VN') || new Date().toLocaleDateString('vi-VN'),
      failureReason: failureReason,
      retryLink: `${process.env.CLIENT_URL}/payment/retry?booking_id=${bookingId}`
    }

    // Send email
    const emailSent = await sendPaymentFailedEmail(user.email, paymentData)

    if (!emailSent) {
      throw new ErrorWithStatus({
        message: 'Failed to send payment failed email',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    return {
      message: 'Payment failed email sent successfully',
      booking_id: bookingId,
      email: user.email
    }
  }
  async createConcierge(admin_id: string, payload: any) {
    const newConcierge = {
      ...payload,
      role: UserRole.Concierge,
      created_by: admin_id,
      created_at: new Date(),
      updated_at: new Date()
    }

    const result = await databaseService.users.insertOne(newConcierge)

    return { concierge_id: result.insertedId }
  }
  async getAllConcierge({ limit, page, search }: { limit: number; page: number; search: string }) {
    let concierges: any[] = []
    if (search && search !== '') {
      concierges = await databaseService.users
        .find(
          {
            role: UserRole.Concierge,
            $or: [{ email: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
          },
          { projection: { forgot_password_token: 0, email_verify_token: 0 } }
        )
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()
    } else {
      concierges = await databaseService.users
        .find({ role: UserRole.Concierge }, { projection: { forgot_password_token: 0, email_verify_token: 0 } })
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()
    }
    if (concierges.length === 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.NO_CONCIERGE_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const totalConcierges = await databaseService.users.countDocuments({ role: UserRole.Concierge })
    const totalPages = Math.ceil(totalConcierges / limit)
    return { concierges, totalPages, total: totalConcierges }
  }
  async updateConcierge(
    concierge_id: string,
    payload: { name?: string; email?: string; phone?: string; address?: any }
  ) {
    const result = await databaseService.users.updateOne(
      { _id: new ObjectId(concierge_id) },
      { $set: { ...payload, updated_at: new Date() } }
    )

    if (result.modifiedCount === 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.UPDATE_CONCIERGE_FAILED,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return { concierge_id }
  }
  async deleteConcierge(concierge_id: string) {
    const result = await databaseService.users.deleteOne({
      _id: new ObjectId(concierge_id)
    })

    if (result.deletedCount === 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.DELETE_CONCIERGE_FAILED,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return { concierge_id }
  }

  // =============================================================================
  // THEATER MANAGEMENT (Admin view-only)
  // =============================================================================

  // Admin xem tất cả theaters với filters
  async getAllTheaters(query: GetAdminTheatersReqQuery) {
    const {
      page = '1',
      limit = '20',
      search = '',
      city,
      status,
      has_manager,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query

    const filter: any = {}

    // Search by name, location, city, address
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by city
    if (city) {
      filter.city = { $regex: city, $options: 'i' }
    }

    // Filter by status
    if (status) {
      filter.status = status
    }

    // Filter by manager presence
    if (has_manager === 'true') {
      filter.manager_id = { $exists: true, $ne: null }
    } else if (has_manager === 'false') {
      filter.$or = [{ manager_id: { $exists: false } }, { manager_id: null }]
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalTheaters = await databaseService.theaters.countDocuments(filter)

    // Get theaters with manager info, screen count, and booking stats
    const theaters = await databaseService.theaters
      .aggregate([
        { $match: filter },
        // Lookup manager info
        {
          $lookup: {
            from: 'users',
            localField: 'manager_id',
            foreignField: '_id',
            as: 'manager_info'
          }
        },
        // Count screens
        {
          $lookup: {
            from: 'screens',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'screens'
          }
        },
        // Count total bookings
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'all_bookings'
          }
        },
        // Add computed fields
        {
          $addFields: {
            manager_info: {
              $cond: {
                if: { $gt: [{ $size: '$manager_info' }, 0] },
                then: {
                  $let: {
                    vars: { manager: { $arrayElemAt: ['$manager_info', 0] } },
                    in: {
                      _id: '$$manager._id',
                      name: '$$manager.name',
                      email: '$$manager.email',
                      phone: '$$manager.phone'
                    }
                  }
                },
                else: null
              }
            },
            total_bookings: {
              $size: {
                $filter: {
                  input: '$all_bookings',
                  cond: { $ne: ['$$this.status', 'cancelled'] }
                }
              }
            },
            completed_bookings: {
              $size: {
                $filter: {
                  input: '$all_bookings',
                  cond: { $eq: ['$$this.status', 'completed'] }
                }
              }
            },
            total_revenue: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$all_bookings',
                      cond: {
                        $and: [
                          { $eq: ['$$this.payment_status', 'completed'] },
                          { $ne: ['$$this.status', 'cancelled'] }
                        ]
                      }
                    }
                  },
                  in: '$$this.total_amount'
                }
              }
            }
          }
        },
        // Project final structure
        {
          $project: {
            _id: 1,
            name: 1,
            location: 1,
            city: 1,
            address: 1,
            phone: 1,
            email: 1,
            status: 1,
            created_at: 1,
            updated_at: 1,
            manager_info: 1,
            total_screens: 1,
            total_bookings: 1,
            completed_bookings: 1,
            total_revenue: 1
          }
        },
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limitNum }
      ])
      .toArray()

    return {
      theaters,
      total: totalTheaters,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalTheaters / limitNum)
    }
  }

  // Admin xem chi tiết theater với thống kê đầy đủ
  async getTheaterById(theater_id: string) {
    if (!ObjectId.isValid(theater_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid theater ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const theaterDetails = await databaseService.theaters
      .aggregate([
        { $match: { _id: new ObjectId(theater_id) } },
        // Lookup manager info
        {
          $lookup: {
            from: 'users',
            localField: 'manager_id',
            foreignField: '_id',
            as: 'manager_info'
          }
        },
        // Lookup screens with details
        {
          $lookup: {
            from: 'screens',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'screens'
          }
        },
        // Lookup movies through showtimes
        {
          $lookup: {
            from: 'showtimes',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'showtimes'
          }
        },
        // Lookup bookings
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'bookings'
          }
        },
        // Add computed fields
        {
          $addFields: {
            manager_info: {
              $cond: {
                if: { $gt: [{ $size: '$manager_info' }, 0] },
                then: {
                  $let: {
                    vars: { manager: { $arrayElemAt: ['$manager_info', 0] } },
                    in: {
                      _id: '$$manager._id',
                      name: '$$manager.name',
                      email: '$$manager.email',
                      phone: '$$manager.phone',
                      created_at: '$$manager.created_at'
                    }
                  }
                },
                else: null
              }
            },
            screens: {
              $map: {
                input: '$screens',
                in: {
                  _id: '$$this._id',
                  name: '$$this.name',
                  screen_type: '$$this.screen_type',
                  capacity: '$$this.capacity',
                  status: '$$this.status'
                }
              }
            },
            statistics: {
              total_screens: { $size: '$screens' },
              total_showtimes: { $size: '$showtimes' },
              active_showtimes: {
                $size: {
                  $filter: {
                    input: '$showtimes',
                    cond: { $eq: ['$$this.status', 'scheduled'] }
                  }
                }
              },
              total_bookings: {
                $size: {
                  $filter: {
                    input: '$bookings',
                    cond: { $ne: ['$$this.status', 'cancelled'] }
                  }
                }
              },
              completed_bookings: {
                $size: {
                  $filter: {
                    input: '$bookings',
                    cond: { $eq: ['$$this.status', 'completed'] }
                  }
                }
              },
              pending_bookings: {
                $size: {
                  $filter: {
                    input: '$bookings',
                    cond: { $eq: ['$$this.status', 'pending'] }
                  }
                }
              },
              cancelled_bookings: {
                $size: {
                  $filter: {
                    input: '$bookings',
                    cond: { $eq: ['$$this.status', 'cancelled'] }
                  }
                }
              },
              total_revenue: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$bookings',
                        cond: {
                          $and: [
                            { $eq: ['$$this.payment_status', 'completed'] },
                            { $ne: ['$$this.status', 'cancelled'] }
                          ]
                        }
                      }
                    },
                    in: '$$this.total_amount'
                  }
                }
              },
              total_capacity: { $sum: '$screens.capacity' }
            }
          }
        },
        // Project final structure  
        {
          $project: {
            _id: 1,
            name: 1,
            location: 1,
            city: 1,
            address: 1,
            phone: 1,
            email: 1,
            status: 1,
            created_at: 1,
            updated_at: 1,
            manager_info: 1,
            screens: 1,
            statistics: 1
          }
        }
      ])
      .toArray()

    if (theaterDetails.length === 0) {
      throw new ErrorWithStatus({
        message: 'Theater not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return theaterDetails[0]
  }

  // Admin xem thống kê tổng quan tất cả theaters
  async getTheaterOverviewStats() {
    const stats = await databaseService.theaters
      .aggregate([
        // Lookup manager info
        {
          $lookup: {
            from: 'users',
            localField: 'manager_id',
            foreignField: '_id',
            as: 'manager_info'
          }
        },
        // Lookup screens
        {
          $lookup: {
            from: 'screens',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'screens'
          }
        },
        // Lookup bookings
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'bookings'
          }
        },
        // Group to calculate stats
        {
          $group: {
            _id: null,
            total_theaters: { $sum: 1 },
            active_theaters: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            theaters_with_manager: {
              $sum: { $cond: [{ $gt: [{ $size: '$manager_info' }, 0] }, 1, 0] }
            },
            theaters_without_manager: {
              $sum: { $cond: [{ $eq: [{ $size: '$manager_info' }, 0] }, 1, 0] }
            },
            total_bookings: {
              $sum: {
                $size: {
                  $filter: {
                    input: '$bookings',
                    cond: { $ne: ['$$this.status', 'cancelled'] }
                  }
                }
              }
            },
            total_revenue: {
              $sum: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$bookings',
                        cond: {
                          $and: [
                            { $eq: ['$$this.payment_status', 'completed'] },
                            { $ne: ['$$this.status', 'cancelled'] }
                          ]
                        }
                      }
                    },
                    in: '$$this.total_amount'
                  }
                }
              }
            }
          }
        }
      ])
      .toArray()

    return stats[0] || {
      total_theaters: 0,
      active_theaters: 0,
      theaters_with_manager: 0,
      theaters_without_manager: 0,
      total_screens: 0,
      total_bookings: 0,
      total_revenue: 0
    }
  }

  // =============================================================================
  // QUICK STATS & RECENT ACTIVITIES
  // =============================================================================

  // API 1: Thống kê nhanh các thông tin quan trọng
  async getQuickStats() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      activeUsers,
      newBookings,
      pendingFeedbacks,
      pendingRatings,
      pendingContracts,
      totalStaff,
      totalTheaters,
      totalScreens
    ] = await Promise.all([
      // Số người dùng hoạt động (đã đăng nhập trong 30 ngày qua)
      databaseService.users.countDocuments({
        last_login_at: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      }),

      // Lượt đặt vé mới (trong tháng này)
      databaseService.bookings.countDocuments({
        created_at: { $gte: thisMonth },
        status: { $ne: BookingStatus.CANCELLED }
      }),

      // Số đánh giá chờ duyệt
      databaseService.feedbacks.countDocuments({ status: FeedbackStatus.PENDING }),

      // Số rating chờ duyệt (ẩn)
      databaseService.ratings.countDocuments({ is_hidden: false }),

      // Số hợp đồng chờ duyệt (draft)
      databaseService.contracts.countDocuments({ status: ContractStatus.DRAFT }),

      // Tổng số nhân viên
      databaseService.users.countDocuments({ role: UserRole.Staff }),

      // Tổng số rạp
      databaseService.theaters.countDocuments(),

      // Tổng số màn hình
      databaseService.screens.countDocuments()
    ])

    return {
      active_users: activeUsers,
      new_bookings_this_month: newBookings,
      pending_feedbacks: pendingFeedbacks,
      pending_ratings: pendingRatings,
      pending_contracts: pendingContracts,
      total_staff: totalStaff,
      total_theaters: totalTheaters,
      total_screens: totalScreens
    }
  }

  // API 2: Thống kê nhanh các hoạt động gần đây
  async getRecentActivities() {
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      newUsers,
      successfulBookings,
      newRatings,
      completedPayments
    ] = await Promise.all([
      // Số lượng người dùng mới đăng ký (7 ngày qua)
      databaseService.users.countDocuments({
        created_at: { $gte: last7Days }
      }),

      // Số lượng đặt vé xem phim thành công (7 ngày qua)
      databaseService.bookings.countDocuments({
        created_at: { $gte: last7Days },
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.USED] },
        payment_status: PaymentStatus.COMPLETED
      }),

      // Số lượng đánh giá phim đã được gửi từ user (7 ngày qua)
      databaseService.ratings.countDocuments({
        created_at: { $gte: last7Days }
      }),

      // Số lượng thanh toán đã hoàn thành (7 ngày qua)
      databaseService.payments.countDocuments({
        payment_time: { $gte: last7Days },
        status: PaymentStatus.COMPLETED
      })
    ])

    // Thống kê theo ngày trong 7 ngày qua
    const dailyStats = await databaseService.bookings
      .aggregate([
        {
          $match: {
            created_at: { $gte: last7Days },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$created_at' },
              month: { $month: '$created_at' },
              day: { $dayOfMonth: '$created_at' }
            },
            bookings: { $sum: 1 },
            revenue: { $sum: '$total_amount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ])
      .toArray()

    const formattedDailyStats = dailyStats.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      bookings: item.bookings,
      revenue: item.revenue
    }))

    return {
      period: 'last_7_days',
      summary: {
        new_users: newUsers,
        successful_bookings: successfulBookings,
        new_ratings: newRatings,
        completed_payments: completedPayments
      },
      daily_stats: formattedDailyStats
    }
  }

  // =============================================================================
  // GROWTH STATS
  // =============================================================================

  async getGrowthStats() {
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0)

    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(currentWeekStart.getDate() - 7) // Start of previous week

    const previousWeekEnd = new Date(currentWeekStart)
    previousWeekEnd.setMilliseconds(-1) // End of previous week

    // Get current week data
    const [
      currentWeekRevenue,
      currentWeekUsers,
      currentWeekBookings,
      currentWeekMovies
    ] = await Promise.all([
      // Doanh thu tuần này
      databaseService.bookings
        .aggregate([
          {
            $match: {
              created_at: { $gte: currentWeekStart },
              payment_status: PaymentStatus.COMPLETED,
              status: { $ne: BookingStatus.CANCELLED }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total_amount' }
            }
          }
        ])
        .toArray(),

      // Tổng số người dùng tuần này
      databaseService.users.countDocuments({
        created_at: { $gte: currentWeekStart }
      }),

      // Số lượng đặt vé tuần này
      databaseService.bookings.countDocuments({
        created_at: { $gte: currentWeekStart },
 
      }),

      // Số phim đang chiếu tuần này
      databaseService.movies.countDocuments({
        created_at: { $gte: currentWeekStart }
      })
    ])

    // Get previous week data
    const [
      previousWeekRevenue,
      previousWeekUsers,
      previousWeekBookings,
      previousWeekMovies
    ] = await Promise.all([
      // Doanh thu tuần trước
      databaseService.bookings
        .aggregate([
          {
            $match: {
              created_at: { $gte: previousWeekStart, $lt: currentWeekStart },
              payment_status: PaymentStatus.COMPLETED,
              status: { $ne: BookingStatus.CANCELLED }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total_amount' }
            }
          }
        ])
        .toArray(),

      // Tổng số người dùng tuần trước
      databaseService.users.countDocuments({
        created_at: { $gte: previousWeekStart, $lt: currentWeekStart }
      }),

      // Số lượng đặt vé tuần trước
      databaseService.bookings.countDocuments({
        created_at: { $gte: previousWeekStart, $lt: currentWeekStart },
      }),

      // Số phim đang chiếu tuần trước
      databaseService.movies.countDocuments({
        created_at: { $gte: previousWeekStart, $lt: currentWeekStart }
      })
    ])

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const currentRevenue = currentWeekRevenue.length > 0 ? currentWeekRevenue[0].total : 0
    const previousRevenue = previousWeekRevenue.length > 0 ? previousWeekRevenue[0].total : 0

    return {
      revenue_growth: {
        current_week: currentRevenue,
        previous_week: previousRevenue,
        growth_percentage: calculateGrowth(currentRevenue, previousRevenue)
      },
      users_growth: {
        current_week: currentWeekUsers,
        previous_week: previousWeekUsers,
        growth_percentage: calculateGrowth(currentWeekUsers, previousWeekUsers)
      },
      bookings_growth: {
        current_week: currentWeekBookings,
        previous_week: previousWeekBookings,
        growth_percentage: calculateGrowth(currentWeekBookings, previousWeekBookings)
      },
      movies_growth: {
        current_week: currentWeekMovies,
        previous_week: previousWeekMovies,
        growth_percentage: calculateGrowth(currentWeekMovies, previousWeekMovies)
      }
    }
  }
}

const adminService = new AdminService()
export default adminService
