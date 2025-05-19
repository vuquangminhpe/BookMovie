import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { MovieStatus } from '../models/schemas/Movie.shema'

interface RecommendationOptions {
  limit?: number
  excludeIds?: string[]
}

class RecommendationService {
  async getPersonalizedRecommendations(user_id: string, options: RecommendationOptions = {}) {
    const { limit = 10, excludeIds = [] } = options

    // Convert exclusion IDs to ObjectIds
    const excludeObjectIds = excludeIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))

    // Get user's movie interactions
    const [userBookings, userRatings, userFavorites] = await Promise.all([
      // Movies user has watched (from bookings)
      databaseService.bookings
        .find({ user_id: new ObjectId(user_id) })
        .toArray()
        .then((bookings) => bookings.map((b) => b.movie_id)),

      // Movies user has rated
      databaseService.ratings.find({ user_id: new ObjectId(user_id) }).toArray(),

      // Movies user has favorited
      databaseService.favorites
        .find({ user_id: new ObjectId(user_id) })
        .toArray()
        .then((favorites) => favorites.map((f) => f.movie_id))
    ])

    // Get unique movie IDs that user has interacted with
    const userInteractedMovieIds = Array.from(
      new Set([...userBookings, ...userRatings.map((r) => r.movie_id), ...userFavorites].map((id) => id.toString()))
    ).map((id) => new ObjectId(id))

    // Get details of movies user has interacted with
    const userMovies = await databaseService.movies.find({ _id: { $in: userInteractedMovieIds } }).toArray()

    // If user doesn't have enough interactions, mix with popular movies
    if (userMovies.length < 3) {
      return this.getPopularRecommendations({
        limit,
        excludeIds: excludeIds.concat(userInteractedMovieIds.map((id) => id.toString()))
      })
    }

    // Extract genres that user seems to prefer
    const genreFrequency: Record<string, number> = {}

    // Count genre occurrences, giving higher weight to highly rated and favorited movies
    userMovies.forEach((movie) => {
      const rating = userRatings.find((r) => r.movie_id.equals(movie._id))
      const isFavorite = userFavorites.some((f) => f.equals(movie._id))

      // Calculate weight: base is 1, +1 if rated above 3, +2 if favorite
      let weight = 1
      if (rating && rating.rating > 3) weight += 1
      if (isFavorite) weight += 2

      movie.genre.forEach((genre) => {
        genreFrequency[genre] = (genreFrequency[genre] || 0) + weight
      })
    })

    // Sort genres by frequency
    const preferredGenres = Object.entries(genreFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 5) // Top 5 genres

    // Find movies of preferred genres that user hasn't watched
    // We use $in for first genre match and $all would be too restrictive
    const recommendedMovies = await databaseService.movies
      .find({
        _id: { $nin: [...userInteractedMovieIds, ...excludeObjectIds] },
        genre: { $in: preferredGenres },
        status: MovieStatus.NOW_SHOWING
      })
      .limit(limit)
      .toArray()

    // If we don't have enough recommendations, add popular movies
    if (recommendedMovies.length < limit) {
      const additionalMovies = await this.getPopularRecommendations({
        limit: limit - recommendedMovies.length,
        excludeIds: excludeIds
          .concat(userInteractedMovieIds.map((id) => id.toString()))
          .concat(recommendedMovies.map((m) => m._id.toString()))
      })

      recommendedMovies.push(...additionalMovies)
    }

    return recommendedMovies
  }

  // Get recommendations based on a specific movie
  async getSimilarMovies(movie_id: string, options: RecommendationOptions = {}) {
    const { limit = 10, excludeIds = [] } = options

    if (!ObjectId.isValid(movie_id)) {
      throw new Error('Invalid movie ID')
    }

    // Convert exclusion IDs to ObjectIds
    const excludeObjectIds = excludeIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))

    // Add current movie to exclusions
    excludeObjectIds.push(new ObjectId(movie_id))

    // Get the movie
    const movie = await databaseService.movies.findOne({ _id: new ObjectId(movie_id) })

    if (!movie) {
      throw new Error('Movie not found')
    }

    // Find movies with similar genres
    const similarMovies = await databaseService.movies
      .find({
        _id: { $nin: excludeObjectIds },
        genre: { $in: movie.genre },
        status: MovieStatus.NOW_SHOWING
      })
      .limit(limit)
      .toArray()

    // If we don't have enough recommendations, add popular movies
    if (similarMovies.length < limit) {
      const additionalMovies = await this.getPopularRecommendations({
        limit: limit - similarMovies.length,
        excludeIds: excludeIds.concat(similarMovies.map((m) => m._id.toString()))
      })

      similarMovies.push(...additionalMovies)
    }

    return similarMovies
  }

  // Get popular movies based on rating and booking count
  async getPopularRecommendations(options: RecommendationOptions = {}) {
    const { limit = 10, excludeIds = [] } = options

    // Convert exclusion IDs to ObjectIds
    const excludeObjectIds = excludeIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))

    // Get top-rated movies
    const popularMovies = await databaseService.movies
      .find({
        _id: { $nin: excludeObjectIds },
        status: MovieStatus.NOW_SHOWING,
        ratings_count: { $gt: 0 }
      })
      .sort({ average_rating: -1, ratings_count: -1 })
      .limit(limit)
      .toArray()

    // If we don't have enough, get movies with most bookings
    if (popularMovies.length < limit) {
      // Movies already included
      const includedMovieIds = popularMovies.map((m) => m._id)

      // Get movies with most bookings
      const bookingAggregate = await databaseService.bookings
        .aggregate([
          {
            $group: {
              _id: '$movie_id',
              booking_count: { $sum: 1 }
            }
          },
          {
            $sort: { booking_count: -1 }
          },
          {
            $limit: limit * 2 // Get more than needed to filter
          }
        ])
        .toArray()

      // Filter out excluded movies and those already included
      const additionalMovieIds = bookingAggregate
        .filter(
          (item) =>
            !excludeObjectIds.some((id) => id.equals(item._id)) && !includedMovieIds.some((id) => id.equals(item._id))
        )
        .map((item) => item._id)
        .slice(0, limit - popularMovies.length)

      if (additionalMovieIds.length > 0) {
        const additionalMovies = await databaseService.movies
          .find({
            _id: { $in: additionalMovieIds },
            status: MovieStatus.NOW_SHOWING
          })
          .toArray()

        popularMovies.push(...additionalMovies)
      }
    }

    // If still not enough, get recent movies
    if (popularMovies.length < limit) {
      // Movies already included
      const includedMovieIds = popularMovies.map((m) => m._id)

      const recentMovies = await databaseService.movies
        .find({
          _id: {
            $nin: [...excludeObjectIds, ...includedMovieIds]
          },
          status: MovieStatus.NOW_SHOWING
        })
        .sort({ release_date: -1 })
        .limit(limit - popularMovies.length)
        .toArray()

      popularMovies.push(...recentMovies)
    }

    return popularMovies
  }

  // Get highly rated movies
  async getHighlyRatedMovies(options: RecommendationOptions = {}) {
    const { limit = 10, excludeIds = [] } = options

    // Convert exclusion IDs to ObjectIds
    const excludeObjectIds = excludeIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))

    // Get highly rated movies with a minimum number of ratings
    const highlyRatedMovies = await databaseService.movies
      .find({
        _id: { $nin: excludeObjectIds },
        status: MovieStatus.NOW_SHOWING,
        ratings_count: { $gte: 5 },
        average_rating: { $gte: 4 }
      })
      .sort({ average_rating: -1, ratings_count: -1 })
      .limit(limit)
      .toArray()

    return highlyRatedMovies
  }
}

const recommendationService = new RecommendationService()
export default recommendationService
