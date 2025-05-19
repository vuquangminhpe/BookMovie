import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BANNER_MESSAGES } from '../constants/messages'
import {
  BannerIdReqParams,
  CreateBannerReqBody,
  GetBannersReqQuery,
  UpdateBannerReqBody
} from '../models/request/Banner.request'
import bannerService from '../services/banner.services'
import { BannerTypes } from '../models/schemas/Banner.schema'

export const createBannerController = async (
  req: Request<ParamsDictionary, any, CreateBannerReqBody>,
  res: Response
) => {
  const result = await bannerService.createBanner(req.body)
  res.json({
    message: BANNER_MESSAGES.CREATE_BANNER_SUCCESS,
    result
  })
}

export const getBannersController = async (
  req: Request<ParamsDictionary, any, any, GetBannersReqQuery>,
  res: Response
) => {
  const result = await bannerService.getBanners(req.query)
  res.json({
    message: BANNER_MESSAGES.GET_BANNERS_SUCCESS,
    result
  })
}

export const getBannerByIdController = async (req: Request<BannerIdReqParams>, res: Response) => {
  const { banner_id } = req.params
  const result = await bannerService.getBannerById(banner_id)
  res.json({
    message: BANNER_MESSAGES.GET_BANNER_SUCCESS,
    result
  })
}

export const updateBannerController = async (
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

export const deleteBannerController = async (req: Request<BannerIdReqParams>, res: Response) => {
  const { banner_id } = req.params
  const result = await bannerService.deleteBanner(banner_id)
  res.json({
    message: BANNER_MESSAGES.DELETE_BANNER_SUCCESS,
    result
  })
}

export const getHomeSliderBannersController = async (req: Request, res: Response) => {
  const result = await bannerService.getActiveBanners(BannerTypes.HOME_SLIDER)
  res.json({
    message: BANNER_MESSAGES.GET_BANNERS_SUCCESS,
    result
  })
}

export const getPromotionBannersController = async (req: Request, res: Response) => {
  const result = await bannerService.getActiveBanners(BannerTypes.PROMOTION)
  res.json({
    message: BANNER_MESSAGES.GET_BANNERS_SUCCESS,
    result
  })
}

export const getAnnouncementBannersController = async (req: Request, res: Response) => {
  const result = await bannerService.getActiveBanners(BannerTypes.ANNOUNCEMENT)
  res.json({
    message: BANNER_MESSAGES.GET_BANNERS_SUCCESS,
    result
  })
}
