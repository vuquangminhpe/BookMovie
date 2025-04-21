import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SCREEN_MESSAGES } from '../constants/messages'
import {
  CreateScreenReqBody,
  GetScreensReqQuery,
  ScreenIdReqParams,
  UpdateScreenReqBody
} from '../models/request/Screen.request'
import screenService from '../services/screen.services'

export const createScreenController = async (
  req: Request<ParamsDictionary, any, CreateScreenReqBody>,
  res: Response
) => {
  const result = await screenService.createScreen(req.body)
  res.json({
    message: SCREEN_MESSAGES.CREATE_SCREEN_SUCCESS,
    result
  })
}

export const getScreensController = async (
  req: Request<ParamsDictionary, any, any, GetScreensReqQuery>,
  res: Response
) => {
  const result = await screenService.getScreens(req.query)
  res.json({
    message: SCREEN_MESSAGES.GET_SCREENS_SUCCESS,
    result
  })
}

export const getScreenByIdController = async (req: Request<ScreenIdReqParams>, res: Response) => {
  const { screen_id } = req.params
  const result = await screenService.getScreenById(screen_id)
  res.json({
    message: SCREEN_MESSAGES.GET_SCREEN_SUCCESS,
    result
  })
}

export const updateScreenController = async (
  req: Request<ScreenIdReqParams, any, UpdateScreenReqBody>,
  res: Response
) => {
  const { screen_id } = req.params
  const result = await screenService.updateScreen(screen_id, req.body)
  res.json({
    message: SCREEN_MESSAGES.UPDATE_SCREEN_SUCCESS,
    result
  })
}

export const deleteScreenController = async (req: Request<ScreenIdReqParams>, res: Response) => {
  const { screen_id } = req.params
  const result = await screenService.deleteScreen(screen_id)
  res.json({
    message: SCREEN_MESSAGES.DELETE_SCREEN_SUCCESS,
    result
  })
}
