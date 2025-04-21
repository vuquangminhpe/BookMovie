import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { THEATER_MESSAGES } from '../constants/messages'
import {
  CreateTheaterReqBody,
  GetTheatersReqQuery,
  TheaterIdReqParams,
  UpdateTheaterReqBody
} from '../models/request/Theater.request'
import theaterService from '../services/theater.services'

export const createTheaterController = async (
  req: Request<ParamsDictionary, any, CreateTheaterReqBody>,
  res: Response
) => {
  const result = await theaterService.createTheater(req.body)
  res.json({
    message: THEATER_MESSAGES.CREATE_THEATER_SUCCESS,
    result
  })
}

export const getTheatersController = async (
  req: Request<ParamsDictionary, any, any, GetTheatersReqQuery>,
  res: Response
) => {
  const result = await theaterService.getTheaters(req.query)
  res.json({
    message: THEATER_MESSAGES.GET_THEATERS_SUCCESS,
    result
  })
}

export const getTheaterByIdController = async (req: Request<TheaterIdReqParams>, res: Response) => {
  const { theater_id } = req.params
  const result = await theaterService.getTheaterById(theater_id)
  res.json({
    message: THEATER_MESSAGES.GET_THEATER_SUCCESS,
    result
  })
}

export const updateTheaterController = async (
  req: Request<TheaterIdReqParams, any, UpdateTheaterReqBody>,
  res: Response
) => {
  const { theater_id } = req.params
  const result = await theaterService.updateTheater(theater_id, req.body)
  res.json({
    message: THEATER_MESSAGES.UPDATE_THEATER_SUCCESS,
    result
  })
}

export const deleteTheaterController = async (req: Request<TheaterIdReqParams>, res: Response) => {
  const { theater_id } = req.params
  const result = await theaterService.deleteTheater(theater_id)
  res.json({
    message: THEATER_MESSAGES.DELETE_THEATER_SUCCESS,
    result
  })
}
