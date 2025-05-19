import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RATING_MESSAGES } from '../constants/messages'
import {
  CreateRatingReqBody,
  GetRatingsReqQuery,
  RatingIdReqParams,
  UpdateRatingReqBody
} from '../models/request/Rating.request'
import { TokenPayload } from '../models/request/User.request'
import ratingService from '../services/rating.services'

export const createRatingController = async (
  req: Request<ParamsDictionary, any, CreateRatingReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await ratingService.createRating(user_id, req.body)
  res.json({
    message: RATING_MESSAGES.CREATE_RATING_SUCCESS,
    result
  })
}

export const getRatingsController = async (
  req: Request<ParamsDictionary, any, any, GetRatingsReqQuery>,
  res: Response
) => {
  const result = await ratingService.getRatings(req.query)
  res.json({
    message: RATING_MESSAGES.GET_RATINGS_SUCCESS,
    result
  })
}

export const getRatingByIdController = async (req: Request<RatingIdReqParams>, res: Response) => {
  const { rating_id } = req.params
  const result = await ratingService.getRatingById(rating_id)
  res.json({
    message: RATING_MESSAGES.GET_RATING_SUCCESS,
    result
  })
}

export const updateRatingController = async (
  req: Request<RatingIdReqParams, any, UpdateRatingReqBody>,
  res: Response
) => {
  const { rating_id } = req.params
  const result = await ratingService.updateRating(rating_id, req.body)
  res.json({
    message: RATING_MESSAGES.UPDATE_RATING_SUCCESS,
    result
  })
}

export const deleteRatingController = async (req: Request<RatingIdReqParams>, res: Response) => {
  const { rating_id } = req.params
  const result = await ratingService.deleteRating(rating_id)
  res.json({
    message: RATING_MESSAGES.DELETE_RATING_SUCCESS,
    result
  })
}
