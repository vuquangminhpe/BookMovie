import { ObjectId } from 'mongodb'
import Partner from '../models/schemas/Partner.schema'
import Movie from '../models/schemas/Movie.shema'
import databaseService from './database.services'
import {
  CreatePartnerReqBody,
  UpdatePartnerReqBody,
  GetPartnersReqQuery,
  CreatePartnerMovieReqBody,
  UpdatePartnerMovieReqBody,
  GetPartnerMoviesReqQuery
} from '../models/request/Partner.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { PARTNER_MESSAGES } from '../constants/messages'
import { PartnerStatus } from '../models/schemas/Partner.schema'
import { MovieStatus } from '../models/schemas/Movie.shema'

class PartnerService {
  async createPartner(payload: CreatePartnerReqBody) {
    const partner_id = new ObjectId()

    // Check if theater already has a partner
    const existingPartner = await databaseService.partners.findOne({
      theater_id: new ObjectId(payload.theater_id),
      status: PartnerStatus.ACTIVE
    })

    if (existingPartner) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.THEATER_ALREADY_HAS_PARTNER,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check if email already exists
    const existingEmail = await databaseService.partners.findOne({
      email: payload.email
    })

    if (existingEmail) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.EMAIL_ALREADY_EXISTS,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    await databaseService.partners.insertOne(
      new Partner({
        _id: partner_id,
        ...payload,
        theater_id: new ObjectId(payload.theater_id),
        status: payload.status || PartnerStatus.ACTIVE
      })
    )

    return { partner_id: partner_id.toString() }
  }

  async getPartners(query: GetPartnersReqQuery) {
    const {
      page = '1',
      limit = '10',
      search = '',
      status,
      theater_id,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query

    const filter: any = {}

    // Search by name, email, company_name
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company_name: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by status
    if (status && Object.values(PartnerStatus).includes(status as PartnerStatus)) {
      filter.status = status
    }

    // Filter by theater_id
    if (theater_id) {
      filter.theater_id = new ObjectId(theater_id)
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalPartners = await databaseService.partners.countDocuments(filter)

    const partners = await databaseService.partners
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'theaters',
            localField: 'theater_id',
            foreignField: '_id',
            as: 'theater'
          }
        },
        { $unwind: { path: '$theater', preserveNullAndEmptyArrays: true } },
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limitNum }
      ])
      .toArray()

    return {
      partners,
      total: totalPartners,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalPartners / limitNum)
    }
  }

  async getPartnerById(partner_id: string) {
    const partner = await databaseService.partners
      .aggregate([
        { $match: { _id: new ObjectId(partner_id) } },
        {
          $lookup: {
            from: 'theaters',
            localField: 'theater_id',
            foreignField: '_id',
            as: 'theater'
          }
        },
        { $unwind: { path: '$theater', preserveNullAndEmptyArrays: true } }
      ])
      .toArray()

    if (partner.length === 0) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return partner[0]
  }

  async updatePartner(partner_id: string, payload: UpdatePartnerReqBody) {
    const partner = await databaseService.partners.findOne({
      _id: new ObjectId(partner_id)
    })

    if (!partner) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check email uniqueness if email is being updated
    if (payload.email && payload.email !== partner.email) {
      const existingEmail = await databaseService.partners.findOne({
        email: payload.email,
        _id: { $ne: new ObjectId(partner_id) }
      })

      if (existingEmail) {
        throw new ErrorWithStatus({
          message: PARTNER_MESSAGES.EMAIL_ALREADY_EXISTS,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Check theater uniqueness if theater_id is being updated
    if (payload.theater_id && payload.theater_id !== partner.theater_id.toString()) {
      const existingTheaterPartner = await databaseService.partners.findOne({
        theater_id: new ObjectId(payload.theater_id),
        status: PartnerStatus.ACTIVE,
        _id: { $ne: new ObjectId(partner_id) }
      })

      if (existingTheaterPartner) {
        throw new ErrorWithStatus({
          message: PARTNER_MESSAGES.THEATER_ALREADY_HAS_PARTNER,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    const updateData: any = { ...payload }
    if (payload.theater_id) {
      updateData.theater_id = new ObjectId(payload.theater_id)
    }

    await databaseService.partners.updateOne(
      { _id: new ObjectId(partner_id) },
      {
        $set: {
          ...updateData,
          updated_at: new Date()
        }
      }
    )

    return { partner_id }
  }

  async deletePartner(partner_id: string) {
    const partner = await databaseService.partners.findOne({
      _id: new ObjectId(partner_id)
    })

    if (!partner) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.partners.deleteOne({
      _id: new ObjectId(partner_id)
    })

    return { partner_id }
  }

  // =============================================================================
  // PARTNER MOVIE MANAGEMENT
  // =============================================================================

  async createPartnerMovie(partner_id: string, payload: CreatePartnerMovieReqBody) {
    // Verify partner exists and is active
    const partner = await databaseService.partners.findOne({
      _id: new ObjectId(partner_id),
      status: PartnerStatus.ACTIVE
    })

    if (!partner) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const movie_id = new ObjectId()

    // Process cast data
    const processedCast =
      payload.cast?.map((name, index) => ({
        id: Date.now() + index,
        name,
        character: 'Character',
        order: index,
        profile_image: '',
        gender: 0
      })) || []

    const result = await databaseService.movies.insertOne(
      new Movie({
        _id: movie_id,
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        genre: payload.genre,
        language: payload.language,
        release_date: new Date(payload.release_date),
        director: payload.director,
        cast: processedCast,
        poster_url: payload.poster_url,
        trailer_url: payload.trailer_url,
        status: (payload.status as MovieStatus) || MovieStatus.COMING_SOON,
        partner_id: new ObjectId(partner_id)
      })
    )

    return { movie_id: movie_id.toString() }
  }

  async getPartnerMovies(partner_id: string, query: GetPartnerMoviesReqQuery) {
    // Verify partner exists
    const partner = await databaseService.partners.findOne({
      _id: new ObjectId(partner_id)
    })

    if (!partner) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const { page = '1', limit = '10', search = '', status, sort_by = 'created_at', sort_order = 'desc' } = query

    const filter: any = { partner_id: new ObjectId(partner_id) }

    // Search by title
    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }

    // Filter by status
    if (status && Object.values(MovieStatus).includes(status as MovieStatus)) {
      filter.status = status
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalMovies = await databaseService.movies.countDocuments(filter)

    const movies = await databaseService.movies.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    return {
      movies,
      total: totalMovies,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalMovies / limitNum)
    }
  }

  async updatePartnerMovie(partner_id: string, movie_id: string, payload: UpdatePartnerMovieReqBody) {
    // Verify partner exists
    const partner = await databaseService.partners.findOne({
      _id: new ObjectId(partner_id),
      status: PartnerStatus.ACTIVE
    })

    if (!partner) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Verify movie belongs to partner
    const movie = await databaseService.movies.findOne({
      _id: new ObjectId(movie_id),
      partner_id: new ObjectId(partner_id)
    })

    if (!movie) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.MOVIE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updateData: any = { ...payload }

    if (payload.release_date) {
      updateData.release_date = new Date(payload.release_date)
    }

    if (payload.cast) {
      updateData.cast = payload.cast.map((name, index) => ({
        id: Date.now() + index,
        name,
        character: 'Character',
        order: index,
        profile_image: '',
        gender: 0
      }))
    }

    await databaseService.movies.updateOne(
      { _id: new ObjectId(movie_id) },
      {
        $set: {
          ...updateData,
          updated_at: new Date()
        }
      }
    )

    return { movie_id }
  }

  async deletePartnerMovie(partner_id: string, movie_id: string) {
    // Verify partner exists
    const partner = await databaseService.partners.findOne({
      _id: new ObjectId(partner_id)
    })

    if (!partner) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.PARTNER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Verify movie belongs to partner
    const movie = await databaseService.movies.findOne({
      _id: new ObjectId(movie_id),
      partner_id: new ObjectId(partner_id)
    })

    if (!movie) {
      throw new ErrorWithStatus({
        message: PARTNER_MESSAGES.MOVIE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.movies.deleteOne({
      _id: new ObjectId(movie_id)
    })

    return { movie_id }
  }
}

const partnerService = new PartnerService()
export default partnerService
