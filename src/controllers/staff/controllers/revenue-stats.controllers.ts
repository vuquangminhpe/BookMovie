import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RevenueStatsReqQuery } from '../../../models/request/Revenue.request'
import staffRevenueStatsService from '../../../services/Staff/revenue-stats.services'
import { TokenPayload } from '../../../models/request/User.request'

export const getRevenueStatsController = async (
  req: Request<ParamsDictionary, any, any, RevenueStatsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  
  const result = await staffRevenueStatsService.getRevenueStats(user_id, req.query)
  
  res.json({
    message: 'Get revenue statistics success',
    result
  })
}
