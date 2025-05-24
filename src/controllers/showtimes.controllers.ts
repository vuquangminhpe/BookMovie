import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { SHOWTIME_MESSAGES } from '../constants/messages'
import {
  CreateShowtimeReqBody,
  GetShowtimesReqQuery,
  ShowtimeIdReqParams,
  UpdateShowtimeReqBody
} from '../models/request/Showtime.request'
import showtimeService from '../services/showtime.services'
import seatLockService from '~/services/seat-lock.services'

export const createShowtimeController = async (
  req: Request<ParamsDictionary, any, CreateShowtimeReqBody>,
  res: Response
) => {
  const result = await showtimeService.createShowtime(req.body)
  res.json({
    message: SHOWTIME_MESSAGES.CREATE_SHOWTIME_SUCCESS,
    result
  })
}

export const getShowtimesController = async (
  req: Request<ParamsDictionary, any, any, GetShowtimesReqQuery>,
  res: Response
) => {
  const result = await showtimeService.getShowtimes(req.query)
  res.json({
    message: SHOWTIME_MESSAGES.GET_SHOWTIMES_SUCCESS,
    result
  })
}

export const getShowtimeByIdController = async (req: Request<ShowtimeIdReqParams>, res: Response) => {
  const { showtime_id } = req.params
  const result = await showtimeService.getShowtimeById(showtime_id)
  res.json({
    message: SHOWTIME_MESSAGES.GET_SHOWTIME_SUCCESS,
    result
  })
}

export const updateShowtimeController = async (
  req: Request<ShowtimeIdReqParams, any, UpdateShowtimeReqBody>,
  res: Response
) => {
  const { showtime_id } = req.params
  const result = await showtimeService.updateShowtime(showtime_id, req.body)
  res.json({
    message: SHOWTIME_MESSAGES.UPDATE_SHOWTIME_SUCCESS,
    result
  })
}

export const deleteShowtimeController = async (req: Request<ShowtimeIdReqParams>, res: Response) => {
  const { showtime_id } = req.params
  const result = await showtimeService.deleteShowtime(showtime_id)
  res.json({
    message: SHOWTIME_MESSAGES.DELETE_SHOWTIME_SUCCESS,
    result
  })
}
export const getShowtimeLockedSeatsController = async (req: Request<ShowtimeIdReqParams>, res: Response) => {
  const { showtime_id } = req.params
  const lockedSeats = await seatLockService.getLockedSeats(showtime_id)

  res.json({
    message: 'Get locked seats successfully',
    result: lockedSeats
  })
}
