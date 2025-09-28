import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { isAdminMiddleware } from '../middlewares/admin.middlewares'
import { wrapAsync } from '../utils/handler'

// Existing controllers
import {
  adminCreateBannerController,
  adminDeleteBannerController,
  adminDeleteUserController,
  adminGetAllPaymentsController,
  adminGetBannerByIdController,
  adminGetBannersController,
  adminGetPaymentByIdController,
  adminGetPaymentStatsController,
  adminUpdateBannerController,
  adminUpdatePaymentStatusController,
  adminUpdateUserController,
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
  updateUserRoleController,
  sendPaymentSuccessEmailController,
  sendPaymentFailedEmailController,
  adminCreateConciergeController,
  getAllConciergeController,
  updateConciergeController,
  deleteConciergeController,
  adminGetAllTheatersController,
  adminGetTheaterByIdController,
  adminGetTheaterOverviewStatsController
} from '../controllers/admin.controllers'

// Contract controllers
import {
  createContractController,
  getContractsController,
  getContractByIdController,
  updateContractController,
  activateContractController,
  terminateContractController,
  checkExpiredContractsController
} from '../controllers/contract.controllers'

// Existing middleware imports
import { movieIdValidator } from '../middlewares/movie.middlewares'
import { feedbackIdValidator } from '../middlewares/feedback.middlewares'
import { ratingIdValidator } from '../middlewares/rating.middlewares'
import { bannerIdValidator, createBannerValidator, updateBannerValidator } from '../middlewares/banner.middlewares'
import { createSystemNotificationController } from '../controllers/notifications.controllers'
import {
  createCouponController,
  deleteCouponController,
  getCouponByIdController,
  getCouponsController,
  updateCouponController
} from '../controllers/coupons.controllers'
import databaseService from '~/services/database.services'
import { UserRole } from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import contractService from '~/services/contract.services'

const adminRouter = Router()

// Apply admin middleware to all routes
adminRouter.use(AccessTokenValidator, verifiedUserValidator, isAdminMiddleware)

/**
 * =============================================================================
 * DASHBOARD & STATS
 * =============================================================================
 */
adminRouter.get('/dashboard', wrapAsync(getDashboardStatsController))

/**
 * =============================================================================
 * USER MANAGEMENT
 * =============================================================================
 */
adminRouter.get('/users', wrapAsync(getUsersController))
adminRouter.get('/users/:user_id', wrapAsync(getUserByIdController))
adminRouter.put('/users/:user_id/role', wrapAsync(updateUserRoleController))
adminRouter.put('/users/:user_id/ban', wrapAsync(banUserController))
adminRouter.put('/users/:user_id/unban', wrapAsync(unbanUserController))
adminRouter.put('/users/:user_id', wrapAsync(adminUpdateUserController))
adminRouter.delete('/users/:user_id', wrapAsync(adminDeleteUserController))

/**
 * =============================================================================
 * CONCIERGE MANAGEMENT
 * =============================================================================
 */
adminRouter.post('/add/register/Concierge', wrapAsync(adminCreateConciergeController))
adminRouter.get('/concierge/all/tk/get', wrapAsync(getAllConciergeController))
adminRouter.put('/concierge/update/:concierge_id', wrapAsync(updateConciergeController))
adminRouter.delete('/concierge/deleted/:concierge_id', wrapAsync(deleteConciergeController))

/**
 * =============================================================================
 * CONTRACT MANAGEMENT (NEW)
 * =============================================================================
 */

/**
 * Description: Create contract for staff
 * Path: /admin/contracts
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateContractReqBody
 */
adminRouter.post('/contracts', wrapAsync(createContractController))

/**
 * Description: Get all contracts with filtering
 * Path: /admin/contracts
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: { page?, limit?, status?, staff_id?, search?, sort_by?, sort_order? }
 */
adminRouter.get('/contracts', wrapAsync(getContractsController))

/**
 * Description: Get contract details
 * Path: /admin/contracts/:contract_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
adminRouter.get('/contracts/:contract_id', wrapAsync(getContractByIdController))

/**
 * Description: Update contract
 * Path: /admin/contracts/:contract_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: UpdateContractReqBody
 */
adminRouter.put('/contracts/:contract_id', wrapAsync(updateContractController))

/**
 * Description: Activate contract
 * Path: /admin/contracts/:contract_id/activate
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 */
adminRouter.put('/contracts/:contract_id/activate', wrapAsync(activateContractController))

/**
 * Description: Terminate contract
 * Path: /admin/contracts/:contract_id/terminate
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: { reason?: string }
 */
adminRouter.put('/contracts/:contract_id/terminate', wrapAsync(terminateContractController))

/**
 * Description: Check and update expired contracts
 * Path: /admin/contracts/check-expired
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 */
adminRouter.post('/contracts/check-expired', wrapAsync(checkExpiredContractsController))

/**
 * Description: Promote user to staff (requires creating contract)
 * Path: /admin/users/:user_id/promote-to-staff
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreateContractReqBody
 */
adminRouter.put(
  '/users/:user_id/promote-to-staff',
  wrapAsync(async (req: any, res: any) => {
    const { user_id } = req.params
    const { user_id: admin_id } = req.decode_authorization as any

    // Update user role to staff
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id as string) },
      {
        $set: { role: UserRole.Staff },
        $currentDate: { updated_at: true }
      }
    )

    // Create contract for the staff
    const contractData = {
      ...req.body,
      staff_id: user_id
    }

    const contractResult = await contractService.createContract(admin_id, contractData)

    res.json({
      message: 'User promoted to staff and contract created successfully',
      result: {
        user_id,
        contract_id: contractResult.contract_id
      }
    })
  })
)

/**
 * =============================================================================
 * MOVIE MANAGEMENT
 * =============================================================================
 */
adminRouter.put('/movies/:movie_id/feature', movieIdValidator, wrapAsync(updateMovieFeatureStatusController))

/**
 * =============================================================================
 * CONTENT MODERATION
 * =============================================================================
 */
// Feedback Moderation
adminRouter.get('/feedbacks/pending', wrapAsync(getPendingFeedbacksController))
adminRouter.put('/feedbacks/:feedback_id/moderate', feedbackIdValidator, wrapAsync(moderateFeedbackController))

// Rating Moderation
adminRouter.get('/ratings/moderate', wrapAsync(getRatingsForModerationController))
adminRouter.put('/ratings/:rating_id/moderate', ratingIdValidator, wrapAsync(moderateRatingController))

/**
 * =============================================================================
 * BANNER MANAGEMENT
 * =============================================================================
 */
adminRouter.get('/banners', wrapAsync(adminGetBannersController))
adminRouter.get('/banners/:banner_id', bannerIdValidator, wrapAsync(adminGetBannerByIdController))
adminRouter.post('/banners', createBannerValidator, wrapAsync(adminCreateBannerController))
adminRouter.put('/banners/:banner_id', updateBannerValidator, wrapAsync(adminUpdateBannerController))
adminRouter.delete('/banners/:banner_id', bannerIdValidator, wrapAsync(adminDeleteBannerController))

/**
 * =============================================================================
 * PAYMENT MANAGEMENT
 * =============================================================================
 */
adminRouter.get('/payments', wrapAsync(adminGetAllPaymentsController))
adminRouter.get('/payments/stats', wrapAsync(adminGetPaymentStatsController))
adminRouter.get('/payments/:payment_id', wrapAsync(adminGetPaymentByIdController))
adminRouter.put('/payments/:payment_id/status', wrapAsync(adminUpdatePaymentStatusController))

/**
 * =============================================================================
 * NOTIFICATION MANAGEMENT
 * =============================================================================
 */
adminRouter.post('/notifications/system', wrapAsync(createSystemNotificationController))

/**
 * =============================================================================
 * COUPON MANAGEMENT
 * =============================================================================
 */
adminRouter.get('/coupons', wrapAsync(getCouponsController))
adminRouter.get('/coupons/:coupon_id', wrapAsync(getCouponByIdController))
adminRouter.post('/coupons', wrapAsync(createCouponController))
adminRouter.put('/coupons/:coupon_id', wrapAsync(updateCouponController))
adminRouter.delete('/coupons/:coupon_id', wrapAsync(deleteCouponController))

/**
 * =============================================================================
 * PAYMENT EMAIL MANAGEMENT
 * =============================================================================
 */

/**
 * Description: Send payment success email to customer
 * Path: /admin/bookings/:booking_id/send-success-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 */
adminRouter.post('/bookings/:booking_id/send-success-email', wrapAsync(sendPaymentSuccessEmailController))

/**
 * Description: Send payment failed email to customer
 * Path: /admin/bookings/:booking_id/send-failed-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { failure_reason?: string }
 */
adminRouter.post('/bookings/:booking_id/send-failed-email', wrapAsync(sendPaymentFailedEmailController))

/**
 * =============================================================================
 * THEATER MANAGEMENT (View-only)
 * =============================================================================
 */

/**
 * Description: Get all theaters with filters (Admin view-only)
 * Path: /admin/theaters
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: GetAdminTheatersReqQuery (page, limit, search, city, status, has_manager, sort_by, sort_order)
 */
adminRouter.get('/theaters', wrapAsync(adminGetAllTheatersController))

/**
 * Description: Get theater overview statistics (Admin only)
 * Path: /admin/theaters/stats
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
adminRouter.get('/theaters/stats', wrapAsync(adminGetTheaterOverviewStatsController))

/**
 * Description: Get theater details by ID (Admin view-only)
 * Path: /admin/theaters/:theater_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
adminRouter.get('/theaters/:theater_id', wrapAsync(adminGetTheaterByIdController))

export default adminRouter
