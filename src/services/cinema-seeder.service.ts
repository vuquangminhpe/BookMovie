// src/services/cinema-seeder.service.ts
// Service để seed dữ liệu cinema từ TMDB API

import databaseService from './database.services'
import Movie, { MovieStatus } from '../models/schemas/Movie.shema'
import Theater, { TheaterStatus } from '../models/schemas/Theater.schema'
import Screen, { SeatType, SeatStatus } from '../models/schemas/Screen.schema'
import Showtime, { ShowtimeStatus } from '../models/schemas/Showtime.schema'
import Banner, { BannerTypes, BannerStatus } from '../models/schemas/Banner.schema'
import Coupon, { CouponTypes, CouponStatus, CouponApplicableTo } from '../models/schemas/Coupon.schema'
import { ObjectId } from 'mongodb'
import axios from 'axios'
import { ScreenType, ScreenStatus } from '../constants/enums'

// =============================================================================
// INTERFACES
// =============================================================================

interface TMDBMovie {
  id: number
  title: string
  overview: string
  runtime: number
  genre_ids?: number[]
  genres?: { id: number; name: string }[]
  original_language: string
  release_date: string
  poster_path: string
  vote_average: number
  vote_count: number
  popularity: number
  credits?: {
    crew: { job: string; name: string }[]
    cast: {
      id: number
      name: string
      character: string
      order: number
      profile_path: string | null
      gender: number
      known_for_department: string
    }[]
  }
  videos?: {
    results: {
      id: string
      key: string
      name: string
      site: string
      type: string
      official: boolean
    }[]
  }
}

interface TMDBGenre {
  id: number
  name: string
}

// =============================================================================
// TMDB API SERVICE
// =============================================================================

class TMDBService {
  private apiKey: string
  private baseURL = 'https://api.themoviedb.org/3'
  private imageBaseURL = 'https://image.tmdb.org/t/p/w500'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    try {
      // Detect if API key is v4 access token (starts with 'eyJ') or v3 API key
      const isAccessToken = this.apiKey.startsWith('eyJ')

      if (isAccessToken) {
        // Use v4 Access Token with Authorization header
        const response = await axios.get(`${this.baseURL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            accept: 'application/json'
          },
          params: {
            language: 'en-US',
            ...params
          }
        })
        return response.data
      } else {
        // Use v3 API Key with query parameter
        const response = await axios.get(`${this.baseURL}${endpoint}`, {
          params: {
            api_key: this.apiKey,
            language: 'en-US',
            ...params
          }
        })
        return response.data
      }
    } catch (error: any) {
      console.error(`Error making request to ${endpoint}:`, error.message)
      if (error.response?.status === 401) {
        console.error('🔑 Authentication failed. Please check your TMDB API key/token.')
        if (this.apiKey.startsWith('eyJ')) {
          console.error("💡 You are using v4 Access Token. Make sure it's valid and not expired.")
        } else {
          console.error('💡 You are using v3 API Key. Try using v4 Access Token instead.')
        }
      }
      throw error
    }
  }

  async getPopularMovies(page = 1) {
    return this.makeRequest('/movie/popular', { page })
  }

  async getTopRatedMovies(page = 1) {
    return this.makeRequest('/movie/top_rated', { page })
  }

  async getNowPlayingMovies(page = 1) {
    return this.makeRequest('/movie/now_playing', { page })
  }

  async getUpcomingMovies(page = 1) {
    return this.makeRequest('/movie/upcoming', { page })
  }

  async getMovieDetails(movieId: number) {
    return this.makeRequest(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,images'
    })
  }

  async getGenres() {
    return this.makeRequest('/genre/movie/list')
  }

  getImageURL(path: string): string {
    return path ? `${this.imageBaseURL}${path}` : ''
  }
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

class DataTransformer {
  static transformTMDBMovie(tmdbMovie: TMDBMovie, genres: TMDBGenre[]) {
    const genreMap: Record<number, string> = {}
    genres.forEach((g) => (genreMap[g.id] = g.name))

    // Extract YouTube trailer URL from videos
    const trailerUrl = this.extractTrailerURL(tmdbMovie.videos)

    // Transform cast with profile images
    const castWithImages = this.transformCastWithImages(tmdbMovie.credits?.cast || [])

    return {
      title: tmdbMovie.title,
      description: tmdbMovie.overview || '',
      duration: tmdbMovie.runtime || 120,
      genre: tmdbMovie.genre_ids
        ? tmdbMovie.genre_ids.map((id) => genreMap[id]).filter(Boolean)
        : tmdbMovie.genres
          ? tmdbMovie.genres.map((g) => g.name)
          : [],
      language: tmdbMovie.original_language || 'en',
      release_date: new Date(tmdbMovie.release_date),
      director: tmdbMovie.credits?.crew?.find((person) => person.job === 'Director')?.name || 'Unknown',
      cast: castWithImages, // ✅ Now includes images and character names
      poster_url: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
      trailer_url: trailerUrl,
      status: this.getMovieStatus(tmdbMovie.release_date),
      average_rating: Math.round(tmdbMovie.vote_average * 10) / 10,
      ratings_count: tmdbMovie.vote_count || 0,
      is_featured: tmdbMovie.popularity > 100,
      featured_order: tmdbMovie.popularity > 100 ? Math.floor(Math.random() * 10) : null
    }
  }

  static transformCastWithImages(cast: any[]): any[] {
    return cast.slice(0, 10).map((actor) => ({
      id: actor.id,
      name: actor.name,
      character: actor.character || 'Unknown Role',
      order: actor.order,
      profile_image: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : '',
      gender: actor.gender || 0 // 0 = Not specified, 1 = Female, 2 = Male
    }))
  }

  static extractTrailerURL(videos: any): string {
    if (!videos || !videos.results || videos.results.length === 0) {
      return ''
    }

    // Priority order for video selection
    const videoTypes = ['Trailer', 'Teaser', 'Clip', 'Featurette']

    for (const type of videoTypes) {
      // Find official YouTube video of this type
      const officialVideo = videos.results.find(
        (video: any) => video.site === 'YouTube' && video.type === type && video.official === true
      )

      if (officialVideo) {
        return `https://www.youtube.com/watch?v=${officialVideo.key}`
      }
    }

    // Fallback: any YouTube video
    const youtubeVideo = videos.results.find((video: any) => video.site === 'YouTube')
    if (youtubeVideo) {
      return `https://www.youtube.com/watch?v=${youtubeVideo.key}`
    }

    return ''
  }

  static getMovieStatus(releaseDate: string): MovieStatus {
    const now = new Date()
    const release = new Date(releaseDate)
    const diffTime = release.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 30) return MovieStatus.COMING_SOON
    if (diffDays < -90) return MovieStatus.ENDED
    return MovieStatus.NOW_SHOWING
  }

  static generateVietnamTheaters() {
    const cities = [
      {
        name: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        districts: ['District 1', 'District 3', 'District 7', 'Binh Thanh', 'Thu Duc']
      },
      {
        name: 'Hanoi',
        state: 'Hanoi',
        districts: ['Ba Dinh', 'Hoan Kiem', 'Dong Da', 'Cau Giay', 'Thanh Xuan']
      },
      {
        name: 'Da Nang',
        state: 'Da Nang',
        districts: ['Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son']
      },
      {
        name: 'Can Tho',
        state: 'Can Tho',
        districts: ['Ninh Kieu', 'Cai Rang', 'Binh Thuy']
      }
    ]

    const theaterChains = ['CGV', 'Lotte Cinema', 'Galaxy Cinema', 'BHD Star', 'Cinestar']
    const theaters: any[] = []

    cities.forEach((city) => {
      city.districts.forEach((district) => {
        theaterChains.slice(0, Math.floor(Math.random() * 3) + 2).forEach((chain) => {
          const screenCount = Math.floor(Math.random() * 8) + 3
          theaters.push({
            name: `${chain} ${district}`,
            location: district,
            address: `${Math.floor(Math.random() * 500) + 1} ${district} Street, ${district}, ${city.name}`,
            city: city.name,
            state: city.state,
            pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
            screens: screenCount,
            amenities: ['Air Conditioning', '3D Capability', 'Dolby Atmos', 'Parking', 'Food Court'].filter(
              () => Math.random() > 0.3
            ),
            status: TheaterStatus.ACTIVE
          })
        })
      })
    })

    return theaters
  }

  static generateScreensForTheater(theaterId: ObjectId, screenCount: number) {
    const screens: any[] = []
    const screenTypes = [
      ScreenType.STANDARD,
      ScreenType.IMAX,
      ScreenType.FOUR_DX,
      ScreenType.PREMIUM,
      ScreenType.THREE_D
    ]

    for (let i = 1; i <= screenCount; i++) {
      const seatLayout = this.generateSeatLayout()
      screens.push({
        theater_id: theaterId,
        name: `Screen ${i}`,
        seat_layout: seatLayout,
        capacity: seatLayout.flat().length,
        screen_type: screenTypes[Math.floor(Math.random() * screenTypes.length)],
        status: ScreenStatus.ACTIVE
      })
    }

    return screens
  }

  static generateSeatLayout() {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    const seatsPerRow = 12
    const layout: any[][] = []

    rows.slice(0, Math.floor(Math.random() * 4) + 6).forEach((row) => {
      const rowSeats: any[] = []
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        let seatType = SeatType.REGULAR
        if (row <= 'C') seatType = SeatType.PREMIUM
        if (row >= 'H') seatType = SeatType.RECLINER

        rowSeats.push({
          row: row,
          number: seat,
          type: seatType,
          status: SeatStatus.ACTIVE
        })
      }
      layout.push(rowSeats)
    })

    return layout
  }

  static generateShowtimes(movies: any[], screens: any[]) {
    const showtimes: any[] = []
    const timeSlots = ['09:00', '12:00', '15:00', '18:00', '21:00']

    // Generate showtimes for next 7 days
    for (let day = 0; day < 7; day++) {
      const showDate = new Date()
      showDate.setDate(showDate.getDate() + day)

      screens.forEach((screen) => {
        // Each screen shows 2-4 movies per day
        const dailyMovies = movies
          .filter((m) => m.status === MovieStatus.NOW_SHOWING)
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 2)

        dailyMovies.forEach((movie, index) => {
          const timeSlot = timeSlots[index % timeSlots.length]
          const [hours, minutes] = timeSlot.split(':')

          const startTime = new Date(showDate)
          startTime.setHours(parseInt(hours), parseInt(minutes), 0)

          const endTime = new Date(startTime)
          endTime.setMinutes(endTime.getMinutes() + movie.duration)

          showtimes.push({
            movie_id: movie._id,
            screen_id: screen._id,
            theater_id: screen.theater_id,
            start_time: startTime,
            end_time: endTime,
            price: {
              regular: Math.floor(Math.random() * 50000) + 80000, // 80k-130k VND
              premium: Math.floor(Math.random() * 70000) + 100000,
              recliner: Math.floor(Math.random() * 100000) + 150000,
              couple: Math.floor(Math.random() * 120000) + 200000
            },
            available_seats: screen.capacity,
            status: ShowtimeStatus.BOOKING_OPEN
          })
        })
      })
    }

    return showtimes
  }

  static generateBanners(movies: any[]) {
    const banners: any[] = []
    const featuredMovies = movies.filter((m) => m.is_featured).slice(0, 5)

    featuredMovies.forEach((movie, index) => {
      banners.push({
        title: `${movie.title} - Now Showing`,
        image_url: movie.poster_url,
        link_url: `/movies/${movie._id}`,
        description: movie.description.substring(0, 100) + '...',
        type: BannerTypes.HOME_SLIDER,
        status: BannerStatus.ACTIVE,
        position: index + 1,
        movie_id: movie._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      })
    })

    return banners
  }

  static generateCoupons() {
    return [
      {
        code: 'WELCOME20',
        description: 'Welcome bonus - 20% off your first booking',
        type: CouponTypes.PERCENTAGE,
        value: 20,
        min_purchase: 100000,
        max_discount: 50000,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: CouponStatus.ACTIVE,
        usage_limit: 1000,
        usage_count: 0,
        applicable_to: CouponApplicableTo.ALL,
        applicable_ids: []
      },
      {
        code: 'STUDENT15',
        description: 'Student discount - 15% off',
        type: CouponTypes.PERCENTAGE,
        value: 15,
        min_purchase: 80000,
        max_discount: 30000,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: CouponStatus.ACTIVE,
        usage_limit: 500,
        usage_count: 0,
        applicable_to: CouponApplicableTo.ALL,
        applicable_ids: []
      }
    ]
  }
}

// =============================================================================
// CINEMA DATA SEEDER SERVICE
// =============================================================================

export class CinemaDataSeeder {
  private tmdbService: TMDBService

  constructor(tmdbApiKey: string) {
    this.tmdbService = new TMDBService(tmdbApiKey)
  }

  async clearCollections() {
    console.log('🗑️  Xóa dữ liệu cũ...')

    await databaseService.movies.deleteMany({})
    console.log('   ✅ Đã xóa movies')

    await databaseService.theaters.deleteMany({})
    console.log('   ✅ Đã xóa theaters')

    await databaseService.screens.deleteMany({})
    console.log('   ✅ Đã xóa screens')

    await databaseService.showtimes.deleteMany({})
    console.log('   ✅ Đã xóa showtimes')

    await databaseService.banners.deleteMany({})
    console.log('   ✅ Đã xóa banners')

    await databaseService.coupons.deleteMany({})
    console.log('   ✅ Đã xóa coupons')
  }

  async seedMovies(movieCount: number = 50, startIndex: number = 0) {
    console.log(`🎬 Lấy ${movieCount} phim từ TMDB (bắt đầu từ ${startIndex})...`)

    // Get genres first
    const genresData = await this.tmdbService.getGenres()
    const genres = genresData.genres

    // Calculate how many pages we need (each page has ~20 movies)
    const totalNeeded = startIndex + movieCount
    const pagesNeeded = Math.ceil(totalNeeded / 20) + 1 // +1 for safety buffer

    console.log(`📡 Lấy ${pagesNeeded} pages từ mỗi category để đảm bảo đủ ${totalNeeded} movies...`)

    // Fetch multiple pages from different categories
    const allMovies = []

    for (let page = 1; page <= pagesNeeded; page++) {
      console.log(`   Loading page ${page}/${pagesNeeded}...`)

      const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
        this.tmdbService.getPopularMovies(page),
        this.tmdbService.getTopRatedMovies(page),
        this.tmdbService.getNowPlayingMovies(page),
        this.tmdbService.getUpcomingMovies(page)
      ])

      allMovies.push(...popular.results, ...topRated.results, ...nowPlaying.results, ...upcoming.results)

      // Rate limiting between pages
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Combine and deduplicate movies
    const allMoviesMap = new Map()
    allMovies.forEach((movie) => {
      if (!allMoviesMap.has(movie.id)) {
        allMoviesMap.set(movie.id, movie)
      }
    })

    console.log(`📊 Tổng cộng tìm thấy ${allMoviesMap.size} movies unique`)

    // Get the requested slice
    const uniqueMovies = Array.from(allMoviesMap.values()).slice(startIndex, startIndex + movieCount)

    if (uniqueMovies.length < movieCount) {
      console.log(`⚠️  Chỉ có thể lấy ${uniqueMovies.length}/${movieCount} movies từ index ${startIndex}`)
    }

    // Get detailed information for each movie
    console.log('📡 Lấy thông tin chi tiết cho từng phim (bao gồm trailers)...')
    const detailedMovies = []

    for (let i = 0; i < uniqueMovies.length; i++) {
      try {
        console.log(`   Processing ${i + 1}/${uniqueMovies.length}: ${uniqueMovies[i].title}`)
        const detailed = await this.tmdbService.getMovieDetails(uniqueMovies[i].id)
        detailedMovies.push(detailed)

        // Rate limiting - wait 250ms between requests
        await new Promise((resolve) => setTimeout(resolve, 250))
      } catch (error: any) {
        console.error(`   ⚠️  Lỗi khi lấy chi tiết phim ${uniqueMovies[i].title}:`, error.message)
        detailedMovies.push(uniqueMovies[i])
      }
    }

    // Transform and insert movies using existing Movie schema
    const transformedMovies = detailedMovies.map(
      (movie) => new Movie(DataTransformer.transformTMDBMovie(movie, genres))
    )

    // Log movies with trailers and cast images for verification
    const moviesWithTrailers = transformedMovies.filter((m) => m.trailer_url).length
    const moviesWithCastImages = transformedMovies.filter(
      (m) => m.cast && Array.isArray(m.cast) && m.cast.some((actor: any) => actor.profile_image)
    ).length

    console.log(`   🎬 Tìm thấy ${moviesWithTrailers}/${transformedMovies.length} phim có trailer YouTube`)
    console.log(`   👥 Tìm thấy ${moviesWithCastImages}/${transformedMovies.length} phim có cast images`)

    await databaseService.movies.insertMany(transformedMovies)
    console.log(`   ✅ Đã thêm ${transformedMovies.length} phim vào database`)

    return transformedMovies
  }

  async seedTheaters() {
    console.log('🏢 Tạo dữ liệu rạp chiếu phim Việt Nam...')
    const theaterData = DataTransformer.generateVietnamTheaters()

    // Create Theater instances using existing schema
    const theaters = theaterData.map((data) => new Theater(data))

    await databaseService.theaters.insertMany(theaters)
    console.log(`   ✅ Đã thêm ${theaters.length} rạp chiếu phim`)

    return theaters
  }

  async seedScreens(theaters: any[]) {
    console.log('🎪 Tạo màn hình chiếu cho các rạp...')
    const allScreens: any[] = []

    theaters.forEach((theater) => {
      const screenData = DataTransformer.generateScreensForTheater(theater._id, theater.screens)
      const screens = screenData.map((data) => new Screen(data))
      allScreens.push(...screens)
    })

    await databaseService.screens.insertMany(allScreens)
    console.log(`   ✅ Đã thêm ${allScreens.length} màn hình chiếu`)

    return allScreens
  }

  async seedShowtimes(movies: any[], screens: any[]) {
    console.log('⏰ Tạo lịch chiếu cho 7 ngày tới...')
    const showtimeData = DataTransformer.generateShowtimes(movies, screens)

    // Create Showtime instances using existing schema
    const showtimes = showtimeData.map((data) => new Showtime(data))

    await databaseService.showtimes.insertMany(showtimes)
    console.log(`   ✅ Đã thêm ${showtimes.length} suất chiếu`)

    return showtimes
  }

  async seedBanners(movies: any[]) {
    console.log('🖼️  Tạo banner cho trang chủ...')
    const bannerData = DataTransformer.generateBanners(movies)

    // Create Banner instances using existing schema
    const banners = bannerData.map((data) => new Banner(data))

    await databaseService.banners.insertMany(banners)
    console.log(`   ✅ Đã thêm ${banners.length} banner`)

    return banners
  }

  async seedCoupons() {
    console.log('🎟️  Tạo mã giảm giá...')
    const couponData = DataTransformer.generateCoupons()

    // Create Coupon instances using existing schema
    const coupons = couponData.map((data) => new Coupon(data))

    await databaseService.coupons.insertMany(coupons)
    console.log(`   ✅ Đã thêm ${coupons.length} mã giảm giá`)

    return coupons
  }

  async seedAll(movieCount: number = 50, startIndex: number = 0) {
    try {
      // Connect to database using existing service
      await databaseService.connect()

      await this.clearCollections()

      console.log('')
      console.log('🚀 Bắt đầu seed dữ liệu...')
      console.log('')

      // Seed data in order with custom parameters
      const movies = await this.seedMovies(movieCount, startIndex)
      const theaters = await this.seedTheaters()
      const screens = await this.seedScreens(theaters)
      const showtimes = await this.seedShowtimes(movies, screens)
      const banners = await this.seedBanners(movies)
      const coupons = await this.seedCoupons()

      console.log('')
      console.log('🎉 === Hoàn tất seed dữ liệu! ===')
      console.log(`📽️  Movies: ${movies.length} (index ${startIndex}-${startIndex + movies.length - 1})`)

      // Count movies with trailers and cast images
      const moviesWithTrailers = movies.filter((m) => m.trailer_url && m.trailer_url.length > 0).length
      const moviesWithCastImages = movies.filter(
        (m) => m.cast && Array.isArray(m.cast) && m.cast.some((actor: any) => actor.profile_image)
      ).length

      console.log(`🎬 Movies có YouTube trailers: ${moviesWithTrailers}/${movies.length}`)
      console.log(`👥 Movies có cast profile images: ${moviesWithCastImages}/${movies.length}`)

      console.log(`🏢 Theaters: ${theaters.length}`)
      console.log(`🎪 Screens: ${screens.length}`)
      console.log(`⏰ Showtimes: ${showtimes.length}`)
      console.log(`🖼️  Banners: ${banners.length}`)
      console.log(`🎟️  Coupons: ${coupons.length}`)
      console.log('')
      console.log('✨ Frontend của bạn giờ đã có đầy đủ dữ liệu!')
      console.log('🎥 Bonus: Movies có YouTube trailers để preview!')
      console.log('👨‍🎭 Bonus: Cast members có profile images!')
    } catch (error: any) {
      console.error('💥 Lỗi khi seed dữ liệu:', error)
      throw error
    }
  }

  // Convenience methods for different batches
  async seedFirstBatch() {
    return this.seedAll(50, 0) // First 50 movies
  }

  async seedSecondBatch() {
    return this.seedAll(50, 50) // Next 50 movies
  }

  async seedThirdBatch() {
    return this.seedAll(50, 100) // Movies 100-150
  }
}

const cinemaSeederService = new CinemaDataSeeder('')
export default cinemaSeederService
