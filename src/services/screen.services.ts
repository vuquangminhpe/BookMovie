import { ObjectId } from 'mongodb'
import Screen from '../models/schemas/Screen.schema'
import databaseService from './database.services'
import { CreateScreenReqBody, GetScreensReqQuery, UpdateScreenReqBody } from '../models/request/Screen.request'
import { ScreenStatus, ScreenType } from '../constants/enums'

class ScreenService {
  async createScreen(payload: CreateScreenReqBody) {
    const screen_id = new ObjectId()
    const result = await databaseService.screens.insertOne(
      new Screen({
        _id: screen_id,
        theater_id: new ObjectId(payload.theater_id),
        name: payload.name,
        seat_layout: payload.seat_layout,
        capacity: payload.capacity,
        screen_type: payload.screen_type || ScreenType.STANDARD,
        status: payload.status || ScreenStatus.ACTIVE
      })
    )
    return { screen_id: screen_id.toString() }
  }

  async getScreens(query: GetScreensReqQuery) {
    const { page = '1', limit = '10', theater_id, screen_type, status, sort_by = 'name', sort_order = 'asc' } = query

    const filter: any = {}

    // Filter by theater_id
    if (theater_id) {
      filter.theater_id = new ObjectId(theater_id)
    }

    // Filter by screen_type
    if (screen_type && Object.values(ScreenType).includes(screen_type as ScreenType)) {
      filter.screen_type = screen_type
    }

    // Filter by status
    if (status && Object.values(ScreenStatus).includes(status as ScreenStatus)) {
      filter.status = status
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of screens matching the filter
    const totalScreens = await databaseService.screens.countDocuments(filter)

    // Get screens with pagination
    const screens = await databaseService.screens.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    return {
      screens,
      total: totalScreens,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalScreens / limitNum)
    }
  }

  async getScreenById(screen_id: string) {
    const screen = await databaseService.screens.findOne({ _id: new ObjectId(screen_id) })

    if (screen) {
      // Get theater details to include with screen
      const theater = await databaseService.theaters.findOne({ _id: screen.theater_id })
      return {
        ...screen,
        theater: theater
          ? {
              _id: theater._id,
              name: theater.name,
              location: theater.location,
              city: theater.city
            }
          : null
      }
    }

    return screen
  }

  async updateScreen(screen_id: string, payload: UpdateScreenReqBody) {
    await databaseService.screens.updateOne(
      { _id: new ObjectId(screen_id) },
      {
        $set: payload,
        $currentDate: {
          updated_at: true
        }
      }
    )
    return { screen_id }
  }

  async deleteScreen(screen_id: string) {
    // Check if screen has any showtimes
    const showtime = await databaseService.showtimes.findOne({ screen_id: new ObjectId(screen_id) })
    if (showtime) {
      // Instead of deleting, mark as inactive
      await databaseService.screens.updateOne(
        { _id: new ObjectId(screen_id) },
        {
          $set: { status: ScreenStatus.INACTIVE },
          $currentDate: {
            updated_at: true
          }
        }
      )
    } else {
      // If no showtimes, delete the screen
      await databaseService.screens.deleteOne({ _id: new ObjectId(screen_id) })
    }
    return { screen_id }
  }
}

const screenService = new ScreenService()
export default screenService
