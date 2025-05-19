import { Router } from 'express'
import {
  createBannerController,
  deleteBannerController,
  getAnnouncementBannersController,
  getBannerByIdController,
  getBannersController,
  getHomeSliderBannersController,
  getPromotionBannersController,
  updateBannerController
} from '../controllers/banners.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { isAdminMiddleware } from '../middlewares/admin.middlewares'
import { bannerIdValidator, createBannerValidator, updateBannerValidator } from '../middlewares/banner.middlewares'
import { wrapAsync } from '../utils/handler'

const bannersRouter = Router()

// Public routes for active banners
bannersRouter.get('/home-slider', wrapAsync(getHomeSliderBannersController))
bannersRouter.get('/promotions', wrapAsync(getPromotionBannersController))
bannersRouter.get('/announcements', wrapAsync(getAnnouncementBannersController))

// Admin only routes (require admin authentication)
bannersRouter.use(AccessTokenValidator, verifiedUserValidator, isAdminMiddleware)

bannersRouter.get('/', wrapAsync(getBannersController))
bannersRouter.get('/:banner_id', bannerIdValidator, wrapAsync(getBannerByIdController))
bannersRouter.post('/', createBannerValidator, wrapAsync(createBannerController))
bannersRouter.put('/:banner_id', updateBannerValidator, wrapAsync(updateBannerController))
bannersRouter.delete('/:banner_id', bannerIdValidator, wrapAsync(deleteBannerController))

export default bannersRouter
