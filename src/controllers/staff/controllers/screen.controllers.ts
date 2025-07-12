import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SCREEN_MESSAGES } from '../../../constants/messages'
import {
  CreateScreenReqBody,
  GetScreensReqQuery,
  ScreenIdReqParams,
  UpdateScreenReqBody
} from '../../../models/request/Screen.request'
import { TokenPayload } from '~/models/request/User.request'
import staffScreenService from '~/services/Staff/screen.services'

// Staff tạo screen cho theater của mình
export const staffCreateScreenController = async (
  req: Request<ParamsDictionary, any, CreateScreenReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { theater_id } = req.params

  // Theater đã được validate trong middleware và attach vào req
  const theater = (req as any).theater

  const result = await staffScreenService.createScreenForMyTheater(user_id, theater_id, req.body)
  res.json({
    message: SCREEN_MESSAGES.CREATE_SCREEN_SUCCESS,
    result
  })
}

// Staff lấy danh sách screens của theater mình
export const staffGetMyTheaterScreensController = async (
  req: Request<ParamsDictionary, any, any, GetScreensReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { theater_id } = req.params

  const result = await staffScreenService.getMyTheaterScreens(user_id, theater_id, req.query)
  res.json({
    message: SCREEN_MESSAGES.GET_SCREENS_SUCCESS,
    result
  })
}

// Staff lấy chi tiết screen của theater mình
export const staffGetMyScreenByIdController = async (req: Request<ScreenIdReqParams>, res: Response) => {
  const { screen_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  // Screen và theater đã được validate trong middleware
  const screen = (req as any).screen
  const theater = (req as any).theater

  const result = await staffScreenService.getMyScreenById(user_id, screen_id)
  res.json({
    message: SCREEN_MESSAGES.GET_SCREEN_SUCCESS,
    result
  })
}

// Staff cập nhật screen của theater mình
export const staffUpdateMyScreenController = async (
  req: Request<ScreenIdReqParams, any, UpdateScreenReqBody>,
  res: Response
) => {
  const { screen_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  // Screen ownership đã được validate trong middleware
  const screen = (req as any).screen

  const result = await staffScreenService.updateMyScreen(user_id, screen_id, req.body)
  res.json({
    message: SCREEN_MESSAGES.UPDATE_SCREEN_SUCCESS,
    result
  })
}

// Staff xóa screen của theater mình
export const staffDeleteMyScreenController = async (req: Request<ScreenIdReqParams>, res: Response) => {
  const { screen_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  // Screen ownership và delete constraints đã được check trong middleware
  const deleteWarning = (req as any).deleteWarning

  const result = await staffScreenService.deleteMyScreen(user_id, screen_id)
  res.json({
    message: SCREEN_MESSAGES.DELETE_SCREEN_SUCCESS,
    result: {
      ...result,
      // Include warning message if any
      ...(deleteWarning && { warning: deleteWarning })
    }
  })
}

// Staff lấy thống kê screens của theater mình
export const staffGetMyScreenStatsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffScreenService.getMyScreenStats(user_id)
  res.json({
    message: 'Get my screen statistics success',
    result
  })
}
