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
import Rating from '~/models/schemas/Rating.schema'
import Feedback from '~/models/schemas/Feedback.schema'
import Banner from '~/models/schemas/Banner.schema'
import Coupon from '~/models/schemas/Coupon.schema'
import CouponUsage from '~/models/schemas/CouponUsage.schema'
import Favorite from '~/models/schemas/Favorite.schema'
import SeatLock from '~/models/schemas/SeatLock.schema'
import Partner from '~/models/schemas/Partner.schema'
import Contract from '~/models/schemas/Contact.schema'

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
  get ratings(): Collection<Rating> {
    return this.db.collection('ratings')
  }
  get feedbacks(): Collection<Feedback> {
    return this.db.collection('feedbacks')
  }
  get banners(): Collection<Banner> {
    return this.db.collection('banners')
  }
  get notifications(): Collection<Notification> {
    return this.db.collection('notifications')
  }
  get coupons(): Collection<Coupon> {
    return this.db.collection('coupons')
  }

  get couponUsages(): Collection<CouponUsage> {
    return this.db.collection('coupon_usages')
  }
  get favorites(): Collection<Favorite> {
    return this.db.collection('favorites')
  }
  get seatLocks(): Collection<SeatLock> {
    return this.db.collection('seat_locks')
  }
  get partners(): Collection<Partner> {
    return this.db.collection('partners')
  }
  get contracts(): Collection<Contract> {
    return this.db.collection('contracts')
  }
}

const databaseService = DatabaseService.getInstance()
export default databaseService
