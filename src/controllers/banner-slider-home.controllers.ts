import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  BannerSliderHomeIdReqParams,
  CreateBannerSliderHomeReqBody,
  GetBannersSliderHomeReqQuery,
  UpdateBannerSliderHomeReqBody
} from '../models/request/BannerSliderHome.request'
import bannerSliderHomeService from '../services/banner-slider-home.services'

export const createBannerSliderHomeController = async (
  req: Request<ParamsDictionary, any, CreateBannerSliderHomeReqBody>,
  res: Response
) => {
  const result = await bannerSliderHomeService.createBannerSliderHome(req.body)
  res.json({
    message: 'Create banner slider home successfully',
    result
  })
}

export const getBannersSliderHomeController = async (
  req: Request<ParamsDictionary, any, any, GetBannersSliderHomeReqQuery>,
  res: Response
) => {
  const result = await bannerSliderHomeService.getBannersSliderHome(req.query)
  res.json({
    message: 'Get banners slider home successfully',
    result
  })
}

export const getBannerSliderHomeByIdController = async (req: Request<BannerSliderHomeIdReqParams>, res: Response) => {
  const { banner_id } = req.params
  const result = await bannerSliderHomeService.getBannerSliderHomeById(banner_id)
  res.json({
    message: 'Get banner slider home successfully',
    result
  })
}

export const updateBannerSliderHomeController = async (
  req: Request<BannerSliderHomeIdReqParams, any, UpdateBannerSliderHomeReqBody>,
  res: Response
) => {
  const { banner_id } = req.params
  const result = await bannerSliderHomeService.updateBannerSliderHome(banner_id, req.body)
  res.json({
    message: 'Update banner slider home successfully',
    result
  })
}

export const deleteBannerSliderHomeController = async (req: Request<BannerSliderHomeIdReqParams>, res: Response) => {
  const { banner_id } = req.params
  const result = await bannerSliderHomeService.deleteBannerSliderHome(banner_id)
  res.json({
    message: 'Delete banner slider home successfully',
    result
  })
}

export const getActiveBannersSliderHomeController = async (req: Request, res: Response) => {
  const result = await bannerSliderHomeService.getActiveBannersSliderHome()
  res.json({
    message: 'Get active banners slider home successfully',
    result
  })
}