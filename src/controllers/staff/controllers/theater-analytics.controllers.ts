import { Request, Response } from 'express'
import { TokenPayload } from '../../../models/request/User.request'
import theaterAnalyticsService from '../../../services/Staff/theater-analytics.services'
import HTTP_STATUS from '../../../constants/httpStatus'

export const getMyTheaterAnalyticsController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.decode_authorization as TokenPayload
    
    const result = await theaterAnalyticsService.getMyTheaterAnalytics(user_id)
    
    res.json({
      message: 'Get theater analytics success',
      result
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No theater found for this user') {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'No theater found. Please create your theater first.',
        result: null
      })
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      result: null
    })
  }
}

export const getAllTheatersAnalyticsController = async (req: Request, res: Response) => {
  try {
    const result = await theaterAnalyticsService.getAllTheatersRevenueAndCustomers()
    
    res.json({
      message: 'Get all theaters analytics success',
      result
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      result: null
    })
  }
}

export const getTheaterAnalyticsByIdController = async (req: Request, res: Response) => {
  try {
    const { theater_id } = req.params
    
    const result = await theaterAnalyticsService.getTheaterRevenueAndCustomers(theater_id)
    
    res.json({
      message: 'Get theater analytics success',
      result
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      result: null
    })
  }
}