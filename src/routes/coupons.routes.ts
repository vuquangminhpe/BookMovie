import { Router } from 'express'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { isAdminMiddleware } from '../middlewares/admin.middlewares'
import { wrapAsync } from '../utils/handler'
import {
  applyCouponController,
  getUserCouponsController,
  validateCouponController
} from '../controllers/coupons.controllers'

const couponsRouter = Router()

// User routes - need authentication
couponsRouter.use(AccessTokenValidator, verifiedUserValidator)

// Get available coupons for user
couponsRouter.get('/my-coupons', wrapAsync(getUserCouponsController))

// Validate coupon before booking
couponsRouter.post('/validate', wrapAsync(validateCouponController))

// Apply coupon to booking
couponsRouter.post('/apply', wrapAsync(applyCouponController))

export default couponsRouter
