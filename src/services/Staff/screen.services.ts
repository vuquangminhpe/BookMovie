import { ObjectId } from 'mongodb'
import databaseService from '../database.services'
import { CreateScreenReqBody, GetScreensReqQuery, UpdateScreenReqBody } from '../../models/request/Screen.request'
import Screen from '../../models/schemas/Screen.schema'
import { ScreenStatus, ScreenType } from '../../constants/enums'
import { ErrorWithStatus } from '../../models/Errors'
import HTTP_STATUS from '../../constants/httpStatus'
import { BookingStatus } from '~/models/schemas/Booking.schema'

class StaffScreenService {
  // Validate staff owns the theater
  private async validateTheaterOwnership(staff_id: string, theater_id: string) {
    const theater = await databaseService.theaters.findOne({
      _id: new ObjectId(theater_id),
      manager_id: new ObjectId(staff_id)
    })

    if (!theater) {
      throw new ErrorWithStatus({
        message: 'Theater not found or you do not have permission to manage this theater',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    return theater
  }

  // Validate staff owns the screen through theater ownership
  private async validateScreenOwnership(staff_id: string, screen_id: string) {
    const screen = await databaseService.screens.findOne({ _id: new ObjectId(screen_id) })

    if (!screen) {
      throw new ErrorWithStatus({
        message: 'Screen not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Check if staff owns the theater that contains this screen
    await this.validateTheaterOwnership(staff_id, screen.theater_id.toString())

    return screen
  }

  // Staff tạo screen cho theater của mình
  async createScreenForMyTheater(staff_id: string, theater_id: string, payload: CreateScreenReqBody) {
    // Validate theater ownership
    const theater = await this.validateTheaterOwnership(staff_id, theater_id)

    // Check if theater has reached max screens limit
    const currentScreenCount = await databaseService.screens.countDocuments({
      theater_id: new ObjectId(theater_id),
      status: { $ne: ScreenStatus.INACTIVE }
    })

    if (currentScreenCount >= theater.screens) {
      throw new ErrorWithStatus({
        message: `Theater can only have maximum ${theater.screens} screens. Current: ${currentScreenCount}`,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check for duplicate screen name within the theater
    const existingScreen = await databaseService.screens.findOne({
      theater_id: new ObjectId(theater_id),
      name: payload.name,
      status: { $ne: ScreenStatus.INACTIVE }
    })

    if (existingScreen) {
      throw new ErrorWithStatus({
        message: 'Screen name already exists in this theater',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const screen_id = new ObjectId()

    await databaseService.screens.insertOne(
      new Screen({
        _id: screen_id,
        theater_id: new ObjectId(theater_id),
        name: payload.name,
        seat_layout: payload.seat_layout,
        capacity: payload.capacity,
        screen_type: payload.screen_type || ScreenType.STANDARD,
        status: payload.status || ScreenStatus.ACTIVE
      })
    )

    return { screen_id: screen_id.toString() }
  }

  // Staff lấy danh sách screens của theater mình
  async getMyTheaterScreens(staff_id: string, theater_id: string, query: GetScreensReqQuery) {
    // Validate theater ownership
    await this.validateTheaterOwnership(staff_id, theater_id)

    const { page = '1', limit = '10', screen_type, status, sort_by = 'name', sort_order = 'asc' } = query

    const filter: any = {
      theater_id: new ObjectId(theater_id)
    }

    // Filter by screen_type
    if (screen_type && Object.values(ScreenType).includes(screen_type as ScreenType)) {
      filter.screen_type = screen_type
    }

    // Filter by status
    if (status && Object.values(ScreenStatus).includes(status as ScreenStatus)) {
      filter.status = status
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalScreens = await databaseService.screens.countDocuments(filter)

    const screens = await databaseService.screens.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enrich with showtime count and upcoming showtimes
    const enrichedScreens = await Promise.all(
      screens.map(async (screen) => {
        const [showtimeCount, upcomingShowtimes] = await Promise.all([
          databaseService.showtimes.countDocuments({
            screen_id: screen._id,
            start_time: { $gte: new Date() }
          }),
          databaseService.showtimes
            .find({
              screen_id: screen._id,
              start_time: { $gte: new Date() }
            })
            .sort({ start_time: 1 })
            .limit(3)
            .toArray()
        ])

        return {
          ...screen,
          showtime_count: showtimeCount,
          upcoming_showtimes: upcomingShowtimes.map((showtime) => ({
            _id: showtime._id,
            start_time: showtime.start_time,
            end_time: showtime.end_time,
            status: showtime.status
          }))
        }
      })
    )

    return {
      screens: enrichedScreens,
      total: totalScreens,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalScreens / limitNum)
    }
  }

  // Staff lấy chi tiết screen của theater mình
  async getMyScreenById(staff_id: string, screen_id: string) {
    if (!ObjectId.isValid(screen_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid screen ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Validate screen ownership
    const screen = await this.validateScreenOwnership(staff_id, screen_id)

    // Get theater details
    const theater = await databaseService.theaters.findOne({ _id: screen.theater_id })

    // Get recent showtimes for this screen
    const recentShowtimes = await databaseService.showtimes
      .find({ screen_id: new ObjectId(screen_id) })
      .sort({ start_time: -1 })
      .limit(10)
      .toArray()

    // Get showtime statistics
    const [totalShowtimes, upcomingShowtimes, activeBookings] = await Promise.all([
      databaseService.showtimes.countDocuments({ screen_id: new ObjectId(screen_id) }),
      databaseService.showtimes.countDocuments({
        screen_id: new ObjectId(screen_id),
        start_time: { $gte: new Date() }
      }),
      databaseService.bookings.countDocuments({
        screen_id: new ObjectId(screen_id),
        status: { $ne: BookingStatus.CANCELLED }
      })
    ])

    return {
      ...screen,
      theater: theater
        ? {
            _id: theater._id,
            name: theater.name,
            location: theater.location,
            city: theater.city,
            address: theater.address
          }
        : null,
      statistics: {
        total_showtimes: totalShowtimes,
        upcoming_showtimes: upcomingShowtimes,
        active_bookings: activeBookings
      },
      recent_showtimes: recentShowtimes.map((showtime) => ({
        _id: showtime._id,
        start_time: showtime.start_time,
        end_time: showtime.end_time,
        status: showtime.status,
        available_seats: showtime.available_seats
      }))
    }
  }

  // Staff cập nhật screen của theater mình
  async updateMyScreen(staff_id: string, screen_id: string, payload: UpdateScreenReqBody) {
    if (!ObjectId.isValid(screen_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid screen ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Validate screen ownership
    const screen = await this.validateScreenOwnership(staff_id, screen_id)

    // Check for duplicate screen name if name is being updated
    if (payload.name && payload.name !== screen.name) {
      const existingScreen = await databaseService.screens.findOne({
        _id: { $ne: new ObjectId(screen_id) },
        theater_id: screen.theater_id,
        name: payload.name,
        status: { $ne: ScreenStatus.INACTIVE }
      })

      if (existingScreen) {
        throw new ErrorWithStatus({
          message: 'Screen name already exists in this theater',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    // Check if screen has active showtimes before allowing capacity reduction
    if (payload.capacity && payload.capacity < screen.capacity) {
      const activeShowtimes = await databaseService.showtimes.findOne({
        screen_id: new ObjectId(screen_id),
        start_time: { $gte: new Date() },
        status: { $nin: [BookingStatus.CANCELLED as any] }
      })

      if (activeShowtimes) {
        throw new ErrorWithStatus({
          message: 'Cannot reduce screen capacity while there are active showtimes',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    await databaseService.screens.updateOne(
      { _id: new ObjectId(screen_id) },
      {
        $set: payload,
        $currentDate: { updated_at: true }
      }
    )

    return { screen_id }
  }

  // Staff xóa screen của theater mình
  async deleteMyScreen(staff_id: string, screen_id: string) {
    if (!ObjectId.isValid(screen_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid screen ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Validate screen ownership
    await this.validateScreenOwnership(staff_id, screen_id)

    // Check if screen has any future showtimes
    const futureShowtime = await databaseService.showtimes.findOne({
      screen_id: new ObjectId(screen_id),
      start_time: { $gte: new Date() }
    })

    if (futureShowtime) {
      // Mark as inactive instead of deleting if has future showtimes
      await databaseService.screens.updateOne(
        { _id: new ObjectId(screen_id) },
        {
          $set: { status: ScreenStatus.INACTIVE },
          $currentDate: { updated_at: true }
        }
      )

      return {
        screen_id,
        message: 'Screen marked as inactive due to existing future showtimes'
      }
    } else {
      // Check for any bookings
      const hasBookings = await databaseService.bookings.findOne({
        screen_id: new ObjectId(screen_id)
      })

      if (hasBookings) {
        // Mark as inactive if has booking history
        await databaseService.screens.updateOne(
          { _id: new ObjectId(screen_id) },
          {
            $set: { status: ScreenStatus.INACTIVE },
            $currentDate: { updated_at: true }
          }
        )

        return {
          screen_id,
          message: 'Screen marked as inactive due to booking history'
        }
      } else {
        // Safe to delete if no showtimes or bookings
        await databaseService.screens.deleteOne({ _id: new ObjectId(screen_id) })

        return {
          screen_id,
          message: 'Screen deleted successfully'
        }
      }
    }
  }

  // Staff lấy thống kê screens của theater mình
  async getMyScreenStats(staff_id: string) {
    // Find theater managed by this staff
    const theater = await databaseService.theaters.findOne({
      manager_id: new ObjectId(staff_id)
    })

    if (!theater) {
      throw new ErrorWithStatus({
        message: 'No theater found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const [
      totalScreens,
      activeScreens,
      inactiveScreens,
      maintenanceScreens,
      totalCapacity,
      totalShowtimes,
      upcomingShowtimes,
      screenTypes
    ] = await Promise.all([
      // Total screens
      databaseService.screens.countDocuments({ theater_id: theater._id }),

      // Active screens
      databaseService.screens.countDocuments({
        theater_id: theater._id,
        status: ScreenStatus.ACTIVE
      }),

      // Inactive screens
      databaseService.screens.countDocuments({
        theater_id: theater._id,
        status: ScreenStatus.INACTIVE
      }),

      // Maintenance screens
      databaseService.screens.countDocuments({
        theater_id: theater._id,
        status: ScreenStatus.MAINTENANCE
      }),

      // Total capacity
      databaseService.screens
        .aggregate([
          { $match: { theater_id: theater._id, status: ScreenStatus.ACTIVE } },
          { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } }
        ])
        .toArray(),

      // Total showtimes
      databaseService.showtimes.countDocuments({ theater_id: theater._id }),

      // Upcoming showtimes
      databaseService.showtimes.countDocuments({
        theater_id: theater._id,
        start_time: { $gte: new Date() }
      }),

      // Screen types distribution
      databaseService.screens
        .aggregate([{ $match: { theater_id: theater._id } }, { $group: { _id: '$screen_type', count: { $sum: 1 } } }])
        .toArray()
    ])

    return {
      theater_info: {
        _id: theater._id,
        name: theater.name,
        location: theater.location,
        max_screens: theater.screens
      },
      screen_statistics: {
        total_screens: totalScreens,
        active_screens: activeScreens,
        inactive_screens: inactiveScreens,
        maintenance_screens: maintenanceScreens,
        total_capacity: totalCapacity[0]?.totalCapacity || 0,
        screens_utilization: totalScreens > 0 ? (activeScreens / totalScreens) * 100 : 0
      },
      showtime_statistics: {
        total_showtimes: totalShowtimes,
        upcoming_showtimes: upcomingShowtimes
      },
      screen_types: screenTypes.reduce(
        (acc, type) => {
          acc[type._id] = type.count
          return acc
        },
        {} as Record<string, number>
      )
    }
  }

  // Get available screens for showtime scheduling
  async getAvailableScreensForScheduling(staff_id: string, theater_id: string, start_time: Date, end_time: Date) {
    // Validate theater ownership
    await this.validateTheaterOwnership(staff_id, theater_id)

    // Get all active screens
    const screens = await databaseService.screens
      .find({
        theater_id: new ObjectId(theater_id),
        status: ScreenStatus.ACTIVE
      })
      .toArray()

    // Check availability for each screen
    const availableScreens = await Promise.all(
      screens.map(async (screen) => {
        const conflictingShowtime = await databaseService.showtimes.findOne({
          screen_id: screen._id,
          $or: [
            {
              start_time: { $gte: start_time, $lt: end_time }
            },
            {
              end_time: { $gt: start_time, $lte: end_time }
            },
            {
              start_time: { $lte: start_time },
              end_time: { $gte: end_time }
            }
          ],
          status: { $ne: BookingStatus.CANCELLED as any }
        })

        return {
          ...screen,
          is_available: !conflictingShowtime,
          conflict_showtime: conflictingShowtime
            ? {
                _id: conflictingShowtime._id,
                start_time: conflictingShowtime.start_time,
                end_time: conflictingShowtime.end_time
              }
            : null
        }
      })
    )

    return availableScreens
  }
}

const staffScreenService = new StaffScreenService()
export default staffScreenService
