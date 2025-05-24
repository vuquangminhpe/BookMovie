import path from 'path'
import os from 'os'

const isProduction = process.env.NODE_ENV === 'production'

const getBaseDir = () => {
  if (isProduction) {
    try {
      const cwd = process.cwd()
      // Kiểm tra xem có thể tạo thư mục trong cwd không
      return cwd
    } catch (error) {
      console.warn('Cannot use process.cwd(), falling back to system temp directory')
      return os.tmpdir()
    }
  }

  return process.cwd()
}

const BASE_DIR = getBaseDir()

export const UPLOAD_TEMP_DIR = path.resolve(BASE_DIR, 'uploads/temp')
export const UPLOAD_IMAGES_DIR = path.resolve(BASE_DIR, 'uploads/Images')
export const UPLOAD_VIDEO_DIR = path.resolve(BASE_DIR, 'uploads/video')
export const UPLOAD_VIDEO_HLS_DIR = path.resolve(BASE_DIR, 'uploads/video-hls')

// Log đường dẫn để debug
console.log('Upload directories:')
console.log('- TEMP:', UPLOAD_TEMP_DIR)
console.log('- IMAGES:', UPLOAD_IMAGES_DIR)
console.log('- VIDEO:', UPLOAD_VIDEO_DIR)
console.log('- VIDEO_HLS:', UPLOAD_VIDEO_HLS_DIR)
