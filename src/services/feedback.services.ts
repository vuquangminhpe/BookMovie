import { ObjectId } from 'mongodb'
import Feedback, { FeedbackStatus } from '../models/schemas/Feedback.schema'
import databaseService from './database.services'
import {
  CreateFeedbackReqBody,
  GetFeedbacksReqQuery,
  UpdateFeedbackReqBody,
  UpdateFeedbackStatusReqBody
} from '../models/request/Feedback.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { FEEDBACK_MESSAGES } from '../constants/messages'

class FeedbackService {
  async createFeedback(user_id: string, payload: CreateFeedbackReqBody) {
    const feedback_id = new ObjectId()

    await databaseService.feedbacks.insertOne(
      new Feedback({
        _id: feedback_id,
        user_id: new ObjectId(user_id),
        movie_id: new ObjectId(payload.movie_id),
        title: payload.title,
        content: payload.content,
        is_spoiler: payload.is_spoiler || false,
        status: FeedbackStatus.PENDING
      })
    )

    return { feedback_id: feedback_id.toString() }
  }

  async getFeedbacks(query: GetFeedbacksReqQuery) {
    const {
      page = '1',
      limit = '10',
      movie_id,
      user_id,
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query

    const filter: any = {}

    // Filter by movie_id
    if (movie_id) {
      filter.movie_id = new ObjectId(movie_id)
    }

    // Filter by user_id
    if (user_id) {
      filter.user_id = new ObjectId(user_id)
    }

    // Filter by status
    if (status && Object.values(FeedbackStatus).includes(status as FeedbackStatus)) {
      filter.status = status
    }

    // Search in title and content
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }]
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of feedbacks matching the filter
    const totalFeedbacks = await databaseService.feedbacks.countDocuments(filter)

    // Get feedbacks with pagination
    const feedbacks = await databaseService.feedbacks.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enhance feedbacks with user and movie details
    const enhancedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        const [user, movie] = await Promise.all([
          databaseService.users.findOne(
            { _id: feedback.user_id },
            { projection: { _id: 1, name: 1, username: 1, avatar: 1 } }
          ),
          databaseService.movies.findOne(
            { _id: feedback.movie_id },
            { projection: { _id: 1, title: 1, poster_url: 1 } }
          )
        ])

        return {
          ...feedback,
          user: user || null,
          movie: movie || null
        }
      })
    )

    return {
      feedbacks: enhancedFeedbacks,
      total: totalFeedbacks,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalFeedbacks / limitNum)
    }
  }

  async getFeedbackById(feedback_id: string) {
    const feedback = await databaseService.feedbacks.findOne({ _id: new ObjectId(feedback_id) })

    if (feedback) {
      const [user, movie] = await Promise.all([
        databaseService.users.findOne(
          { _id: feedback.user_id },
          { projection: { _id: 1, name: 1, username: 1, avatar: 1 } }
        ),
        databaseService.movies.findOne(
          { _id: feedback.movie_id },
          { projection: { _id: 1, title: 1, poster_url: 1, description: 1 } }
        )
      ])

      return {
        ...feedback,
        user: user || null,
        movie: movie || null
      }
    }

    return null
  }

  async updateFeedback(feedback_id: string, payload: UpdateFeedbackReqBody) {
    const feedback = await databaseService.feedbacks.findOne({ _id: new ObjectId(feedback_id) })

    if (!feedback) {
      throw new ErrorWithStatus({
        message: FEEDBACK_MESSAGES.FEEDBACK_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updatePayload: any = {}

    if (payload.title !== undefined) updatePayload.title = payload.title
    if (payload.content !== undefined) updatePayload.content = payload.content
    if (payload.is_spoiler !== undefined) updatePayload.is_spoiler = payload.is_spoiler

    // Reset status to PENDING when feedback is updated
    updatePayload.status = FeedbackStatus.PENDING

    await databaseService.feedbacks.updateOne(
      { _id: new ObjectId(feedback_id) },
      {
        $set: updatePayload,
        $currentDate: {
          updated_at: true
        }
      }
    )

    return { feedback_id }
  }

  async updateFeedbackStatus(feedback_id: string, payload: UpdateFeedbackStatusReqBody) {
    const feedback = await databaseService.feedbacks.findOne({ _id: new ObjectId(feedback_id) })

    if (!feedback) {
      throw new ErrorWithStatus({
        message: FEEDBACK_MESSAGES.FEEDBACK_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.feedbacks.updateOne(
      { _id: new ObjectId(feedback_id) },
      {
        $set: {
          status: payload.status
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return { feedback_id }
  }

  async deleteFeedback(feedback_id: string) {
    const feedback = await databaseService.feedbacks.findOne({ _id: new ObjectId(feedback_id) })

    if (!feedback) {
      throw new ErrorWithStatus({
        message: FEEDBACK_MESSAGES.FEEDBACK_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.feedbacks.deleteOne({ _id: new ObjectId(feedback_id) })

    return { feedback_id }
  }

  async getMovieFeedbacks(movie_id: string, page: number = 1, limit: number = 10, onlyApproved: boolean = true) {
    const filter: any = {
      movie_id: new ObjectId(movie_id)
    }

    // Only show approved feedbacks by default
    if (onlyApproved) {
      filter.status = FeedbackStatus.APPROVED
    }

    // Convert page and limit to numbers
    const skip = (page - 1) * limit

    // Get total count of feedbacks for this movie
    const totalFeedbacks = await databaseService.feedbacks.countDocuments(filter)

    // Get feedbacks with pagination
    const feedbacks = await databaseService.feedbacks
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Enhance feedbacks with user details
    const enhancedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        const user = await databaseService.users.findOne(
          { _id: feedback.user_id },
          { projection: { _id: 1, name: 1, username: 1, avatar: 1 } }
        )

        return {
          ...feedback,
          user: user || null
        }
      })
    )

    return {
      feedbacks: enhancedFeedbacks,
      total: totalFeedbacks,
      page,
      limit,
      total_pages: Math.ceil(totalFeedbacks / limit)
    }
  }
}

const feedbackService = new FeedbackService()
export default feedbackService
