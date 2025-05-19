import { ObjectId } from 'mongodb'
import Banner, { BannerStatus, BannerTypes } from '../models/schemas/Banner.schema'
import databaseService from './database.services'
import { CreateBannerReqBody, GetBannersReqQuery, UpdateBannerReqBody } from '../models/request/Banner.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { BANNER_MESSAGES } from '../constants/messages'

class BannerService {
  async createBanner(payload: CreateBannerReqBody) {
    const banner_id = new ObjectId()

    // Check if movie_id is valid if provided
    if (payload.movie_id) {
      if (!ObjectId.isValid(payload.movie_id)) {
        throw new ErrorWithStatus({
          message: 'Invalid movie ID',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      const movie = await databaseService.movies.findOne({ _id: new ObjectId(payload.movie_id) })
      if (!movie) {
        throw new ErrorWithStatus({
          message: 'Movie not found',
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }

    // Validate date range if both dates are provided
    if (payload.start_date && payload.end_date) {
      const startDate = new Date(payload.start_date)
      const endDate = new Date(payload.end_date)

      if (endDate <= startDate) {
        throw new ErrorWithStatus({
          message: BANNER_MESSAGES.INVALID_DATE_RANGE,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Create banner
    await databaseService.banners.insertOne(
      new Banner({
        _id: banner_id,
        title: payload.title,
        image_url: payload.image_url,
        link_url: payload.link_url,
        description: payload.description,
        type: payload.type,
        status: payload.status || BannerStatus.INACTIVE,
        position: payload.position || 0,
        movie_id: payload.movie_id ? new ObjectId(payload.movie_id) : undefined,
        start_date: payload.start_date ? new Date(payload.start_date) : undefined,
        end_date: payload.end_date ? new Date(payload.end_date) : undefined
      })
    )

    return { banner_id: banner_id.toString() }
  }

  async getBanners(query: GetBannersReqQuery) {
    const {
      page = '1',
      limit = '10',
      type,
      status,
      search,
      sort_by = 'position',
      sort_order = 'asc',
      active_only = 'false'
    } = query

    const filter: any = {}

    // Filter by type
    if (type && Object.values(BannerTypes).includes(type as BannerTypes)) {
      filter.type = type
    }

    // Filter by status
    if (status && Object.values(BannerStatus).includes(status as BannerStatus)) {
      filter.status = status
    }

    // Filter for active banners only (consider date range)
    if (active_only === 'true') {
      const now = new Date()
      filter.status = BannerStatus.ACTIVE

      // Either no date constraints or within date range
      filter.$or = [
        // No date constraints
        { start_date: { $exists: false }, end_date: { $exists: false } },

        // Only start_date defined and it's in the past
        { start_date: { $lte: now }, end_date: { $exists: false } },

        // Only end_date defined and it's in the future
        { start_date: { $exists: false }, end_date: { $gte: now } },

        // Both dates defined and now is between them
        { start_date: { $lte: now }, end_date: { $gte: now } }
      ]
    }

    // Search in title and description
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count
    const totalBanners = await databaseService.banners.countDocuments(filter)

    // Get banners with pagination
    const banners = await databaseService.banners.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enhance banners with movie details if available
    const enhancedBanners = await Promise.all(
      banners.map(async (banner) => {
        let movie = null
        if (banner.movie_id) {
          movie = await databaseService.movies.findOne(
            { _id: banner.movie_id },
            { projection: { _id: 1, title: 1, poster_url: 1 } }
          )
        }

        return {
          ...banner,
          movie
        }
      })
    )

    return {
      banners: enhancedBanners,
      total: totalBanners,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalBanners / limitNum)
    }
  }

  async getBannerById(banner_id: string) {
    if (!ObjectId.isValid(banner_id)) {
      throw new ErrorWithStatus({
        message: BANNER_MESSAGES.INVALID_BANNER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const banner = await databaseService.banners.findOne({ _id: new ObjectId(banner_id) })

    if (!banner) {
      throw new ErrorWithStatus({
        message: BANNER_MESSAGES.BANNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get movie details if banner is linked to a movie
    let movie = null
    if (banner.movie_id) {
      movie = await databaseService.movies.findOne(
        { _id: banner.movie_id },
        { projection: { _id: 1, title: 1, poster_url: 1, description: 1 } }
      )
    }

    return {
      ...banner,
      movie
    }
  }

  async updateBanner(banner_id: string, payload: UpdateBannerReqBody) {
    if (!ObjectId.isValid(banner_id)) {
      throw new ErrorWithStatus({
        message: BANNER_MESSAGES.INVALID_BANNER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const banner = await databaseService.banners.findOne({ _id: new ObjectId(banner_id) })

    if (!banner) {
      throw new ErrorWithStatus({
        message: BANNER_MESSAGES.BANNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Build update object
    const updateData: any = {}

    if (payload.title !== undefined) updateData.title = payload.title
    if (payload.image_url !== undefined) updateData.image_url = payload.image_url
    if (payload.link_url !== undefined) updateData.link_url = payload.link_url
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.type !== undefined) updateData.type = payload.type
    if (payload.status !== undefined) updateData.status = payload.status
    if (payload.position !== undefined) updateData.position = payload.position

    // Handle movie_id
    if (payload.movie_id !== undefined) {
      if (payload.movie_id === null || payload.movie_id === '') {
        updateData.movie_id = null
      } else {
        if (!ObjectId.isValid(payload.movie_id)) {
          throw new ErrorWithStatus({
            message: 'Invalid movie ID',
            status: HTTP_STATUS.BAD_REQUEST
          })
        }

        const movie = await databaseService.movies.findOne({ _id: new ObjectId(payload.movie_id) })
        if (!movie) {
          throw new ErrorWithStatus({
            message: 'Movie not found',
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        updateData.movie_id = new ObjectId(payload.movie_id)
      }
    }

    // Handle dates
    if (payload.start_date !== undefined) {
      updateData.start_date = payload.start_date ? new Date(payload.start_date) : null
    }

    if (payload.end_date !== undefined) {
      updateData.end_date = payload.end_date ? new Date(payload.end_date) : null
    }

    // Validate date range if both dates are provided in the update
    if ((updateData.start_date || banner.start_date) && (updateData.end_date || banner.end_date)) {
      const startDate = updateData.start_date || banner.start_date
      const endDate = updateData.end_date || banner.end_date

      if (endDate <= startDate) {
        throw new ErrorWithStatus({
          message: BANNER_MESSAGES.INVALID_DATE_RANGE,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Update banner
    await databaseService.banners.updateOne(
      { _id: new ObjectId(banner_id) },
      {
        $set: updateData,
        $currentDate: { updated_at: true }
      }
    )

    return { banner_id }
  }

  async deleteBanner(banner_id: string) {
    if (!ObjectId.isValid(banner_id)) {
      throw new ErrorWithStatus({
        message: BANNER_MESSAGES.INVALID_BANNER_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const banner = await databaseService.banners.findOne({ _id: new ObjectId(banner_id) })

    if (!banner) {
      throw new ErrorWithStatus({
        message: BANNER_MESSAGES.BANNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.banners.deleteOne({ _id: new ObjectId(banner_id) })

    return { banner_id }
  }

  async getActiveBanners(type?: BannerTypes) {
    const now = new Date()

    const filter: any = {
      status: BannerStatus.ACTIVE,
      $or: [
        // No date constraints
        { start_date: { $exists: false }, end_date: { $exists: false } },

        // Only start_date defined and it's in the past
        { start_date: { $lte: now }, end_date: { $exists: false } },

        // Only end_date defined and it's in the future
        { start_date: { $exists: false }, end_date: { $gte: now } },

        // Both dates defined and now is between them
        { start_date: { $lte: now }, end_date: { $gte: now } }
      ]
    }

    // Filter by type if provided
    if (type) {
      filter.type = type
    }

    // Get active banners ordered by position
    const banners = await databaseService.banners.find(filter).sort({ position: 1 }).toArray()

    // Enhance banners with movie details if available
    const enhancedBanners = await Promise.all(
      banners.map(async (banner) => {
        let movie = null
        if (banner.movie_id) {
          movie = await databaseService.movies.findOne(
            { _id: banner.movie_id },
            { projection: { _id: 1, title: 1, poster_url: 1 } }
          )
        }

        return {
          ...banner,
          movie
        }
      })
    )

    return enhancedBanners
  }
}

const bannerService = new BannerService()
export default bannerService
