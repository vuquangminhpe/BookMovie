# BookMovie MVP Implementation Guide

## Quick Start Implementation

### 1. Environment Setup

Create `.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/bookmovie_mvp
DB_NAME=bookmovie_mvp

# JWT Secrets
JWT_SECRET_ACCESS_TOKEN=your-access-token-secret
JWT_SECRET_REFRESH_TOKEN=your-refresh-token-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Server
PORT=5001
NODE_ENV=development

# Email (Optional for MVP)
SENDGRID_API_KEY=your-sendgrid-key

# File Upload (Optional for MVP)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=your-bucket-name
```

### 2. Core Data Models

#### User Model (`src/models/User.ts`)
```typescript
import { ObjectId } from 'mongodb'

export enum UserRole {
  CUSTOMER = 'customer',
  STAFF = 'staff',
  ADMIN = 'admin'
}

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
  email_verified: boolean
  created_at?: Date
  updated_at?: Date
}
```

#### Movie Model (`src/models/Movie.ts`)
```typescript
export enum MovieStatus {
  COMING_SOON = 'coming_soon',
  NOW_SHOWING = 'now_showing',
  ENDED = 'ended'
}

export interface Movie {
  _id?: ObjectId
  title: string
  description: string
  duration: number // minutes
  genre: string[]
  rating: string // PG, PG-13, R, etc.
  poster_url?: string
  trailer_url?: string
  release_date: Date
  status: MovieStatus
  created_at?: Date
  updated_at?: Date
}
```

#### Theater Model (`src/models/Theater.ts`)
```typescript
export interface Theater {
  _id?: ObjectId
  name: string
  location: {
    address: string
    city: string
    state: string
    zip_code: string
  }
  screens: Screen[]
  amenities: string[]
  created_at?: Date
  updated_at?: Date
}

export interface Screen {
  _id?: ObjectId
  name: string
  capacity: number
  seats: Seat[]
}

export interface Seat {
  row: string // A, B, C, etc.
  number: number // 1, 2, 3, etc.
  type: 'regular' | 'premium' | 'vip'
  price: number
}
```

#### Showtime Model (`src/models/Showtime.ts`)
```typescript
export interface Showtime {
  _id?: ObjectId
  movie_id: ObjectId
  theater_id: ObjectId
  screen_id: ObjectId
  start_time: Date
  end_time: Date
  available_seats: number
  base_price: number
  created_at?: Date
  updated_at?: Date
}
```

#### Booking Model (`src/models/Booking.ts`)
```typescript
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface Booking {
  _id?: ObjectId
  user_id: ObjectId
  movie_id: ObjectId
  showtime_id: ObjectId
  theater_id: ObjectId
  screen_id: ObjectId
  seats: BookedSeat[]
  total_amount: number
  booking_time: Date
  status: BookingStatus
  ticket_code?: string
  created_at?: Date
  updated_at?: Date
}

export interface BookedSeat {
  row: string
  number: number
  price: number
}
```

### 3. Core Services

#### Database Service (`src/services/database.services.ts`)
```typescript
import { MongoClient, Db, Collection } from 'mongodb'
import { User } from '../models/User'
import { Movie } from '../models/Movie'
import { Theater } from '../models/Theater'
import { Showtime } from '../models/Showtime'
import { Booking } from '../models/Booking'

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI as string)
  }

  async connect() {
    await this.client.connect()
    this.db = this.client.db(process.env.DB_NAME)
    console.log('✅ Connected to MongoDB')
  }

  get users(): Collection<User> {
    return this.db.collection('users')
  }

  get movies(): Collection<Movie> {
    return this.db.collection('movies')
  }

  get theaters(): Collection<Theater> {
    return this.db.collection('theaters')
  }

  get showtimes(): Collection<Showtime> {
    return this.db.collection('showtimes')
  }

  get bookings(): Collection<Booking> {
    return this.db.collection('bookings')
  }
}

const databaseService = new DatabaseService()
export default databaseService
```

#### User Service (`src/services/user.services.ts`)
```typescript
import { ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import databaseService from './database.services'
import { User, UserRole } from '../models/User'

class UserService {
  async register(userData: {
    email: string
    password: string
    name: string
    phone?: string
  }) {
    // Check if user exists
    const existingUser = await databaseService.users.findOne({
      email: userData.email
    })
    
    if (existingUser) {
      throw new Error('User already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    // Create user
    const user: User = {
      _id: new ObjectId(),
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      phone: userData.phone,
      role: UserRole.CUSTOMER,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    await databaseService.users.insertOne(user)

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id!.toString())
    const refreshToken = this.generateRefreshToken(user._id!.toString())

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  }

  async login(email: string, password: string) {
    // Find user
    const user = await databaseService.users.findOne({ email })
    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id!.toString())
    const refreshToken = this.generateRefreshToken(user._id!.toString())

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  }

  private generateAccessToken(userId: string) {
    return jwt.sign(
      { user_id: userId, type: 'access' },
      process.env.JWT_SECRET_ACCESS_TOKEN as string,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    )
  }

  private generateRefreshToken(userId: string) {
    return jwt.sign(
      { user_id: userId, type: 'refresh' },
      process.env.JWT_SECRET_REFRESH_TOKEN as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    )
  }
}

const userService = new UserService()
export default userService
```

#### Movie Service (`src/services/movie.services.ts`)
```typescript
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { Movie, MovieStatus } from '../models/Movie'

class MovieService {
  async getMovies(status?: MovieStatus) {
    const filter: any = {}
    if (status) {
      filter.status = status
    }

    const movies = await databaseService.movies
      .find(filter)
      .sort({ created_at: -1 })
      .toArray()

    return movies
  }

  async getMovieById(movieId: string) {
    const movie = await databaseService.movies.findOne({
      _id: new ObjectId(movieId)
    })

    if (!movie) {
      throw new Error('Movie not found')
    }

    return movie
  }

  async createMovie(movieData: Omit<Movie, '_id' | 'created_at' | 'updated_at'>) {
    const movie: Movie = {
      _id: new ObjectId(),
      ...movieData,
      created_at: new Date(),
      updated_at: new Date()
    }

    await databaseService.movies.insertOne(movie)
    return movie
  }
}

const movieService = new MovieService()
export default movieService
```

#### Booking Service (`src/services/booking.services.ts`)
```typescript
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { Booking, BookingStatus, BookedSeat } from '../models/Booking'
import { generateTicketCode } from '../utils/ticket'

class BookingService {
  async createBooking(userId: string, bookingData: {
    showtime_id: string
    seats: { row: string; number: number }[]
  }) {
    // Get showtime details
    const showtime = await databaseService.showtimes.findOne({
      _id: new ObjectId(bookingData.showtime_id)
    })

    if (!showtime) {
      throw new Error('Showtime not found')
    }

    // Check seat availability
    const existingBookings = await databaseService.bookings
      .find({
        showtime_id: new ObjectId(bookingData.showtime_id),
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }
      })
      .toArray()

    const bookedSeats = existingBookings.flatMap(booking => 
      booking.seats.map(seat => `${seat.row}-${seat.number}`)
    )

    const requestedSeats = bookingData.seats.map(seat => `${seat.row}-${seat.number}`)
    const conflictingSeats = requestedSeats.filter(seat => bookedSeats.includes(seat))

    if (conflictingSeats.length > 0) {
      throw new Error(`Seats already booked: ${conflictingSeats.join(', ')}`)
    }

    // Calculate total amount (simplified pricing)
    const seatsWithPrice: BookedSeat[] = bookingData.seats.map(seat => ({
      row: seat.row,
      number: seat.number,
      price: showtime.base_price
    }))

    const totalAmount = seatsWithPrice.reduce((sum, seat) => sum + seat.price, 0)

    // Create booking
    const booking: Booking = {
      _id: new ObjectId(),
      user_id: new ObjectId(userId),
      movie_id: showtime.movie_id,
      showtime_id: showtime._id!,
      theater_id: showtime.theater_id,
      screen_id: showtime.screen_id,
      seats: seatsWithPrice,
      total_amount: totalAmount,
      booking_time: new Date(),
      status: BookingStatus.PENDING,
      ticket_code: generateTicketCode(),
      created_at: new Date(),
      updated_at: new Date()
    }

    await databaseService.bookings.insertOne(booking)

    // Update available seats
    await databaseService.showtimes.updateOne(
      { _id: showtime._id },
      { 
        $inc: { available_seats: -bookingData.seats.length },
        $set: { updated_at: new Date() }
      }
    )

    return booking
  }

  async getUserBookings(userId: string) {
    const bookings = await databaseService.bookings
      .aggregate([
        { $match: { user_id: new ObjectId(userId) } },
        {
          $lookup: {
            from: 'movies',
            localField: 'movie_id',
            foreignField: '_id',
            as: 'movie'
          }
        },
        {
          $lookup: {
            from: 'theaters',
            localField: 'theater_id',
            foreignField: '_id',
            as: 'theater'
          }
        },
        {
          $lookup: {
            from: 'showtimes',
            localField: 'showtime_id',
            foreignField: '_id',
            as: 'showtime'
          }
        },
        { $unwind: '$movie' },
        { $unwind: '$theater' },
        { $unwind: '$showtime' },
        { $sort: { created_at: -1 } }
      ])
      .toArray()

    return bookings
  }

  async confirmBooking(bookingId: string) {
    await databaseService.bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: BookingStatus.CONFIRMED,
          updated_at: new Date()
        }
      }
    )
  }
}

const bookingService = new BookingService()
export default bookingService
```

### 4. API Controllers

#### Auth Controller (`src/controllers/auth.controllers.ts`)
```typescript
import { Request, Response } from 'express'
import userService from '../services/user.services'

export const registerController = async (req: Request, res: Response) => {
  try {
    const result = await userService.register(req.body)
    res.status(201).json({
      message: 'Registration successful',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Registration failed'
    })
  }
}

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const result = await userService.login(email, password)
    res.json({
      message: 'Login successful',
      data: result
    })
  } catch (error) {
    res.status(401).json({
      message: error instanceof Error ? error.message : 'Login failed'
    })
  }
}
```

### 5. Routes Setup

#### Main Routes (`src/routes/index.ts`)
```typescript
import { Router } from 'express'
import authRoutes from './auth.routes'
import movieRoutes from './movie.routes'
import bookingRoutes from './booking.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/movies', movieRoutes)
router.use('/bookings', bookingRoutes)

export default router
```

### 6. Server Setup (`src/index.ts`)
```typescript
import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import databaseService from './services/database.services'
import routes from './routes'

config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Start server
async function startServer() {
  try {
    await databaseService.connect()
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
```

### 7. Package.json Scripts
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "ts-node src/scripts/seed.ts"
  }
}
```

## Testing the MVP

### 1. Start the server
```bash
npm run dev
```

### 2. Test endpoints
```bash
# Register user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get movies
curl http://localhost:5001/api/movies

# Create booking
curl -X POST http://localhost:5001/api/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"showtime_id":"SHOWTIME_ID","seats":[{"row":"A","number":1}]}'
```

This MVP implementation provides a solid foundation for a movie booking system with the core features needed to demonstrate the concept and build upon.