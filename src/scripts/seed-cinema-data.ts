// scripts/seed-cinema-data.ts
// Script để seed dữ liệu cinema từ TMDB API vào MongoDB

import { CinemaDataSeeder } from '../services/cinema-seeder.service'

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.TMDB_ACCESS_TOKEN || 'YOUR_TMDB_API_KEY_HERE'

async function runSeeder() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const movieCount = parseInt(args[0]) || 50
  const startIndex = parseInt(args[1]) || 0

  // Validate API key
  if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE' || !TMDB_API_KEY) {
    console.error('❌ TMDB API Key/Token chưa được cấu hình!')
    console.error('')
    console.error('🔑 Cách lấy TMDB credentials:')
    console.error('1. Đăng ký tại: https://www.themoviedb.org/')
    console.error('2. Vào Settings > API')
    console.error('3. Lấy một trong hai:')
    console.error('   📱 API Read Access Token (v4) - RECOMMEND')
    console.error('   🔑 API Key (v3) - Backup')
    console.error('')
    console.error('💡 Cách sử dụng:')
    console.error('export TMDB_API_KEY="your_api_key_or_access_token"')
    console.error('hoặc thay trực tiếp trong file này')
    console.error('')
    console.error('📝 Ví dụ:')
    console.error('- Access Token: eyJhbGciOiJIUzI1NiJ9...')
    console.error('- API Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')
    process.exit(1)
  }

  const tokenType = TMDB_API_KEY.startsWith('eyJ') ? 'v4 Access Token' : 'v3 API Key'
  console.log('🎬 Bắt đầu seed dữ liệu Cinema từ TMDB...')
  console.log(`🔑 Sử dụng ${tokenType}: ${TMDB_API_KEY.substring(0, 15)}...`)
  console.log(`📊 Lấy ${movieCount} movies bắt đầu từ index ${startIndex}`)
  console.log('')

  const seeder = new CinemaDataSeeder(TMDB_API_KEY)

  try {
    await seeder.seedAll(movieCount, startIndex)
    console.log('')
    console.log('🎉 Seed dữ liệu hoàn tất!')
    console.log('Frontend của bạn giờ đã có đầy đủ dữ liệu movies, theaters, showtimes!')
    console.log('')
    console.log('🚀 Các lệnh hữu ích tiếp theo:')
    console.log('- Seed 50 movies tiếp theo: npm run seed:cinema 50 50')
    console.log('- Seed 100 movies từ đầu: npm run seed:cinema 100 0')
    console.log('- Seed movies 100-150: npm run seed:cinema 50 100')
    process.exit(0)
  } catch (error: any) {
    console.error('')
    console.error('💥 Lỗi khi seed dữ liệu:', error.message)
    console.error('')
    console.error('🔍 Các nguyên nhân thường gặp:')
    console.error('- MongoDB chưa chạy')
    console.error('- TMDB API key/token không hợp lệ')
    console.error('- TMDB API key chưa được approve (check email)')
    console.error('- Kết nối mạng có vấn đề')
    console.error('- Rate limit bị vượt quá')

    if (error.response?.status === 401) {
      console.error('')
      console.error('🔑 Authentication Error - Thử:')
      if (TMDB_API_KEY.startsWith('eyJ')) {
        console.error('- Access Token có thể bị expired, tạo mới')
        console.error('- Hoặc thử dùng v3 API Key thay thế')
      } else {
        console.error('- API Key có thể chưa được approve')
        console.error('- Hoặc thử dùng v4 Access Token')
      }
    }

    process.exit(1)
  }
}

// Chạy seeder
runSeeder()
