import { Request, Response, NextFunction } from 'express'
import partnerService from '../services/partner.services'
import { PARTNER_MESSAGES } from '../constants/messages'
import {
  CreatePartnerReqBody,
  UpdatePartnerReqBody,
  PartnerIdReqParams,
  GetPartnersReqQuery,
  CreatePartnerMovieReqBody,
  UpdatePartnerMovieReqBody,
  GetPartnerMoviesReqQuery
} from '../models/request/Partner.request'

export const createPartnerController = async (
  req: Request<{}, any, CreatePartnerReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.createPartner(req.body)
    res.json({
      message: PARTNER_MESSAGES.CREATE_PARTNER_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const getPartnersController = async (
  req: Request<{}, any, any, GetPartnersReqQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.getPartners(req.query)
    res.json({
      message: PARTNER_MESSAGES.GET_PARTNERS_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const getPartnerController = async (req: Request<PartnerIdReqParams>, res: Response, next: NextFunction) => {
  try {
    const result = await partnerService.getPartnerById(req.params.partner_id)
    res.json({
      message: PARTNER_MESSAGES.GET_PARTNER_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const updatePartnerController = async (
  req: Request<PartnerIdReqParams, any, UpdatePartnerReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.updatePartner(req.params.partner_id, req.body)
    res.json({
      message: PARTNER_MESSAGES.UPDATE_PARTNER_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const deletePartnerController = async (req: Request<PartnerIdReqParams>, res: Response, next: NextFunction) => {
  try {
    const result = await partnerService.deletePartner(req.params.partner_id)
    res.json({
      message: PARTNER_MESSAGES.DELETE_PARTNER_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

// =============================================================================
// PARTNER MOVIE MANAGEMENT CONTROLLERS
// =============================================================================

export const createPartnerMovieController = async (
  req: Request<PartnerIdReqParams, any, CreatePartnerMovieReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.createPartnerMovie(req.params.partner_id, req.body)
    res.json({
      message: PARTNER_MESSAGES.CREATE_MOVIE_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const getPartnerMoviesController = async (
  req: Request<PartnerIdReqParams, any, any, GetPartnerMoviesReqQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.getPartnerMovies(req.params.partner_id, req.query)
    res.json({
      message: PARTNER_MESSAGES.GET_MOVIES_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const updatePartnerMovieController = async (
  req: Request<PartnerIdReqParams & { movie_id: string }, any, UpdatePartnerMovieReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.updatePartnerMovie(req.params.partner_id, req.params.movie_id, req.body)
    res.json({
      message: PARTNER_MESSAGES.UPDATE_MOVIE_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const deletePartnerMovieController = async (
  req: Request<PartnerIdReqParams & { movie_id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await partnerService.deletePartnerMovie(req.params.partner_id, req.params.movie_id)
    res.json({
      message: PARTNER_MESSAGES.DELETE_MOVIE_SUCCESS,
      result
    })
  } catch (error) {
    next(error)
  }
}
