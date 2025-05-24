import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'

const BASE_DIR = isProduction ? path.resolve(process.cwd()) : path.resolve(process.cwd())

export const UPLOAD_TEMP_DIR = path.resolve(BASE_DIR, 'uploads/temp')
export const UPLOAD_IMAGES_DIR = path.resolve(BASE_DIR, 'uploads/Images')
export const UPLOAD_VIDEO_DIR = path.resolve(BASE_DIR, 'uploads/video')
export const UPLOAD_VIDEO_HLS_DIR = path.resolve(BASE_DIR, 'uploads/video-hls')
