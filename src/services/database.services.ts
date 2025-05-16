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
    } catch (error) {
      console.error('MongoDB connection error:', error)
      throw error
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
