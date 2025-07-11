import { ObjectId } from 'mongodb'
import { CreateMovieReqBody, GetMoviesReqQuery, UpdateMovieReqBody } from '../../models/request/Movie.request'
import Movie, { MovieStatus } from '~/models/schemas/Movie.shema'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import feedbackService from '~/services/feedback.services'

class StaffMovieService {
  // Staff tạo movie với ownership
  async createMovie(staff_id: string, payload: CreateMovieReqBody) {
    const movie_id = new ObjectId()

    const movieData = {
      _id: movie_id,
      ...payload,
      status: payload.status || MovieStatus.COMING_SOON,
      release_date: new Date(payload.release_date),
      created_by: new ObjectId(staff_id) // Gán staff làm người tạo
    }

    await databaseService.movies.insertOne(new Movie(movieData))
    return { movie_id: movie_id.toString() }
  }

  // Staff chỉ xem movies của mình
  async getMyMovies(staff_id: string, query: GetMoviesReqQuery) {
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

    const filter: any = {
      created_by: new ObjectId(staff_id) // Chỉ lấy movies của staff này
    }

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

    // Enrich with creator info
    const enrichedMovies = await Promise.all(
      movies.map(async (movie) => {
        const creator = await databaseService.users.findOne(
          { _id: movie.created_by },
          { projection: { _id: 1, name: 1, email: 1 } }
        )
        return {
          ...movie,
          creator: creator || null
        }
      })
    )

    return {
      movies: enrichedMovies,
      total: totalMovies,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalMovies / limitNum)
    }
  }

  // Staff lấy movie by ID với ownership check
  async getMyMovieById(staff_id: string, movie_id: string) {
    if (!ObjectId.isValid(movie_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid movie ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const movie = await databaseService.movies.findOne({
      _id: new ObjectId(movie_id),
      created_by: new ObjectId(staff_id)
    })

    if (!movie) {
      throw new ErrorWithStatus({
        message: 'Movie not found or you do not have permission to access this movie',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Get creator info
    const creator = await databaseService.users.findOne(
      { _id: movie.created_by },
      { projection: { _id: 1, name: 1, email: 1 } }
    )

    return {
      ...movie,
      creator: creator || null
    }
  }

  // Staff update movie với ownership check
  async updateMyMovie(staff_id: string, movie_id: string, payload: UpdateMovieReqBody) {
    if (!ObjectId.isValid(movie_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid movie ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check ownership
    const movie = await databaseService.movies.findOne({
      _id: new ObjectId(movie_id),
      created_by: new ObjectId(staff_id)
    })

    if (!movie) {
      throw new ErrorWithStatus({
        message: 'Movie not found or you do not have permission to update this movie',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const updateData: any = { ...payload }

    // Convert release_date string to Date if provided
    if (payload.release_date) {
      updateData.release_date = new Date(payload.release_date)
    }

    await databaseService.movies.updateOne(
      {
        _id: new ObjectId(movie_id),
        created_by: new ObjectId(staff_id)
      },
      {
        $set: updateData,
        $currentDate: { updated_at: true }
      }
    )

    return { movie_id }
  }

  // Staff delete movie với ownership check
  async deleteMyMovie(staff_id: string, movie_id: string) {
    if (!ObjectId.isValid(movie_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid movie ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Check ownership
    const movie = await databaseService.movies.findOne({
      _id: new ObjectId(movie_id),
      created_by: new ObjectId(staff_id)
    })

    if (!movie) {
      throw new ErrorWithStatus({
        message: 'Movie not found or you do not have permission to delete this movie',
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Check if movie has showtimes
    const showtime = await databaseService.showtimes.findOne({
      movie_id: new ObjectId(movie_id)
    })

    if (showtime) {
      throw new ErrorWithStatus({
        message: 'Cannot delete movie that has associated showtimes',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    await databaseService.movies.deleteOne({
      _id: new ObjectId(movie_id),
      created_by: new ObjectId(staff_id)
    })

    return { movie_id }
  }

  // Staff xem ratings của movie mình tạo
  async getMyMovieRatings(staff_id: string, movie_id: string, page: number = 1, limit: number = 10) {
    // First verify movie ownership
    await this.getMyMovieById(staff_id, movie_id)

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

  // Staff xem feedbacks của movie mình tạo
  async getMyMovieFeedbacks(
    staff_id: string,
    movie_id: string,
    page: number = 1,
    limit: number = 10,
    includeAll: boolean = false
  ) {
    // First verify movie ownership
    await this.getMyMovieById(staff_id, movie_id)

    return feedbackService.getMovieFeedbacks(movie_id, page, limit, !includeAll)
  }

  // Lấy thống kê movies của staff
  async getMyMovieStats(staff_id: string) {
    const staffObjectId = new ObjectId(staff_id)

    const [totalMovies, nowShowingMovies, comingSoonMovies, endedMovies, totalRatings, avgRating] = await Promise.all([
      // Total movies created by staff
      databaseService.movies.countDocuments({ created_by: staffObjectId }),

      // Now showing movies
      databaseService.movies.countDocuments({
        created_by: staffObjectId,
        status: MovieStatus.NOW_SHOWING
      }),

      // Coming soon movies
      databaseService.movies.countDocuments({
        created_by: staffObjectId,
        status: MovieStatus.COMING_SOON
      }),

      // Ended movies
      databaseService.movies.countDocuments({
        created_by: staffObjectId,
        status: MovieStatus.ENDED
      }),

      // Total ratings for staff's movies
      databaseService.ratings
        .aggregate([
          {
            $lookup: {
              from: 'movies',
              localField: 'movie_id',
              foreignField: '_id',
              as: 'movie'
            }
          },
          {
            $match: {
              'movie.created_by': staffObjectId
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray(),

      // Average rating for staff's movies
      databaseService.ratings
        .aggregate([
          {
            $lookup: {
              from: 'movies',
              localField: 'movie_id',
              foreignField: '_id',
              as: 'movie'
            }
          },
          {
            $match: {
              'movie.created_by': staffObjectId
            }
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' }
            }
          }
        ])
        .toArray()
    ])

    return {
      total_movies: totalMovies,
      now_showing: nowShowingMovies,
      coming_soon: comingSoonMovies,
      ended: endedMovies,
      total_ratings: totalRatings[0]?.total || 0,
      average_rating: avgRating[0]?.avgRating || 0
    }
  }

  // Lấy top rated movies của staff
  async getMyTopRatedMovies(staff_id: string, limit: number = 5) {
    const movies = await databaseService.movies
      .find({ created_by: new ObjectId(staff_id) })
      .sort({ average_rating: -1, ratings_count: -1 })
      .limit(limit)
      .toArray()

    return movies
  }
}

const staffMovieService = new StaffMovieService()
export default staffMovieService
