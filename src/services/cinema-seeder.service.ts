import databaseService from './database.services'
import Movie, { MovieStatus } from '../models/schemas/Movie.shema'
import Theater, { TheaterStatus } from '../models/schemas/Theater.schema'
import Screen, { SeatType, SeatStatus } from '../models/schemas/Screen.schema'
import Showtime, { ShowtimeStatus } from '../models/schemas/Showtime.schema'
import Banner, { BannerTypes, BannerStatus } from '../models/schemas/Banner.schema'
import Coupon, { CouponTypes, CouponStatus, CouponApplicableTo } from '../models/schemas/Coupon.schema'
import Partner, { PartnerStatus } from '../models/schemas/Partner.schema'
import { ObjectId } from 'mongodb'
import axios from 'axios'
import { ScreenType, ScreenStatus } from '../constants/enums'
import { uploadFileS3 } from '../utils/s3'
import fs from 'fs'
import path from 'path'
import mediaService from './medias.services'
import ytdl from '@distube/ytdl-core'
import { UPLOAD_VIDEO_DIR } from '../constants/dir'

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

interface TMDBService {
  getGenres(): Promise<{ genres: { id: number; name: string }[] }>
  getPopularMovies(page: number): Promise<{ results: TMDBMovie[] }>
  getTopRatedMovies(page: number): Promise<{ results: TMDBMovie[] }>
  getNowPlayingMovies(page: number): Promise<{ results: TMDBMovie[] }>
  getUpcomingMovies(page: number): Promise<{ results: TMDBMovie[] }>
  getMovieDetails(movieId: number): Promise<TMDBMovie>
}

// =============================================================================
// DATA TRANSFORMERS
// =============================================================================

class DataTransformer {
  static transformTMDBMovie(tmdbMovie: TMDBMovie, genres: any[]) {
    const movieGenres =
      tmdbMovie.genres || tmdbMovie.genre_ids?.map((id) => genres.find((g) => g.id === id)?.name || 'Unknown') || []

    const director = tmdbMovie.credits?.crew?.find((person) => person.job === 'Director')?.name || 'Unknown'

    const cast =
      tmdbMovie.credits?.cast?.slice(0, 10).map((actor) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        order: actor.order,
        profile_image: actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : '',
        gender: actor.gender
      })) || []

    const releaseDate = new Date(tmdbMovie.release_date)
    const now = new Date()

    let status = MovieStatus.NOW_SHOWING
    if (releaseDate > now) {
      status = MovieStatus.COMING_SOON
    } else if (releaseDate < new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)) {
      status = MovieStatus.ENDED
    }

    return {
      title: tmdbMovie.title,
      description: tmdbMovie.overview,
      duration: tmdbMovie.runtime || 120,
      genre: movieGenres,
      language:
        tmdbMovie.original_language === 'en'
          ? 'English'
          : tmdbMovie.original_language === 'ko'
            ? 'Korean'
            : tmdbMovie.original_language === 'ja'
              ? 'Japanese'
              : 'Other',
      release_date: releaseDate,
      director,
      cast,
      poster_url: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
      status,
      average_rating: Math.round(tmdbMovie.vote_average * 10) / 10,
      ratings_count: tmdbMovie.vote_count,
      is_featured: Math.random() > 0.7,
      featured_order: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : null
    }
  }

  static generateVietnamTheaters() {
    return [
      {
        name: 'CGV Vincom Center Landmark 81',
        location: 'Quận Bình Thạnh, TP.HCM',
        address: 'Tầng 3-4, Vincom Center Landmark 81, 720A Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
        city: 'TP.HCM',
        state: 'TP.HCM',
        pincode: '700000',
        screens: 12,
        amenities: ['4DX', 'IMAX', 'Dolby Atmos', 'VIP Seats', 'Food Court', 'Parking'],
        status: TheaterStatus.ACTIVE
      },
      {
        name: 'Lotte Cinema Landmark Plus',
        location: 'Quận 1, TP.HCM',
        address: 'Tầng 5-6, Vincom Center A, 171 Đồng Khởi, Quận 1, TP.HCM',
        city: 'TP.HCM',
        state: 'TP.HCM',
        pincode: '700000',
        screens: 10,
        amenities: ['Premium Seats', 'Dolby Atmos', '3D', 'Food Court', 'Parking'],
        status: TheaterStatus.ACTIVE
      },
      {
        name: 'Galaxy Cinema Nguyễn Du',
        location: 'Quận 1, TP.HCM',
        address: '116 Nguyễn Du, Quận 1, TP.HCM',
        city: 'TP.HCM',
        state: 'TP.HCM',
        pincode: '700000',
        screens: 8,
        amenities: ['Premium Seats', 'Dolby Atmos', 'Food Court'],
        status: TheaterStatus.ACTIVE
      },
      {
        name: 'BHD Star Bitexco',
        location: 'Quận 1, TP.HCM',
        address: 'Tầng 3-4, Bitexco Financial Tower, 2 Hải Triều, Quận 1, TP.HCM',
        city: 'TP.HCM',
        state: 'TP.HCM',
        pincode: '700000',
        screens: 7,
        amenities: ['Premium Seats', '3D', 'Food Court', 'Parking'],
        status: TheaterStatus.ACTIVE
      },
      {
        name: 'Cinestar Hai Bà Trưng',
        location: 'Quận 3, TP.HCM',
        address: '135 Hai Bà Trưng, Quận 3, TP.HCM',
        city: 'TP.HCM',
        state: 'TP.HCM',
        pincode: '700000',
        screens: 6,
        amenities: ['Standard Seats', 'Digital Sound', 'Concession'],
        status: TheaterStatus.ACTIVE
      },
      {
        name: 'CGV Vincom Bà Triệu',
        location: 'Hai Bà Trưng, Hà Nội',
        address: 'Tầng 4-5, Vincom Center Bà Triệu, 191 Bà Triệu, Hai Bà Trưng, Hà Nội',
        city: 'Hà Nội',
        state: 'Hà Nội',
        pincode: '100000',
        screens: 9,
        amenities: ['IMAX', 'Premium Seats', 'Dolby Atmos', 'Food Court', 'Parking'],
        status: TheaterStatus.ACTIVE
      },
      {
        name: 'Lotte Cinema Keangnam',
        location: 'Cầu Giấy, Hà Nội',
        address: 'Tầng 3, Keangnam Hanoi Landmark Tower, Phạm Hùng, Cầu Giấy, Hà Nội',
        city: 'Hà Nội',
        state: 'Hà Nội',
        pincode: '100000',
        screens: 8,
        amenities: ['Premium Seats', 'Dolby Atmos', '3D', 'Food Court'],
        status: TheaterStatus.ACTIVE
      },
      {
        name: 'Galaxy Cinema Mipec Long Biên',
        location: 'Long Biên, Hà Nội',
        address: 'Tầng 4, Mipec Long Biên, 2 Ngô Đức Kế, Long Biên, Hà Nội',
        city: 'Hà Nội',
        state: 'Hà Nội',
        pincode: '100000',
        screens: 7,
        amenities: ['Standard Seats', 'Digital Sound', 'Food Court'],
        status: TheaterStatus.ACTIVE
      }
    ]
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
    const now = new Date()
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Start from tomorrow

    // Time slots for different screenings
    const timeSlots = [
      { hour: 9, minute: 0 }, // 9:00 AM
      { hour: 11, minute: 30 }, // 11:30 AM
      { hour: 14, minute: 0 }, // 2:00 PM
      { hour: 16, minute: 30 }, // 4:30 PM
      { hour: 19, minute: 0 }, // 7:00 PM
      { hour: 21, minute: 30 }, // 9:30 PM
      { hour: 23, minute: 59 } // 11:59 PM
    ]

    for (let day = 0; day < 14; day++) {
      const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000)

      screens.forEach((screen) => {
        // Rotate movies for variety
        const moviesForScreen = [...movies].sort(() => 0.5 - Math.random()).slice(0, Math.min(6, movies.length))

        moviesForScreen.forEach((movie, movieIndex) => {
          const timeSlot = timeSlots[movieIndex % timeSlots.length]

          const startTime = new Date(currentDate)
          startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0)

          const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000)

          // Dynamic pricing
          let basePrice = 80000
          if (timeSlot.hour >= 19) basePrice = 100000
          if (screen.screen_type === ScreenType.IMAX) basePrice *= 1.5
          if (screen.screen_type === ScreenType.PREMIUM) basePrice *= 1.3

          showtimes.push({
            movie_id: movie._id,
            screen_id: screen._id,
            theater_id: screen.theater_id,
            start_time: startTime,
            end_time: endTime,
            price: {
              regular: Math.round(basePrice),
              premium: Math.round(basePrice * 1.2),
              recliner: Math.round(basePrice * 1.4),
              couple: Math.round(basePrice * 1.6)
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
    const featuredMovies = movies.filter((movie) => movie.is_featured).slice(0, 5)

    return featuredMovies.map((movie, index) => ({
      title: `${movie.title} - Now Showing`,
      description: movie.description.substring(0, 150) + '...',
      image_url: movie.poster_url,
      link_url: `/movies/${movie._id}`,
      type: BannerTypes.MOVIE_PROMOTION,
      status: BannerStatus.ACTIVE,
      display_order: index + 1,
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }))
  }

  static generateCoupons() {
    return [
      {
        code: 'WELCOME2024',
        name: 'Welcome Discount',
        description: 'Welcome discount for new users',
        discount_type: CouponTypes.PERCENTAGE,
        discount_value: 15,
        min_order_value: 100000,
        max_discount_amount: 50000,
        usage_limit: 1000,
        usage_limit_per_user: 1,
        applicable_to: CouponApplicableTo.ALL,
        status: CouponStatus.ACTIVE,
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'WEEKEND50',
        name: 'Weekend Special',
        description: '50k off for weekend bookings',
        discount_type: CouponTypes.FIXED_AMOUNT,
        discount_value: 50000,
        min_order_value: 200000,
        usage_limit: 500,
        usage_limit_per_user: 3,
        applicable_to: CouponApplicableTo.ALL,
        status: CouponStatus.ACTIVE,
        start_date: new Date(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    ]
  }
}

// =============================================================================
// MAIN CINEMA SEEDER SERVICE
// =============================================================================

class CinemaSeederService {
  private tmdbService: TMDBService

  constructor() {
    const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.TMDB_ACCESS_TOKEN

    // Initialize with default implementation first
    this.tmdbService = {
      getGenres: async () => ({ genres: [] }),
      getPopularMovies: async (page) => ({ results: [] }),
      getTopRatedMovies: async (page) => ({ results: [] }),
      getNowPlayingMovies: async (page) => ({ results: [] }),
      getUpcomingMovies: async (page) => ({ results: [] }),
      getMovieDetails: async (movieId) => ({}) as TMDBMovie
    }

    // Set up real implementation if API key is available
    this.initializeTMDBService(TMDB_API_KEY)
  }

  private async initializeTMDBService(apiKey?: string) {
    if (apiKey) {
      this.tmdbService = await this.createTMDBService(apiKey)
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

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

    // Clear new collections
    await databaseService.partners.deleteMany({})
    console.log('   ✅ Đã xóa partners')
  }

  // =============================================================================
  // YOUTUBE DOWNLOAD UTILITIES
  // =============================================================================

  async downloadYouTubeVideo(youtubeUrl: string): Promise<string> {
    try {
      console.log(`   🎬 Downloading: ${youtubeUrl}`)

      if (!ytdl.validateURL(youtubeUrl)) {
        throw new Error('Invalid YouTube URL')
      }

      const info = await ytdl.getInfo(youtubeUrl)
      const videoId = info.videoDetails.videoId
      const fileName = `trailer_${videoId}_${Date.now()}.mp4`
      const outputPath = path.join(UPLOAD_VIDEO_DIR, fileName)

      if (!fs.existsSync(UPLOAD_VIDEO_DIR)) {
        fs.mkdirSync(UPLOAD_VIDEO_DIR, { recursive: true })
      }

      const videoStream = ytdl(youtubeUrl, {
        quality: 'highest',
        filter: (format) =>
          format.container === 'mp4' && format.hasVideo && format.hasAudio && (format.height || 0) <= 1080
      })

      const writeStream = fs.createWriteStream(outputPath)

      return new Promise((resolve, reject) => {
        videoStream.pipe(writeStream)

        videoStream.on('progress', (chunkLength, downloaded, total) => {
          const percent = ((downloaded / total) * 100).toFixed(2)
          process.stdout.write(`\r     📥 ${percent}%`)
        })

        writeStream.on('finish', () => {
          console.log(`\n     ✅ Downloaded: ${fileName}`)
          resolve(outputPath)
        })

        writeStream.on('error', reject)
        videoStream.on('error', reject)
      })
    } catch (error) {
      console.error('     ❌ YouTube download error:', error)
      throw error
    }
  }

  // =============================================================================
  // S3 MEDIA UTILITIES
  // =============================================================================
  async createTMDBService(apiKey?: string): Promise<TMDBService> {
    if (!apiKey) {
      // Trả về mock nếu không có key
      return {
        getGenres: async () => ({ genres: [] }),
        getPopularMovies: async () => ({ results: [] }),
        getTopRatedMovies: async () => ({ results: [] }),
        getNowPlayingMovies: async () => ({ results: [] }),
        getUpcomingMovies: async () => ({ results: [] }),
        getMovieDetails: async () => ({}) as any
      }
    }

    const baseUrl = 'https://api.themoviedb.org/3'
    const headers = apiKey.startsWith('eyJ') ? { Authorization: `Bearer ${apiKey}` } : {}

    function get(url: string, params: any = {}) {
      return axios.get(`${baseUrl}${url}`, {
        params: apiKey?.startsWith('eyJ') ? params : { ...params, api_key: apiKey },
        headers
      })
    }

    return {
      getGenres: async () => {
        const res = await get('/genre/movie/list', { language: 'en-US' })
        return res.data
      },
      getPopularMovies: async (page: number) => {
        const res = await get('/movie/popular', { language: 'en-US', page })
        return res.data
      },
      getTopRatedMovies: async (page: number) => {
        const res = await get('/movie/top_rated', { language: 'en-US', page })
        return res.data
      },
      getNowPlayingMovies: async (page: number) => {
        const res = await get('/movie/now_playing', { language: 'en-US', page })
        return res.data
      },
      getUpcomingMovies: async (page: number) => {
        const res = await get('/movie/upcoming', { language: 'en-US', page })
        return res.data
      },
      getMovieDetails: async (movieId: number) => {
        const res = await get(`/movie/${movieId}`, {
          language: 'en-US',
          append_to_response: 'credits,videos'
        })
        return res.data
      }
    }
  }
  async downloadTMDBImageToS3(imagePath: string, type: 'poster' | 'cast'): Promise<string> {
    try {
      const imageUrl = `https://image.tmdb.org/t/p/original${imagePath}`
      const response = await axios.get(imageUrl, { responseType: 'stream' })

      const fileName = `${type}_${Date.now()}_${path.basename(imagePath)}.jpg`
      const tempPath = path.join(process.cwd(), 'temp', fileName)

      // Ensure temp dir exists
      const tempDir = path.dirname(tempPath)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      // Download to temp
      const writer = fs.createWriteStream(tempPath)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      // Upload to S3
      const s3Result = await uploadFileS3({
        filename: `movie-${type}s/${fileName}`,
        filePath: tempPath,
        contentType: 'image/jpeg'
      })

      // Cleanup temp file
      fs.unlinkSync(tempPath)

      return s3Result.Location as string
    } catch (error) {
      console.error(`     ❌ Error downloading ${type}:`, error)
      return ''
    }
  }

  // =============================================================================
  // MAIN SEEDING METHODS
  // =============================================================================

  async seedPartners() {
    console.log('👥 Tạo dữ liệu partners...')

    const partnersData = [
      { name: 'Nguyễn Văn Anh', email: 'partner1@cgv.vn', phone: '0901234567', company_name: 'CGV Cinemas Vietnam' },
      { name: 'Trần Thị Bình', email: 'partner2@lotte.vn', phone: '0907654321', company_name: 'Lotte Cinema Vietnam' },
      { name: 'Lê Minh Cường', email: 'partner3@galaxy.vn', phone: '0912345678', company_name: 'Galaxy Cinema' },
      { name: 'Phạm Thị Dung', email: 'partner4@bhd.vn', phone: '0909876543', company_name: 'BHD Star Cineplex' },
      { name: 'Hoàng Văn Em', email: 'partner5@cinestar.vn', phone: '0913579246', company_name: 'Cinestar Cinema' },
      { name: 'Vũ Thị Phượng', email: 'partner6@megags.vn', phone: '0918765432', company_name: 'Mega GS Cinemas' },
      { name: 'Đỗ Minh Tuấn', email: 'partner7@dcine.vn', phone: '0923456789', company_name: 'DCine Cinema' },
      { name: 'Bùi Thị Lan', email: 'partner8@platinum.vn', phone: '0934567890', company_name: 'Platinum Cineplex' }
    ]

    const theaters = await databaseService.theaters.find({}).limit(8).toArray()

    const partners = partnersData.map(
      (data, index) =>
        new Partner({
          ...data,
          theater_id: theaters[index]._id,
          status: PartnerStatus.ACTIVE
        })
    )

    await databaseService.partners.insertMany(partners)
    console.log(`   ✅ Đã thêm ${partners.length} partners`)

    return partners
  }

  async seedTheaters() {
    console.log('🏢 Tạo 8 rạp chiếu phim thực tế...')
    const theaterData = DataTransformer.generateVietnamTheaters()

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

  async seedMoviesWithS3Media(movieCount: number = 50, startIndex: number = 0) {
    console.log(`🎬 Seeding ${movieCount} movies với S3 media và HLS trailers...`)

    // Get genres first
    const genresData = await this.tmdbService.getGenres()
    const genres = genresData.genres

    // Calculate pages needed
    const totalNeeded = startIndex + movieCount
    const pagesNeeded = Math.ceil(totalNeeded / 20) + 1

    console.log(`📡 Lấy ${pagesNeeded} pages từ mỗi category...`)

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
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Deduplicate and slice
    const allMoviesMap = new Map()
    allMovies.forEach((movie) => {
      if (!allMoviesMap.has(movie.id)) {
        allMoviesMap.set(movie.id, movie)
      }
    })

    const uniqueMovies = Array.from(allMoviesMap.values()).slice(startIndex, startIndex + movieCount)
    console.log(`📊 Processing ${uniqueMovies.length} unique movies...`)

    // Get detailed information and process media
    const moviesWithS3Media = []

    for (let i = 0; i < uniqueMovies.length; i++) {
      const movie = uniqueMovies[i]
      console.log(`\n📽️ Processing ${i + 1}/${uniqueMovies.length}: ${movie.title}`)

      try {
        // Get detailed movie info
        const detailed = await this.tmdbService.getMovieDetails(movie.id)

        let posterS3Url = ''
        let trailerHLSUrl = ''
        let youtubeTrailerUrl = ''
        let castImagesS3: Record<number, string> = {}

        // 1. Download poster to S3
        if (detailed.poster_path) {
          console.log(`   📸 Downloading poster...`)
          posterS3Url = await this.downloadTMDBImageToS3(detailed.poster_path, 'poster')
          if (posterS3Url) console.log(`   ✅ Poster uploaded to S3`)
        }

        // 2. Download cast images to S3 (top 5 cast)
        if (detailed.credits?.cast) {
          console.log(`   👥 Downloading cast images...`)
          const topCast = detailed.credits.cast.slice(0, 5)

          for (const actor of topCast) {
            if (actor.profile_path) {
              const castImageUrl = await this.downloadTMDBImageToS3(actor.profile_path, 'cast')
              if (castImageUrl) {
                castImagesS3[actor.id] = castImageUrl
              }
            }
          }
          console.log(`   ✅ Downloaded ${Object.keys(castImagesS3).length} cast images`)
        }

        // 3. Process YouTube trailer to HLS
        if (detailed.videos?.results) {
          const youtubeTrailer = detailed.videos.results.find(
            (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
          )

          if (youtubeTrailer) {
            youtubeTrailerUrl = `https://www.youtube.com/watch?v=${youtubeTrailer.key}`

            try {
              console.log(`   🎥 Converting YouTube trailer to HLS...`)
              trailerHLSUrl = await mediaService.processYouTubeToHLS(youtubeTrailerUrl)

              console.log(`   ✅ HLS trailer ready`)
            } catch (trailerError: any) {
              console.error(`   ⚠️ Failed to convert trailer:`, trailerError.message)
            }
          } else {
            console.log(`   ℹ️ No YouTube trailer available`)
          }
        }

        // 4. Transform and create movie (using existing Movie schema)
        const transformedMovie = DataTransformer.transformTMDBMovie(detailed, genres)

        moviesWithS3Media.push(
          new Movie({
            ...transformedMovie,
            poster_url: posterS3Url || transformedMovie.poster_url, // S3 URL or fallback to TMDB
            trailer_url: trailerHLSUrl || undefined, // HLS URL or undefined
            // Update cast với S3 images
            cast: transformedMovie.cast.map((castMember: any) => ({
              ...castMember,
              profile_image: castImagesS3[castMember.id] || castMember.profile_image
            }))
          })
        )

        // Rate limiting
        if (i < uniqueMovies.length - 1) {
          console.log(`   ⏳ Waiting 3 seconds...`)
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing ${movie.title}:`, error.message)

        // Fallback: basic movie without S3 media
        const transformedMovie = DataTransformer.transformTMDBMovie(movie, genres)
        moviesWithS3Media.push(new Movie(transformedMovie))
      }
    }

    await databaseService.movies.insertMany(moviesWithS3Media)

    const successStats = {
      total: moviesWithS3Media.length,
      withS3Posters: moviesWithS3Media.filter((m) => m.poster_url && m.poster_url.includes('amazonaws')).length,
      withHLSTrailers: moviesWithS3Media.filter((m) => m.trailer_url && m.trailer_url.includes('.m3u8')).length,
      withS3CastImages: moviesWithS3Media.filter((m) =>
        m.cast.some((c) => c.profile_image && c.profile_image.includes('amazonaws'))
      ).length
    }

    console.log(`\n✅ Seeded ${successStats.total} movies`)
    console.log(`📸 ${successStats.withS3Posters} with S3 posters`)
    console.log(`🎬 ${successStats.withHLSTrailers} with HLS trailers`)
    console.log(`👥 ${successStats.withS3CastImages} with S3 cast images`)

    return moviesWithS3Media
  }

  async seedShowtimes(movies: any[], screens: any[]) {
    console.log('⏰ Tạo lịch chiếu theo vòng lặp cho 14 ngày tương lai...')
    const showtimeData = DataTransformer.generateShowtimes(movies, screens)

    const showtimes = showtimeData.map((data) => new Showtime(data))

    await databaseService.showtimes.insertMany(showtimes)
    console.log(`   ✅ Đã thêm ${showtimes.length} suất chiếu với rotation system`)

    return showtimes
  }

  async seedBanners(movies: any[]) {
    console.log('🖼️  Tạo banner cho trang chủ...')
    const bannerData = DataTransformer.generateBanners(movies)

    const banners = bannerData.map((data: any) => new Banner(data))

    await databaseService.banners.insertMany(banners)
    console.log(`   ✅ Đã thêm ${banners.length} banner`)

    return banners
  }

  async seedCoupons() {
    console.log('🎟️  Tạo mã giảm giá...')
    const couponData = DataTransformer.generateCoupons()

    const coupons = couponData.map((data: any) => new Coupon(data))

    await databaseService.coupons.insertMany(coupons)
    console.log(`   ✅ Đã thêm ${coupons.length} mã giảm giá`)

    return coupons
  }

  // =============================================================================
  // MAIN SEED FUNCTION
  // =============================================================================

  async seedAll(movieCount: number = 50, startIndex: number = 0) {
    try {
      // Connect to database
      await databaseService.connect()

      // Clear existing data
      await this.clearCollections()

      console.log('')
      console.log('🚀 === BẮT ĐẦU SEED DỮ LIỆU HOÀN CHỈNH ===')
      console.log('')

      // 1. Seed theaters (8 rạp thực tế)
      const theaters = await this.seedTheaters()

      // 2. Seed partners (1 partner = 1 rạp)
      const partners = await this.seedPartners()

      // 3. Seed screens cho theaters
      const screens = await this.seedScreens(theaters)

      // 4. Seed movies với S3 media và HLS trailers
      const movies = await this.seedMoviesWithS3Media(movieCount, startIndex)

      // 5. Seed showtimes với rotation và future dates
      const showtimes = await this.seedShowtimes(movies, screens)

      // 6. Seed banners và coupons
      const banners = await this.seedBanners(movies)
      const coupons = await this.seedCoupons()

      console.log('')
      console.log('🎉 === HOÀN TẤT SEED DỮ LIỆU! ===')
      console.log('')
      console.log('📊 Summary:')
      console.log(`   🏢 Theaters: ${theaters.length}`)
      console.log(`   👥 Partners: ${partners.length}`)
      console.log(`   🎪 Screens: ${screens.length}`)
      console.log(`   🎬 Movies: ${movies.length}`)
      console.log(
        `   📸 Movies with S3 posters: ${movies.filter((m) => m.poster_url && m.poster_url.includes('amazonaws')).length}`
      )
      console.log(
        `   🎥 Movies with HLS trailers: ${movies.filter((m) => m.trailer_url && m.trailer_url.includes('.m3u8')).length}`
      )
      console.log(`   ⏰ Showtimes: ${showtimes.length}`)
      console.log(`   🖼️  Banners: ${banners.length}`)
      console.log(`   🎟️  Coupons: ${coupons.length}`)
      console.log('')

      return {
        theaters: theaters.length,
        partners: partners.length,
        screens: screens.length,
        movies: movies.length,
        moviesWithS3Posters: movies.filter((m) => m.poster_url && m.poster_url.includes('amazonaws')).length,
        moviesWithHLSTrailers: movies.filter((m) => m.trailer_url && m.trailer_url.includes('.m3u8')).length,
        showtimes: showtimes.length,
        banners: banners.length,
        coupons: coupons.length
      }
    } catch (error) {
      console.error('❌ Seed error:', error)
      throw error
    }
  }
}

const cinemaSeederService = new CinemaSeederService()
export default cinemaSeederService
