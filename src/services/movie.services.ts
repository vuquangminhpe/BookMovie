import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { CreateMovieReqBody, GetMoviesReqQuery, UpdateMovieReqBody } from '../models/request/Movie.request'
import Movie, { MovieStatus } from '../models/schemas/Movie.shema'
import feedbackService from './feedback.services'

class MovieService {
  async createMovie(payload: CreateMovieReqBody) {
    const movie_id = new ObjectId()
    await databaseService.movies.insertOne(
      new Movie({
        _id: movie_id,
        ...payload,
        status: payload.status || MovieStatus.COMING_SOON,
        release_date: new Date(payload.release_date)
      })
    )
    return { movie_id: movie_id.toString() }
  }

  async getMovies(query: GetMoviesReqQuery) {
    const {
      page = '1',
      limit = '10',
      status,
      genre,
      language,
      search,
      sort_by = 'release_date',
      sort_order = 'desc',
      release_date_from,
      release_date_to
    } = query

    const filter: any = {}

    // Filter by status
    if (status && Object.values(MovieStatus).includes(status as MovieStatus)) {
      filter.status = status
    }

    // Filter by genre
    if (genre) {
      filter.genre = genre
    }

    // Filter by language
    if (language) {
      filter.language = language
    }

    // Filter by release date range
    if (release_date_from || release_date_to) {
      filter.release_date = {}
      if (release_date_from) {
        filter.release_date.$gte = new Date(release_date_from)
      }
      if (release_date_to) {
        filter.release_date.$lte = new Date(release_date_to)
      }
    }

    // Search by title or description
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Create sort object
    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    // Get total count of movies matching the filter
    const totalMovies = await databaseService.movies.countDocuments(filter)

    // Get movies with pagination
    const movies = await databaseService.movies.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    return {
      movies,
      total: totalMovies,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalMovies / limitNum)
    }
  }

  async getMovieById(movie_id: string) {
    const movie = await databaseService.movies.findOne({ _id: new ObjectId(movie_id) })
    return movie
  }

  async updateMovie(movie_id: string, payload: UpdateMovieReqBody) {
    const updateData: any = { ...payload }

    // Convert release_date string to Date if provided
    if (payload.release_date) {
      updateData.release_date = new Date(payload.release_date)
    }

    await databaseService.movies.updateOne(
      { _id: new ObjectId(movie_id) },
      {
        $set: updateData,
        $currentDate: {
          updated_at: true
        }
      }
    )
    return { movie_id }
  }

  async deleteMovie(movie_id: string) {
    await databaseService.movies.deleteOne({ _id: new ObjectId(movie_id) })
    return { movie_id }
  }
  async getMovieRatings(movie_id: string, page: number = 1, limit: number = 10) {
    const filter = { movie_id: new ObjectId(movie_id) }

    const skip = (page - 1) * limit

    const totalRatings = await databaseService.ratings.countDocuments(filter)

    const ratings = await databaseService.ratings
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const enhancedRatings = await Promise.all(
      ratings.map(async (rating) => {
        const user = await databaseService.users.findOne(
          { _id: rating.user_id },
          { projection: { _id: 1, name: 1, username: 1, avatar: 1 } }
        )

        return {
          ...rating,
          user: user || null
        }
      })
    )

    return {
      ratings: enhancedRatings,
      total: totalRatings,
      page,
      limit,
      total_pages: Math.ceil(totalRatings / limit)
    }
  }
  async getMovieFeedbacks(movie_id: string, page: number = 1, limit: number = 10, includeAll: boolean = false) {
    return feedbackService.getMovieFeedbacks(movie_id, page, limit, !includeAll)
  }
  async getFeaturedMovies() {
    const featuredMovies = await databaseService.movies
      .find({
        is_featured: true
      })
      .sort({
        featured_order: 1,
        created_at: -1
      })
      .toArray()

    return featuredMovies
  }
  async getNowShowingMovies(
    page: number = 1,
    limit: number = 10,
    sort_by: string = 'release_date',
    sort_order: 'asc' | 'desc' = 'desc'
  ) {
    const filter = { status: MovieStatus.NOW_SHOWING }
    const skip = (page - 1) * limit

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalMovies = await databaseService.movies.countDocuments(filter)

    const movies = await databaseService.movies.find(filter).sort(sortObj).skip(skip).limit(limit).toArray()

    return {
      movies,
      total: totalMovies,
      page,
      limit,
      total_pages: Math.ceil(totalMovies / limit)
    }
  }

  async getComingSoonMovies(
    page: number = 1,
    limit: number = 10,
    sort_by: string = 'release_date',
    sort_order: 'asc' | 'desc' = 'asc'
  ) {
    const filter = {
      status: MovieStatus.COMING_SOON,
      release_date: { $gte: new Date() }
    }
    const skip = (page - 1) * limit

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalMovies = await databaseService.movies.countDocuments(filter)

    const movies = await databaseService.movies.find(filter).sort(sortObj).skip(skip).limit(limit).toArray()

    return {
      movies,
      total: totalMovies,
      page,
      limit,
      total_pages: Math.ceil(totalMovies / limit)
    }
  }

  async getTopRatedMovies(limit: number = 10, min_ratings_count: number = 5, time_period?: string) {
    const filter: any = {
      ratings_count: { $gte: min_ratings_count },
      average_rating: { $gt: 0 }
    }

    // Add time period filter if specified
    if (time_period && time_period !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (time_period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      filter.release_date = { $gte: startDate }
    }

    const movies = await databaseService.movies
      .find(filter)
      .sort({
        average_rating: -1,
        ratings_count: -1,
        release_date: -1
      })
      .limit(limit)
      .toArray()

    return movies
  }

  async getTrendingMovies(limit: number = 10, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get movies with recent activity (ratings, bookings)
    const trendingMovies = await databaseService.movies
      .aggregate([
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'recent_ratings'
          }
        },
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'recent_bookings'
          }
        },
        {
          $addFields: {
            recent_ratings_count: {
              $size: {
                $filter: {
                  input: '$recent_ratings',
                  cond: { $gte: ['$$this.created_at', startDate] }
                }
              }
            },
            recent_bookings_count: {
              $size: {
                $filter: {
                  input: '$recent_bookings',
                  cond: { $gte: ['$$this.booking_time', startDate] }
                }
              }
            }
          }
        },
        {
          $addFields: {
            trending_score: {
              $add: [
                { $multiply: ['$recent_ratings_count', 2] },
                { $multiply: ['$recent_bookings_count', 3] },
                { $multiply: ['$average_rating', 1] }
              ]
            }
          }
        },
        { $match: { trending_score: { $gt: 0 } } },
        { $sort: { trending_score: -1 } },
        { $limit: limit },
        {
          $project: {
            recent_ratings: 0,
            recent_bookings: 0,
            recent_ratings_count: 0,
            recent_bookings_count: 0,
            trending_score: 0
          }
        }
      ])
      .toArray()

    return trendingMovies
  }

  async getMoviesByGenre(
    genre: string,
    page: number = 1,
    limit: number = 10,
    sort_by: string = 'release_date',
    sort_order: 'asc' | 'desc' = 'desc'
  ) {
    const filter = { genre: { $in: [genre] } }
    const skip = (page - 1) * limit

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalMovies = await databaseService.movies.countDocuments(filter)

    const movies = await databaseService.movies.find(filter).sort(sortObj).skip(skip).limit(limit).toArray()

    return {
      movies,
      total: totalMovies,
      page,
      limit,
      total_pages: Math.ceil(totalMovies / limit),
      genre
    }
  }

  async getPopularMovies(limit: number = 10, time_period: string = 'month') {
    const now = new Date()
    let startDate: Date

    switch (time_period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get popular movies based on bookings in the time period
    const popularMovies = await databaseService.movies
      .aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'bookings'
          }
        },
        {
          $addFields: {
            recent_bookings: {
              $filter: {
                input: '$bookings',
                cond: {
                  $and: [{ $gte: ['$$this.booking_time', startDate] }, { $ne: ['$$this.status', 'cancelled'] }]
                }
              }
            }
          }
        },
        {
          $addFields: {
            popularity_score: { $size: '$recent_bookings' }
          }
        },
        { $match: { popularity_score: { $gt: 0 } } },
        { $sort: { popularity_score: -1, average_rating: -1 } },
        { $limit: limit },
        {
          $project: {
            bookings: 0,
            recent_bookings: 0,
            popularity_score: 0
          }
        }
      ])
      .toArray()

    return popularMovies
  }

  async getRecentlyAddedMovies(limit: number = 10, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const movies = await databaseService.movies
      .find({
        created_at: { $gte: startDate }
      })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    return movies
  }

  async getMoviesWithShowtimes(
    city?: string,
    date?: string,
    theater_id?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'showtimes',
          localField: '_id',
          foreignField: 'movie_id',
          as: 'showtimes'
        }
      }
    ]

    // Filter showtimes based on criteria
    const showtimeFilter: any = {
      start_time: { $gte: new Date() },
      status: { $nin: ['cancelled', 'completed'] }
    }

    if (date) {
      const queryDate = new Date(date)
      const nextDay = new Date(queryDate)
      nextDay.setDate(nextDay.getDate() + 1)

      showtimeFilter.start_time = {
        $gte: queryDate,
        $lt: nextDay
      }
    }

    if (theater_id) {
      showtimeFilter.theater_id = new ObjectId(theater_id)
    }

    if (city) {
      pipeline.push({
        $lookup: {
          from: 'theaters',
          localField: 'showtimes.theater_id',
          foreignField: '_id',
          as: 'theaters'
        }
      })

      pipeline.push({
        $match: {
          'theaters.city': { $regex: city, $options: 'i' }
        }
      })
    }

    pipeline.push(
      {
        $addFields: {
          filtered_showtimes: {
            $filter: {
              input: '$showtimes',
              cond: {
                $and: Object.entries(showtimeFilter).map(([key, value]) => {
                  if (
                    key === 'start_time' &&
                    value !== null &&
                    typeof value === 'object' &&
                    '$gte' in value &&
                    '$lt' in value
                  ) {
                    return {
                      $and: [{ $gte: [`$$this.${key}`, value.$gte] }, { $lt: [`$$this.${key}`, value.$lt] }]
                    }
                  }
                  return { $eq: [`$$this.${key}`, value] }
                })
              }
            }
          }
        }
      },
      {
        $match: {
          'filtered_showtimes.0': { $exists: true }
        }
      },
      { $sort: { title: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          showtimes: 0,
          theaters: 0,
          filtered_showtimes: 0
        }
      }
    )

    const [movies, totalCount] = await Promise.all([
      databaseService.movies.aggregate(pipeline).toArray(),
      databaseService.movies
        .aggregate([
          ...pipeline.slice(0, -3), // Remove skip, limit, project
          { $count: 'total' }
        ])
        .toArray()
    ])

    return {
      movies,
      total: totalCount[0]?.total || 0,
      page,
      limit,
      total_pages: Math.ceil((totalCount[0]?.total || 0) / limit)
    }
  }

  async searchMovies(query: string, filters: any, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const searchFilter: any = {}

    // Text search
    if (query) {
      searchFilter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { director: { $regex: query, $options: 'i' } },
        { 'cast.name': { $regex: query, $options: 'i' } }
      ]
    }

    // Apply filters
    if (filters.genre) {
      searchFilter.genre = { $in: [filters.genre] }
    }

    if (filters.year) {
      const startDate = new Date(filters.year, 0, 1)
      const endDate = new Date(filters.year + 1, 0, 1)
      searchFilter.release_date = { $gte: startDate, $lt: endDate }
    }

    if (filters.language) {
      searchFilter.language = filters.language
    }

    if (filters.rating_min || filters.rating_max) {
      searchFilter.average_rating = {}
      if (filters.rating_min) searchFilter.average_rating.$gte = filters.rating_min
      if (filters.rating_max) searchFilter.average_rating.$lte = filters.rating_max
    }

    if (filters.duration_min || filters.duration_max) {
      searchFilter.duration = {}
      if (filters.duration_min) searchFilter.duration.$gte = filters.duration_min
      if (filters.duration_max) searchFilter.duration.$lte = filters.duration_max
    }

    const totalMovies = await databaseService.movies.countDocuments(searchFilter)

    const movies = await databaseService.movies
      .find(searchFilter)
      .sort({ average_rating: -1, ratings_count: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return {
      movies,
      total: totalMovies,
      page,
      limit,
      total_pages: Math.ceil(totalMovies / limit),
      query,
      filters
    }
  }

  async getMovieStats() {
    const [
      totalMovies,
      nowShowingCount,
      comingSoonCount,
      endedCount,
      totalRatings,
      avgRating,
      genreStats,
      languageStats,
      recentActivity
    ] = await Promise.all([
      databaseService.movies.countDocuments(),
      databaseService.movies.countDocuments({ status: MovieStatus.NOW_SHOWING }),
      databaseService.movies.countDocuments({ status: MovieStatus.COMING_SOON }),
      databaseService.movies.countDocuments({ status: MovieStatus.ENDED }),
      databaseService.ratings.countDocuments(),
      databaseService.ratings.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]).toArray(),
      databaseService.movies
        .aggregate([{ $unwind: '$genre' }, { $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
        .toArray(),
      databaseService.movies
        .aggregate([{ $group: { _id: '$language', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
        .toArray(),
      databaseService.movies.countDocuments({
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ])

    return {
      total_movies: totalMovies,
      by_status: {
        now_showing: nowShowingCount,
        coming_soon: comingSoonCount,
        ended: endedCount
      },
      ratings: {
        total_ratings: totalRatings,
        average_rating: avgRating[0]?.avgRating || 0
      },
      genres: genreStats,
      languages: languageStats,
      recent_additions: recentActivity
    }
  }

  async getAvailableGenres() {
    const genres = await databaseService.movies
      .aggregate([{ $unwind: '$genre' }, { $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray()

    return genres.map((g) => ({ name: g._id, count: g.count }))
  }

  async getAvailableLanguages() {
    const languages = await databaseService.movies
      .aggregate([{ $group: { _id: '$language', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray()

    return languages.map((l) => ({ code: l._id, count: l.count }))
  }

  async getTopRevenueMovies(limit: number = 3) {
    // Tính tổng doanh thu cho mỗi phim từ bảng bookings
    const movies = await databaseService.movies
      .aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'movie_id',
            as: 'bookings'
          }
        },
        {
          $addFields: {
            total_revenue: {
              $sum: {
                $map: {
                  input: '$bookings',
                  as: 'booking',
                  in: {
                    $cond: [
                      { $eq: ['$$booking.status', 'confirmed'] },
                      '$$booking.total_price',
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        { $sort: { total_revenue: -1 } },
        { $limit: limit },
        {
          $project: {
            bookings: 0
          }
        }
      ])
      .toArray()

    return movies
  }
}

const movieService = new MovieService()
export default movieService
