import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { FEEDBACK_MESSAGES } from '../constants/messages'
import {
  CreateFeedbackReqBody,
  FeedbackIdReqParams,
  GetFeedbacksReqQuery,
  UpdateFeedbackReqBody,
  UpdateFeedbackStatusReqBody
} from '../models/request/Feedback.request'
import feedbackService from '../services/feedback.services'
import { TokenPayload } from '../models/request/User.request'

export const createFeedbackController = async (
  req: Request<ParamsDictionary, any, CreateFeedbackReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await feedbackService.createFeedback(user_id, req.body)
  res.json({
    message: FEEDBACK_MESSAGES.CREATE_FEEDBACK_SUCCESS,
    result
  })
}

export const getFeedbacksController = async (
  req: Request<ParamsDictionary, any, any, GetFeedbacksReqQuery>,
  res: Response
) => {
  const result = await feedbackService.getFeedbacks(req.query)
  res.json({
    message: FEEDBACK_MESSAGES.GET_FEEDBACKS_SUCCESS,
    result
  })
}

export const getFeedbackByIdController = async (req: Request<FeedbackIdReqParams>, res: Response) => {
  const { feedback_id } = req.params
  const result = await feedbackService.getFeedbackById(feedback_id)
  res.json({
    message: FEEDBACK_MESSAGES.GET_FEEDBACK_SUCCESS,
    result
  })
}

export const updateFeedbackController = async (
  req: Request<FeedbackIdReqParams, any, UpdateFeedbackReqBody>,
  res: Response
) => {
  const { feedback_id } = req.params
  const result = await feedbackService.updateFeedback(feedback_id, req.body)
  res.json({
    message: FEEDBACK_MESSAGES.UPDATE_FEEDBACK_SUCCESS,
    result
  })
}

export const updateFeedbackStatusController = async (
  req: Request<FeedbackIdReqParams, any, UpdateFeedbackStatusReqBody>,
  res: Response
) => {
  const { feedback_id } = req.params
  const result = await feedbackService.updateFeedbackStatus(feedback_id, req.body)
  res.json({
    message: FEEDBACK_MESSAGES.UPDATE_FEEDBACK_SUCCESS,
    result
  })
}

export const deleteFeedbackController = async (req: Request<FeedbackIdReqParams>, res: Response) => {
  const { feedback_id } = req.params
  const result = await feedbackService.deleteFeedback(feedback_id)
  res.json({
    message: FEEDBACK_MESSAGES.DELETE_FEEDBACK_SUCCESS,
    result
  })
}
