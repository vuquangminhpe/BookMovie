import { MongoClient, Db, Collection } from 'mongodb'
import User from '../models/schemas/User.schema'
import RefreshToken from '../models/schemas/RefreshToken.schema'
import VideoStatus from '../models/schemas/VideoStatus.schema'
import Theater from '../models/schemas/Theater.schema'
import Screen from '../models/schemas/Screen.schema'
import Showtime from '../models/schemas/Showtime.schema'
import Booking from '../models/schemas/Booking.schema'
import Payment from '../models/schemas/Payment.schema'

import { envConfig } from '../constants/config'
import Movie from '../models/schemas/Movie.shema'

const uri = envConfig.mongodb_url
const dbName = envConfig.db_name

class DatabaseService {
  private static instance: DatabaseService
  private client: MongoClient
  public db: Db

  private constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(dbName)
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async connect() {
    try {
      await this.client.connect() // Kết nối nếu chưa có
      await this.db.command({ ping: 1 })
      console.log('Connected to MongoDB!')

      // Create indexes for cinema collections
      await this.createCinemaIndexes()
    } catch (error) {
      console.error('MongoDB connection error:', error)
      throw error
    }
  }

  async createCinemaIndexes() {
    // Movie indexes
    const movieIndexesExist = await this.movies.indexExists(['title_1'])
    if (!movieIndexesExist) {
      await this.movies.createIndex({ title: 1 })
      await this.movies.createIndex({ status: 1 })
      await this.movies.createIndex({ release_date: -1 })
    }

    // Theater indexes
    const theaterIndexesExist = await this.theaters.indexExists(['name_1', 'city_1'])
    if (!theaterIndexesExist) {
      await this.theaters.createIndex({ name: 1 })
      await this.theaters.createIndex({ city: 1 })
      await this.theaters.createIndex({ location: 1 })
    }

    // Screen indexes
    const screenIndexesExist = await this.screens.indexExists(['theater_id_1'])
    if (!screenIndexesExist) {
      await this.screens.createIndex({ theater_id: 1 })
    }

    // Showtime indexes
    const showtimeIndexesExist = await this.showtimes.indexExists(['movie_id_1', 'theater_id_1'])
    if (!showtimeIndexesExist) {
      await this.showtimes.createIndex({ movie_id: 1 })
      await this.showtimes.createIndex({ theater_id: 1 })
      await this.showtimes.createIndex({ screen_id: 1 })
      await this.showtimes.createIndex({ start_time: 1 })
      await this.showtimes.createIndex({ status: 1 })
    }

    // Booking indexes
    const bookingIndexesExist = await this.bookings.indexExists(['user_id_1', 'showtime_id_1'])
    if (!bookingIndexesExist) {
      await this.bookings.createIndex({ user_id: 1 })
      await this.bookings.createIndex({ showtime_id: 1 })
      await this.bookings.createIndex({ ticket_code: 1 }, { unique: true })
      await this.bookings.createIndex({ status: 1 })
    }

    // Payment indexes
    const paymentIndexesExist = await this.payments.indexExists(['booking_id_1', 'user_id_1'])
    if (!paymentIndexesExist) {
      await this.payments.createIndex({ booking_id: 1 }, { unique: true })
      await this.payments.createIndex({ user_id: 1 })
      await this.payments.createIndex({ transaction_id: 1 })
    }
  }

  async indexVideoStatus() {
    const exits = await this.videoStatus.indexExists('name_1')
    if (!exits) {
      this.videoStatus.createIndex({ name: 1 }, { unique: true })
    }
  }

  // Existing collections
  get users(): Collection<User> {
    return this.db.collection(envConfig.usersCollection)
  }

  get refreshToken(): Collection<RefreshToken> {
    return this.db.collection(envConfig.refreshCollection)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(envConfig.VideoStatusCollection)
  }

  // Cinema collections
  get movies(): Collection<Movie> {
    return this.db.collection('movies')
  }

  get theaters(): Collection<Theater> {
    return this.db.collection('theaters')
  }

  get screens(): Collection<Screen> {
    return this.db.collection('screens')
  }

  get showtimes(): Collection<Showtime> {
    return this.db.collection('showtimes')
  }

  get bookings(): Collection<Booking> {
    return this.db.collection('bookings')
  }

  get payments(): Collection<Payment> {
    return this.db.collection('payments')
  }
}

const databaseService = DatabaseService.getInstance()
export default databaseService
