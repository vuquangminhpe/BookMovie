import { Router } from 'express'
import {
  createBannerSliderHomeController,
  deleteBannerSliderHomeController,
  getBannerSliderHomeByIdController,
  getBannersSliderHomeController,
  getActiveBannersSliderHomeController,
  updateBannerSliderHomeController
} from '../controllers/banner-slider-home.controllers'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { isAdminMiddleware } from '../middlewares/admin.middlewares'
import { bannerSliderHomeIdValidator, createBannerSliderHomeValidator, updateBannerSliderHomeValidator } from '../middlewares/banner-slider-home.middlewares'
import { wrapAsync } from '../utils/handler'

const bannerSliderHomeRouter = Router()

// Public routes for active banners
bannerSliderHomeRouter.get('/active', wrapAsync(getActiveBannersSliderHomeController))

// Admin only routes (require admin authentication)
bannerSliderHomeRouter.use(AccessTokenValidator, verifiedUserValidator, isAdminMiddleware)

bannerSliderHomeRouter.get('/', wrapAsync(getBannersSliderHomeController))
bannerSliderHomeRouter.get('/:banner_id', bannerSliderHomeIdValidator, wrapAsync(getBannerSliderHomeByIdController))
bannerSliderHomeRouter.post('/', createBannerSliderHomeValidator, wrapAsync(createBannerSliderHomeController))
bannerSliderHomeRouter.put('/:banner_id', updateBannerSliderHomeValidator, wrapAsync(updateBannerSliderHomeController))
bannerSliderHomeRouter.delete('/:banner_id', bannerSliderHomeIdValidator, wrapAsync(deleteBannerSliderHomeController))

export default bannerSliderHomeRouter