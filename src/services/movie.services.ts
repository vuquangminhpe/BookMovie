import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { CreateMovieReqBody, GetMoviesReqQuery, UpdateMovieReqBody } from '../models/request/Movie.request'
import Movie, { MovieStatus } from '../models/schemas/Movie.shema'

class MovieService {
  async createMovie(payload: CreateMovieReqBody) {
    const movie_id = new ObjectId()
    const result = await databaseService.movies.insertOne(
      new Movie({
        _id: movie_id,
        ...payload,
        status: payload.status || MovieStatus.COMING_SOON, // Provide default status if not in payload
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
}

const movieService = new MovieService()
export default movieService
