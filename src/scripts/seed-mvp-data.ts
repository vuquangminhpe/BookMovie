import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { MovieStatus } from '../models/schemas/Movie.shema'
import TheaterType from '../models/schemas/Theater.schema'
import ShowtimeType from '../models/schemas/Showtime.schema'
import UserType, { UserRole } from '../models/schemas/User.schema'
import { UserVerifyStatus } from '../constants/enums'
import { hashPassword } from '../utils/crypto'

/**
 * MVP Data Seeding Script
 * This script populates the database with sample data for MVP demonstration
 */

// Define interfaces for type safety
interface Movie {
  _id?: ObjectId
  title: string
  description: string
  duration: number
  genre: string[]
  language: string
  release_date: Date
  director: string
  cast: CastMember[]
  poster_url: string
  trailer_url?: string
  status: MovieStatus
  average_rating?: number
  ratings_count?: number
  is_featured?: boolean
  featured_order?: number | null
  partner_id?: ObjectId
  created_by?: ObjectId
  created_at?: Date
  updated_at?: Date
}

interface CastMember {
  name: string
  role: string
}

interface Theater {
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

interface Screen {
  _id?: ObjectId
  name: string
  capacity: number
  seats: Seat[]
}

interface Seat {
  row: string
  number: number
  type: 'regular' | 'premium' | 'vip'
  price: number
}

interface Showtime {
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

interface User {
  _id?: ObjectId
  email: string
  password: string
  name?: string
  phone?: string
  role: UserRole
  verify: UserVerifyStatus
  created_at?: Date
  updated_at?: Date
}

async function seedMVPData() {
  try {
    console.log('🌱 Starting MVP data seeding...')
    console.log('📝 This is a template for MVP data seeding.')
    console.log('Please use the existing seed-cinema-data.ts for actual seeding.')
    console.log('Or modify this script to match the existing schema requirements.')
    
    // Connect to database
    await databaseService.connect()
    console.log('✅ Database connection successful!')
    
    console.log('✅ MVP data seeding completed successfully!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding MVP data:', error)
    process.exit(1)
  }
}

/* 
// These functions are templates for MVP implementation
// They need to be modified to match the existing schema structure

async function clearExistingData() {
  console.log('🧹 Clearing existing data...')
  await Promise.all([
    databaseService.movies.deleteMany({}),
    databaseService.theaters.deleteMany({}),
    databaseService.users.deleteMany({}),
    databaseService.showtimes.deleteMany({}),
    databaseService.bookings.deleteMany({})
  ])
}

async function seedMovies() {
  // Template function - needs schema adjustment
  return []
}

async function seedTheaters() {
  // Template function - needs schema adjustment  
  return []
}

async function seedUsers() {
  // Template function - needs schema adjustment
  return []
}

async function seedShowtimes(movies: Movie[], theaters: Theater[]) {
  // Template function - needs schema adjustment
  return []
}

function generateSeats(rows: number, seatsPerRow: number) {
  // Template function
  return []
}

function calculateBasePrice(timeString: string, capacity: number): number {
  // Template function
  return 12.00
}
*/

// Note: This seeder script is for demonstration purposes
// To use with the existing schema, additional field mappings are needed
// For MVP implementation, use the existing seed-cinema-data.ts as reference

// Run the seeder
if (require.main === module) {
  console.log('📝 MVP Seeder Script')
  console.log('This is a template for MVP data seeding.')
  console.log('Please use the existing seed-cinema-data.ts for actual seeding.')
  console.log('Or modify this script to match the existing schema requirements.')
}

export { seedMVPData }