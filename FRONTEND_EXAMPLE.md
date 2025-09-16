# BookMovie MVP Frontend Example

## React.js Frontend Implementation

### 1. Project Setup

```bash
npx create-react-app bookmovie-frontend --template typescript
cd bookmovie-frontend
npm install axios react-router-dom @types/react-router-dom
npm install tailwindcss @tailwindcss/forms
```

### 2. API Service Layer

#### API Configuration (`src/services/api.ts`)
```typescript
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

#### Auth Service (`src/services/authService.ts`)
```typescript
import api from './api'

export interface User {
  _id: string
  email: string
  name: string
  role: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

class AuthService {
  async register(userData: {
    email: string
    password: string
    name: string
    phone?: string
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData)
    return response.data.data
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password })
    const { user, accessToken, refreshToken } = response.data.data
    
    // Store tokens
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    
    return response.data.data
  }

  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  }
}

export default new AuthService()
```

#### Movie Service (`src/services/movieService.ts`)
```typescript
import api from './api'

export interface Movie {
  _id: string
  title: string
  description: string
  duration: number
  genre: string[]
  rating: string
  poster_url?: string
  trailer_url?: string
  release_date: string
  status: string
}

export interface Showtime {
  _id: string
  movie_id: string
  theater_id: string
  screen_id: string
  start_time: string
  end_time: string
  available_seats: number
  base_price: number
  theater?: {
    name: string
    location: {
      address: string
      city: string
      state: string
    }
  }
  screen?: {
    name: string
  }
}

class MovieService {
  async getMovies(status?: string): Promise<Movie[]> {
    const response = await api.get('/movies', {
      params: status ? { status } : {}
    })
    return response.data.data
  }

  async getMovieById(movieId: string): Promise<Movie> {
    const response = await api.get(`/movies/${movieId}`)
    return response.data.data
  }

  async getShowtimes(movieId: string): Promise<Showtime[]> {
    const response = await api.get(`/movies/${movieId}/showtimes`)
    return response.data.data
  }
}

export default new MovieService()
```

#### Booking Service (`src/services/bookingService.ts`)
```typescript
import api from './api'

export interface BookingSeat {
  row: string
  number: number
  price?: number
}

export interface Booking {
  _id: string
  movie_id: string
  showtime_id: string
  theater_id: string
  screen_id: string
  seats: BookingSeat[]
  total_amount: number
  booking_time: string
  status: string
  ticket_code?: string
  movie?: {
    title: string
    poster_url?: string
  }
  theater?: {
    name: string
    location: any
  }
  showtime?: {
    start_time: string
    end_time: string
  }
}

class BookingService {
  async createBooking(bookingData: {
    showtime_id: string
    seats: { row: string; number: number }[]
  }): Promise<Booking> {
    const response = await api.post('/bookings', bookingData)
    return response.data.data
  }

  async getUserBookings(): Promise<Booking[]> {
    const response = await api.get('/bookings/my-bookings')
    return response.data.data
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await api.get(`/bookings/${bookingId}`)
    return response.data.data
  }

  async confirmBooking(bookingId: string): Promise<void> {
    await api.post(`/bookings/${bookingId}/confirm`)
  }
}

export default new BookingService()
```

### 3. React Components

#### Login Component (`src/components/auth/LoginForm.tsx`)
```typescript
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../../services/authService'

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.login(email, password)
      navigate('/movies')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <a href="/register" className="text-blue-500 hover:text-blue-700">
          Don't have an account? Register here
        </a>
      </div>
    </div>
  )
}

export default LoginForm
```

#### Movie List Component (`src/components/movies/MovieList.tsx`)
```typescript
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import movieService, { Movie } from '../../services/movieService'

const MovieList: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMovies()
  }, [])

  const loadMovies = async () => {
    try {
      const data = await movieService.getMovies('now_showing')
      setMovies(data)
    } catch (err: any) {
      setError('Failed to load movies')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading movies...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Now Showing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <div key={movie._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {movie.poster_url && (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-80 object-cover"
              />
            )}
            
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{movie.title}</h3>
              <p className="text-gray-600 text-sm mb-2">
                {movie.genre.join(', ')} • {movie.duration} min
              </p>
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {movie.description}
              </p>
              
              <div className="flex justify-between items-center">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {movie.rating}
                </span>
                <Link
                  to={`/movies/${movie._id}/showtimes`}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieList
```

#### Showtime Selection Component (`src/components/booking/ShowtimeSelection.tsx`)
```typescript
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import movieService, { Movie, Showtime } from '../../services/movieService'

const ShowtimeSelection: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()
  
  const [movie, setMovie] = useState<Movie | null>(null)
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (movieId) {
      loadData()
    }
  }, [movieId])

  const loadData = async () => {
    try {
      const [movieData, showtimeData] = await Promise.all([
        movieService.getMovieById(movieId!),
        movieService.getShowtimes(movieId!)
      ])
      
      setMovie(movieData)
      setShowtimes(showtimeData)
    } catch (err: any) {
      setError('Failed to load movie details')
    } finally {
      setLoading(false)
    }
  }

  const handleShowtimeSelect = (showtimeId: string) => {
    navigate(`/booking/seats/${showtimeId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) return <div className="text-center p-8">Loading...</div>
  if (error) return <div className="text-center text-red-600 p-8">{error}</div>
  if (!movie) return <div className="text-center p-8">Movie not found</div>

  // Group showtimes by date and theater
  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    const date = formatDate(showtime.start_time)
    const theaterName = showtime.theater?.name || 'Unknown Theater'
    
    if (!acc[date]) acc[date] = {}
    if (!acc[date][theaterName]) acc[date][theaterName] = []
    
    acc[date][theaterName].push(showtime)
    return acc
  }, {} as Record<string, Record<string, Showtime[]>>)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Movie Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full md:w-48 h-72 object-cover rounded-lg"
            />
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
            <p className="text-gray-600 mb-2">
              {movie.genre.join(', ')} • {movie.duration} min • {movie.rating}
            </p>
            <p className="text-gray-700">{movie.description}</p>
          </div>
        </div>
      </div>

      {/* Showtimes */}
      <div className="space-y-6">
        {Object.entries(groupedShowtimes).map(([date, theaters]) => (
          <div key={date} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">{date}</h2>
            
            {Object.entries(theaters).map(([theaterName, times]) => (
              <div key={theaterName} className="mb-4">
                <h3 className="text-lg font-medium mb-2">{theaterName}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {times.map((showtime) => (
                    <button
                      key={showtime._id}
                      onClick={() => handleShowtimeSelect(showtime._id)}
                      className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all"
                    >
                      <div className="text-sm font-medium">
                        {formatTime(showtime.start_time)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {showtime.screen?.name}
                      </div>
                      <div className="text-xs text-green-600">
                        ${showtime.base_price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ShowtimeSelection
```

### 4. App Router Setup (`src/App.tsx`)
```typescript
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import authService from './services/authService'

// Components
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import MovieList from './components/movies/MovieList'
import ShowtimeSelection from './components/booking/ShowtimeSelection'
import SeatSelection from './components/booking/SeatSelection'
import BookingHistory from './components/booking/BookingHistory'
import Navbar from './components/layout/Navbar'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-100">
        <Navbar />
        
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route 
            path="/movies" 
            element={
              <PrivateRoute>
                <MovieList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/movies/:movieId/showtimes" 
            element={
              <PrivateRoute>
                <ShowtimeSelection />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/booking/seats/:showtimeId" 
            element={
              <PrivateRoute>
                <SeatSelection />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <PrivateRoute>
                <BookingHistory />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/movies" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
```

### 5. Environment Variables (`.env`)
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_APP_NAME=BookMovie MVP
```

### 6. Run the Frontend
```bash
npm start
```

This frontend example provides:
- User authentication (login/register)
- Movie browsing
- Showtime selection
- Basic booking flow
- Responsive design with Tailwind CSS
- Type safety with TypeScript

The frontend communicates with the backend API and provides a complete user experience for the movie booking MVP.