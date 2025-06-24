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
}

const movieService = new MovieService()
export default movieService
