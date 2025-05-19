import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { COUPON_MESSAGES } from '../constants/messages'
import { TokenPayload } from '../models/request/User.request'
import HTTP_STATUS from '../constants/httpStatus'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import couponService from '~/services/coupons.controllers'

// Admin controllers
export const createCouponController = async (req: Request, res: Response) => {
  const result = await couponService.createCoupon(req.body)
  res.json({
    message: COUPON_MESSAGES.CREATE_COUPON_SUCCESS,
    result
  })
}

export const getCouponsController = async (req: Request, res: Response) => {
  const result = await couponService.getCoupons(req.query)
  res.json({
    message: COUPON_MESSAGES.GET_COUPONS_SUCCESS,
    result
  })
}

export const getCouponByIdController = async (req: Request, res: Response) => {
  const { coupon_id } = req.params
  const result = await couponService.getCouponById(coupon_id)
  res.json({
    message: COUPON_MESSAGES.GET_COUPON_SUCCESS,
    result
  })
}

export const updateCouponController = async (req: Request, res: Response) => {
  const { coupon_id } = req.params
  const result = await couponService.updateCoupon(coupon_id, req.body)
  res.json({
    message: COUPON_MESSAGES.UPDATE_COUPON_SUCCESS,
    result
  })
}

export const deleteCouponController = async (req: Request, res: Response) => {
  const { coupon_id } = req.params
  const result = await couponService.deleteCoupon(coupon_id)
  res.json({
    message: COUPON_MESSAGES.DELETE_COUPON_SUCCESS,
    result
  })
}

// User controllers
export const validateCouponController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { code, movie_id, theater_id, total_amount } = req.body

  if (!code) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: COUPON_MESSAGES.COUPON_CODE_REQUIRED
    })
  }

  if (!movie_id || !theater_id || !total_amount) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Missing required booking data'
    })
  }

  // Validate IDs
  if (!ObjectId.isValid(movie_id) || !ObjectId.isValid(theater_id)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid movie or theater ID'
    })
  }

  // Validate total_amount
  if (typeof total_amount !== 'number' || total_amount <= 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid total amount'
    })
  }

  try {
    const result = await couponService.validateCoupon(code, user_id, {
      movie_id,
      theater_id,
      total_amount
    })

    res.json({
      message: COUPON_MESSAGES.COUPON_APPLIED,
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

export const getUserCouponsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await couponService.getUserCoupons(user_id)
  res.json({
    message: COUPON_MESSAGES.GET_COUPONS_SUCCESS,
    result
  })
}

// This controller would be used during the booking process
export const applyCouponController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { code, booking_id, discount_amount } = req.body

  if (!code) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: COUPON_MESSAGES.COUPON_CODE_REQUIRED
    })
  }

  if (!booking_id || !ObjectId.isValid(booking_id)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid booking ID'
    })
  }

  if (typeof discount_amount !== 'number' || discount_amount < 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid discount amount'
    })
  }

  try {
    const result = await couponService.applyCoupon(code, user_id, booking_id, discount_amount)
    res.json({
      message: COUPON_MESSAGES.COUPON_APPLIED,
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
