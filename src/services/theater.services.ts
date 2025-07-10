import { ObjectId } from 'mongodb'
import { TheaterStatus } from '../models/schemas/Theater.schema'
import Theater from '../models/schemas/Theater.schema'
import databaseService from './database.services'
import { CreateTheaterReqBody, GetTheatersReqQuery, UpdateTheaterReqBody } from '../models/request/Theater.request'

class TheaterService {
  async createTheater(user_id: string, payload: CreateTheaterReqBody) {
    const theater_id = new ObjectId()

    await databaseService.theaters.insertOne(
      new Theater({
        _id: theater_id,
        ...payload,
        status: payload.status || TheaterStatus.ACTIVE,
        manager_id: new ObjectId(user_id)
      })
    )
    return { theater_id: theater_id.toString() }
  }

  async getTheaters(query: GetTheatersReqQuery) {
    const { page = '1', limit = '10', city, status, search, sort_by = 'name', sort_order = 'asc' } = query

    const filter: any = {}

    // Filter by city
    if (city) {
      filter.city = city
    }

    // Filter by status
    if (status && Object.values(TheaterStatus).includes(status as TheaterStatus)) {
      filter.status = status
    }

    // Search by name or location
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of theaters matching the filter
    const totalTheaters = await databaseService.theaters.countDocuments(filter)

    // Get theaters with pagination
    const theaters = await databaseService.theaters.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    return {
      theaters,
      total: totalTheaters,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalTheaters / limitNum)
    }
  }

  async getTheaterById(theater_id: string) {
    const theater = await databaseService.theaters.findOne({ _id: new ObjectId(theater_id) })
    return theater
  }

  async updateTheater(theater_id: string, payload: UpdateTheaterReqBody) {
    await databaseService.theaters.updateOne(
      { _id: new ObjectId(theater_id) },
      {
        $set: payload,
        $currentDate: {
          updated_at: true
        }
      }
    )
    return { theater_id }
  }

  async deleteTheater(theater_id: string) {
    // Check if theater has any screens
    const screen = await databaseService.screens.findOne({ theater_id: new ObjectId(theater_id) })
    if (screen) {
      // Instead of deleting, mark as inactive
      await databaseService.theaters.updateOne(
        { _id: new ObjectId(theater_id) },
        {
          $set: { status: TheaterStatus.INACTIVE },
          $currentDate: {
            updated_at: true
          }
        }
      )
    } else {
      // If no screens, delete the theater
      await databaseService.theaters.deleteOne({ _id: new ObjectId(theater_id) })
    }
    return { theater_id }
  }
}

const theaterService = new TheaterService()
export default theaterService
