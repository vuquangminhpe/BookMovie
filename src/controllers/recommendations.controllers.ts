import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import recommendationService from '../services/recommendation.services'

export const getPersonalizedRecommendationsController = async (req: Request, res: Response) => {
  const { user_id } = req.params
  const { limit, excludeIds } = req.query

  // Parse options from query parameters
  const options = {
    limit: limit ? parseInt(limit as string) : undefined,
    excludeIds: excludeIds ? (excludeIds as string).split(',') : undefined
  }

  try {
    const recommendations = await recommendationService.getPersonalizedRecommendations(user_id, options)

    return res.status(200).json({
      message: 'Get personalized recommendations successfully',
      result: recommendations
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Failed to get personalized recommendations'
    })
  }
}

export const getSimilarMoviesController = async (req: Request, res: Response) => {
  const { movie_id } = req.params
  const { limit, excludeIds } = req.query

  // Parse options from query parameters
  const options = {
    limit: limit ? parseInt(limit as string) : undefined,
    excludeIds: excludeIds ? (excludeIds as string).split(',') : undefined
  }

  try {
    const similarMovies = await recommendationService.getSimilarMovies(movie_id, options)

    return res.status(200).json({
      message: 'Get similar movies successfully',
      result: similarMovies
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Failed to get similar movies'
    })
  }
}

export const getPopularRecommendationsController = async (req: Request, res: Response) => {
  const { limit, excludeIds } = req.query

  // Parse options from query parameters
  const options = {
    limit: limit ? parseInt(limit as string) : undefined,
    excludeIds: excludeIds ? (excludeIds as string).split(',') : undefined
  }

  try {
    const popularMovies = await recommendationService.getPopularRecommendations(options)

    return res.status(200).json({
      message: 'Get popular movies successfully',
      result: popularMovies
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Failed to get popular movies'
    })
  }
}

export const getHighlyRatedMoviesController = async (req: Request, res: Response) => {
  const { limit, excludeIds } = req.query

  // Parse options from query parameters
  const options = {
    limit: limit ? parseInt(limit as string) : undefined,
    excludeIds: excludeIds ? (excludeIds as string).split(',') : undefined
  }

  try {
    const highlyRatedMovies = await recommendationService.getHighlyRatedMovies(options)

    return res.status(200).json({
      message: 'Get highly rated movies successfully',
      result: highlyRatedMovies
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || 'Failed to get highly rated movies'
    })
  }
}
