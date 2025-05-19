import { Request, Response } from 'express'
import { FAVORITE_MESSAGES } from '../constants/messages'
import { TokenPayload } from '../models/request/User.request'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import favoriteService from '~/services/Favorite.services'

export const addFavoriteController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { movie_id } = req.body

  if (!movie_id) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: FAVORITE_MESSAGES.INVALID_MOVIE_ID
    })
  }

  try {
    const result = await favoriteService.addFavorite(user_id, movie_id)

    res.json({
      message: FAVORITE_MESSAGES.ADD_FAVORITE_SUCCESS,
      result
    })
  } catch (error) {
    if (error instanceof ErrorWithStatus) {
      return res.status(error.status).json({
        message: error.message
      })
    }
    throw error
  }
}

export const removeFavoriteController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { movie_id } = req.params

  try {
    const result = await favoriteService.removeFavorite(user_id, movie_id)

    res.json({
      message: FAVORITE_MESSAGES.REMOVE_FAVORITE_SUCCESS,
      result
    })
  } catch (error) {
    if (error instanceof ErrorWithStatus) {
      return res.status(error.status).json({
        message: error.message
      })
    }
    throw error
  }
}

export const getUserFavoritesController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const result = await favoriteService.getUserFavorites(user_id, page, limit)

  res.json({
    message: FAVORITE_MESSAGES.GET_FAVORITES_SUCCESS,
    result
  })
}

export const checkFavoriteStatusController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { movie_id } = req.params

  try {
    const result = await favoriteService.checkFavoriteStatus(user_id, movie_id)

    res.json({
      message: FAVORITE_MESSAGES.GET_FAVORITES_SUCCESS,
      result
    })
  } catch (error) {
    if (error instanceof ErrorWithStatus) {
      return res.status(error.status).json({
        message: error.message
      })
    }
    throw error
  }
}
