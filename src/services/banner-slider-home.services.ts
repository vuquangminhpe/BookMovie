import { ObjectId } from 'mongodb'
import BannerHome from '../models/schemas/Banner_Slider_Home'
import databaseService from './database.services'
import {
  CreateBannerSliderHomeReqBody,
  GetBannersSliderHomeReqQuery,
  UpdateBannerSliderHomeReqBody
} from '../models/request/BannerSliderHome.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'

class BannerSliderHomeService {
  async createBannerSliderHome(payload: CreateBannerSliderHomeReqBody) {
    const banner_id = new ObjectId()

    // Validate time_active if auto_active is true
    if (payload.auto_active && !payload.time_active) {
      throw new ErrorWithStatus({
        message: 'Time active is required when auto active is enabled',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Create banner slider home
    await databaseService.banners_slider_home.insertOne(
      new BannerHome({
        _id: banner_id,
        image: payload.image,
        author: payload.author || '',
        title: payload.title,
        topic: payload.topic,
        description: payload.description,
        active: payload.active || false,
        time_active: payload.time_active ? new Date(payload.time_active) : undefined,
        auto_active: payload.auto_active || false
      })
    )

    return { banner_id: banner_id.toString() }
  }

  async getBannersSliderHome(query: GetBannersSliderHomeReqQuery) {
    const {
      page = '1',
      limit = '10',
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      active_only = 'false'
    } = query

    const filter: any = {}

    // Filter for active banners only
    if (active_only === 'true') {
      filter.active = true
    }

    // Search in title, author, topic and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count
    const totalBanners = await databaseService.banners_slider_home.countDocuments(filter)

    // Get banners with pagination
    const banners = await databaseService.banners_slider_home
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .toArray()

    return {
      banners,
      total: totalBanners,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalBanners / limitNum)
    }
  }

  async getBannerSliderHomeById(banner_id: string) {
    if (!ObjectId.isValid(banner_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid banner ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const banner = await databaseService.banners_slider_home.findOne({ _id: new ObjectId(banner_id) })

    if (!banner) {
      throw new ErrorWithStatus({
        message: 'Banner slider home not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return banner
  }

  async updateBannerSliderHome(banner_id: string, payload: UpdateBannerSliderHomeReqBody) {
    if (!ObjectId.isValid(banner_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid banner ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const banner = await databaseService.banners_slider_home.findOne({ _id: new ObjectId(banner_id) })

    if (!banner) {
      throw new ErrorWithStatus({
        message: 'Banner slider home not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Build update object
    const updateData: any = {}

    if (payload.image !== undefined) updateData.image = payload.image
    if (payload.author !== undefined) updateData.author = payload.author
    if (payload.title !== undefined) updateData.title = payload.title
    if (payload.topic !== undefined) updateData.topic = payload.topic
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.active !== undefined) updateData.active = payload.active

    // Handle time_active
    if (payload.time_active !== undefined) {
      if (payload.time_active === null || payload.time_active === '') {
        updateData.time_active = null
      } else {
        updateData.time_active = new Date(payload.time_active)
      }
    }

    if (payload.auto_active !== undefined) updateData.auto_active = payload.auto_active

    // Validate auto_active and time_active logic
    const finalAutoActive = updateData.auto_active !== undefined ? updateData.auto_active : banner.auto_active
    const finalTimeActive = updateData.time_active !== undefined ? updateData.time_active : banner.time_active

    if (finalAutoActive && !finalTimeActive) {
      throw new ErrorWithStatus({
        message: 'Time active is required when auto active is enabled',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Update banner
    await databaseService.banners_slider_home.updateOne(
      { _id: new ObjectId(banner_id) },
      {
        $set: updateData
      }
    )

    return { banner_id }
  }

  async deleteBannerSliderHome(banner_id: string) {
    if (!ObjectId.isValid(banner_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid banner ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const banner = await databaseService.banners_slider_home.findOne({ _id: new ObjectId(banner_id) })

    if (!banner) {
      throw new ErrorWithStatus({
        message: 'Banner slider home not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.banners_slider_home.deleteOne({ _id: new ObjectId(banner_id) })

    return { banner_id }
  }

  async getActiveBannersSliderHome() {
    const banners = await databaseService.banners_slider_home.find({ active: true }).sort({ created_at: -1 }).toArray()
    return banners
  }

  // Method for auto activation based on time_active
  async activateBannersByTime() {
    const now = new Date()

    // Find banners that should be auto-activated
    const bannersToActivate = await databaseService.banners_slider_home
      .find({
        auto_active: true,
        active: false,
        time_active: { $lte: now }
      })
      .toArray()

    if (bannersToActivate.length > 0) {
      // Update banners to active
      await databaseService.banners_slider_home.updateMany(
        {
          _id: { $in: bannersToActivate.map((banner) => banner._id) }
        },
        {
          $set: { active: true }
        }
      )

      return {
        activated_count: bannersToActivate.length,
        activated_banners: bannersToActivate.map((banner) => ({
          _id: banner._id,
          title: banner.title,
          time_active: banner.time_active
        }))
      }
    }

    return {
      activated_count: 0,
      activated_banners: []
    }
  }

  // Method to manually activate/deactivate banner
  async toggleBannerActive(banner_id: string, active: boolean) {
    if (!ObjectId.isValid(banner_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid banner ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const banner = await databaseService.banners_slider_home.findOne({ _id: new ObjectId(banner_id) })

    if (!banner) {
      throw new ErrorWithStatus({
        message: 'Banner slider home not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.banners_slider_home.updateOne(
      { _id: new ObjectId(banner_id) },
      {
        $set: { active }
      }
    )

    return { banner_id, active }
  }
}

const bannerSliderHomeService = new BannerSliderHomeService()
export default bannerSliderHomeService
