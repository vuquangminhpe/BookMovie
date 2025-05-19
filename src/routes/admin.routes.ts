import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { isAdminMiddleware } from '../middlewares/admin.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  adminCreateBannerController,
  adminDeleteBannerController,
  adminGetAllPaymentsController,
  adminGetBannerByIdController,
  adminGetBannersController,
  adminGetPaymentByIdController,
  adminGetPaymentStatsController,
  adminUpdateBannerController,
  adminUpdatePaymentStatusController,
  banUserController,
  getDashboardStatsController,
  getPendingFeedbacksController,
  getRatingsForModerationController,
  getUserByIdController,
  getUsersController,
  moderateFeedbackController,
  moderateRatingController,
  unbanUserController,
  updateMovieFeatureStatusController,
  updateUserRoleController
} from '../controllers/admin.controllers'
import { movieIdValidator } from '../middlewares/movie.middlewares'
import { feedbackIdValidator } from '../middlewares/feedback.middlewares'
import { ratingIdValidator } from '../middlewares/rating.middlewares'
import { bannerIdValidator, createBannerValidator, updateBannerValidator } from '~/middlewares/banner.middlewares'
import { createSystemNotificationController } from '~/controllers/notifications.controllers'
import {
  createCouponController,
  deleteCouponController,
  getCouponByIdController,
  getCouponsController,
  updateCouponController
} from '~/controllers/coupons.controllers'
import { verifyTicketQRController } from '~/controllers/bookings.controllers'

const adminRouter = Router()

// Apply admin middleware to all routes
adminRouter.use(AccessTokenValidator, verifiedUserValidator, isAdminMiddleware)

// Dashboard Stats
adminRouter.get('/dashboard', wrapAsync(getDashboardStatsController))

// User Management
adminRouter.get('/users', wrapAsync(getUsersController))
adminRouter.get('/users/:user_id', wrapAsync(getUserByIdController))
adminRouter.put('/users/:user_id/role', wrapAsync(updateUserRoleController))
adminRouter.put('/users/:user_id/ban', wrapAsync(banUserController))
adminRouter.put('/users/:user_id/unban', wrapAsync(unbanUserController))

// Movie Management
adminRouter.put('/movies/:movie_id/feature', movieIdValidator, wrapAsync(updateMovieFeatureStatusController))

// Feedback Moderation
adminRouter.get('/feedbacks/pending', wrapAsync(getPendingFeedbacksController))
adminRouter.put('/feedbacks/:feedback_id/moderate', feedbackIdValidator, wrapAsync(moderateFeedbackController))

// Rating Moderation
adminRouter.get('/ratings/moderate', wrapAsync(getRatingsForModerationController))
adminRouter.put('/ratings/:rating_id/moderate', ratingIdValidator, wrapAsync(moderateRatingController))
adminRouter.get('/banners', wrapAsync(adminGetBannersController))
adminRouter.get('/banners/:banner_id', bannerIdValidator, wrapAsync(adminGetBannerByIdController))
adminRouter.post('/banners', createBannerValidator, wrapAsync(adminCreateBannerController))
adminRouter.put('/banners/:banner_id', updateBannerValidator, wrapAsync(adminUpdateBannerController))
adminRouter.delete('/banners/:banner_id', bannerIdValidator, wrapAsync(adminDeleteBannerController))
adminRouter.get('/payments', wrapAsync(adminGetAllPaymentsController))
adminRouter.get('/payments/stats', wrapAsync(adminGetPaymentStatsController))
adminRouter.get('/payments/:payment_id', wrapAsync(adminGetPaymentByIdController))
adminRouter.put('/payments/:payment_id/status', wrapAsync(adminUpdatePaymentStatusController))
adminRouter.post('/notifications/system', wrapAsync(createSystemNotificationController))
adminRouter.get('/coupons', wrapAsync(getCouponsController))
adminRouter.get('/coupons/:coupon_id', wrapAsync(getCouponByIdController))
adminRouter.post('/coupons', wrapAsync(createCouponController))
adminRouter.put('/coupons/:coupon_id', wrapAsync(updateCouponController))
adminRouter.delete('/coupons/:coupon_id', wrapAsync(deleteCouponController))
adminRouter.post('/verify-ticket', wrapAsync(verifyTicketQRController))
export default adminRouter
