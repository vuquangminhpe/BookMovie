// src/controllers/staff/showtime.controllers.ts
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SHOWTIME_MESSAGES } from '../../../constants/messages'
import {
  CreateShowtimeReqBody,
  GetShowtimesReqQuery,
  ShowtimeIdReqParams,
  UpdateShowtimeReqBody
} from '../../../models/request/Showtime.request'
import staffShowtimeService from '~/services/Staff/showtime.services'
import { TokenPayload } from '~/models/request/User.request'

// Staff tạo showtime cho movies của mình
export const staffCreateShowtimeController = async (
  req: Request<ParamsDictionary, any, CreateShowtimeReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffShowtimeService.createShowtime(user_id, req.body)
  res.json({
    message: SHOWTIME_MESSAGES.CREATE_SHOWTIME_SUCCESS,
    result
  })
}

// Staff lấy danh sách showtimes cho movies của mình
export const staffGetMyShowtimesController = async (
  req: Request<ParamsDictionary, any, any, GetShowtimesReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffShowtimeService.getMyShowtimes(user_id, req.query)
  res.json({
    message: SHOWTIME_MESSAGES.GET_SHOWTIMES_SUCCESS,
    result
  })
}

// Staff lấy chi tiết showtime với ownership check
export const staffGetMyShowtimeByIdController = async (req: Request<ShowtimeIdReqParams>, res: Response) => {
  const { showtime_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffShowtimeService.getMyShowtimeById(user_id, showtime_id)
  res.json({
    message: SHOWTIME_MESSAGES.GET_SHOWTIME_SUCCESS,
    result
  })
}

// Staff cập nhật showtime với ownership check
export const staffUpdateMyShowtimeController = async (
  req: Request<ShowtimeIdReqParams, any, UpdateShowtimeReqBody>,
  res: Response
) => {
  const { showtime_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffShowtimeService.updateMyShowtime(user_id, showtime_id, req.body)
  res.json({
    message: SHOWTIME_MESSAGES.UPDATE_SHOWTIME_SUCCESS,
    result
  })
}

// Staff xóa showtime với ownership check
export const staffDeleteMyShowtimeController = async (req: Request<ShowtimeIdReqParams>, res: Response) => {
  const { showtime_id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload

  const result = await staffShowtimeService.deleteMyShowtime(user_id, showtime_id)
  res.json({
    message: SHOWTIME_MESSAGES.DELETE_SHOWTIME_SUCCESS,
    result
  })
}
