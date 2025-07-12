import { Request } from 'express'
import {
  getFiles,
  getNameFromFullname,
  handleUploadImage,
  handleUploadVideo,
  handleUploadVideoHLS
} from '../utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGES_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_HLS_DIR } from '../constants/dir'
import path from 'path'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { EncodingStatus, MediaType } from '../constants/enums'
import { Media } from '../models/Other'
import { encodeHLSWithMultipleVideoStreams } from '../utils/video'
import databaseService from './database.services'
import VideoStatus from '../models/schemas/VideoStatus.schema'
import { uploadFileS3 } from '../utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { downloadYouTubeVideo } from '../utils/youtube-download'
import { ObjectId } from 'mongodb'

let mime: any
;(async () => {
  const mimeModule = await import('mime')
  mime = mimeModule
})()

const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID

const immediateCleanup = async (filePaths: string[]) => {
  const cleanupPromises = filePaths.map(async (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
          // ✅ Cleanup thư mục recursively
          await fs.promises.rm(filePath, { recursive: true, force: true })
          console.log(`🗑️ Cleaned directory: ${path.basename(filePath)}`)
        } else {
          await fs.promises.unlink(filePath)
          console.log(`🗑️ Cleaned file: ${path.basename(filePath)}`)
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup ${filePath}:`, error)
    }
  })

  await Promise.allSettled(cleanupPromises)
}

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // ✅ Debug input path
      console.log('🔄 Queue received path:', item)

      // ✅ Kiểm tra file tồn tại ngay từ đầu
      if (!fs.existsSync(item)) {
        console.error('❌ File not found in queue:', item)
        return reject(new Error(`Video file not found: ${item}`))
      }

      this.items.push(item)

      // ✅ Lấy tên file đúng cách
      const fileName = path.basename(item)
      console.log('📄 Extracted filename:', fileName)

      if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
        console.error('enqueue error: Invalid video file name', { item, fileName })
        return reject(new Error('Invalid video file name'))
      }

      if (typeof EncodingStatus.Pending === 'undefined') {
        console.error('enqueue error: EncodingStatus.Pending is undefined')
        return reject(new Error('EncodingStatus.Pending is undefined'))
      }

      const Id = new ObjectId()
      const videoStatusObj = new VideoStatus({
        _id: Id,
        name: fileName, // ✅ Dùng fileName thay vì idName
        status: EncodingStatus.Pending
      })

      console.log('💾 Insert VideoStatus:', videoStatusObj)
      const plainVideoStatus = JSON.parse(JSON.stringify(videoStatusObj))

      databaseService.videoStatus
        .insertOne(plainVideoStatus)
        .then(() => {
          this.processEncode(resolve, reject)
        })
        .catch(reject)
    })
  }

  async processEncode(onComplete?: (m3u8Url: string) => void, onError?: (error: any) => void) {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]

      console.log('🎬 Processing video:', videoPath)

      // ✅ Kiểm tra file input tồn tại
      if (!fs.existsSync(videoPath)) {
        console.error('❌ Video file not found:', videoPath)
        const error = new Error(`Video file not found: ${videoPath}`)
        if (onError) onError(error)
        this.encoding = false
        return
      }

      const fileName = path.basename(videoPath)
      const fileNameWithoutExt = path.basename(videoPath, path.extname(videoPath))

      console.log('📄 Processing file:', fileName)
      console.log('🏷️ Name without ext:', fileNameWithoutExt)

      await databaseService.videoStatus.updateOne(
        { name: fileName }, // ✅ Dùng fileName đầy đủ
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            update_at: true
          }
        }
      )

      try {
        // ✅ Encode video với input path đúng
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()

        // ✅ Tìm thư mục output đúng
        const videoDir = path.dirname(videoPath)
        const hlsOutputDir = path.join(videoDir, fileNameWithoutExt)

        console.log('📁 Looking for HLS files in:', hlsOutputDir)

        // ✅ Kiểm tra thư mục output tồn tại
        if (!fs.existsSync(hlsOutputDir)) {
          throw new Error(`HLS output directory not found: ${hlsOutputDir}`)
        }

        const files = getFiles(hlsOutputDir)
        console.log(`📦 Found ${files.length} files to upload for video: ${fileName}`)

        let m3u8Url = ''
        const filesToCleanup: string[] = [videoPath] // ✅ Thêm video gốc vào cleanup

        console.log(`☁️ Uploading ${files.length} files to S3...`)

        await Promise.all(
          files.map(async (filepath) => {
            filesToCleanup.push(filepath)
            // ✅ Tạo S3 filename đúng
            const relativePath = path.relative(videoDir, filepath)
            const fileName = 'videos-hls/' + relativePath.replace(/\\/g, '/')

            console.log(`📤 Uploading: ${relativePath} -> ${fileName}`)

            const s3Upload = await uploadFileS3({
              filePath: filepath,
              filename: fileName,
              contentType: mime.default.getType(filepath) as string
            })

            if (filepath.endsWith('master.m3u8')) {
              m3u8Url = (s3Upload as CompleteMultipartUploadCommandOutput).Location as string
              console.log('🎯 Found master.m3u8 URL:', m3u8Url)
            }
            return s3Upload
          })
        )

        // ✅ Cleanup toàn bộ
        console.log(`🧹 Cleaning up ${filesToCleanup.length} files...`)
        await immediateCleanup(filesToCleanup)

        // ✅ Cleanup thư mục HLS
        if (fs.existsSync(hlsOutputDir)) {
          await fs.promises.rm(hlsOutputDir, { recursive: true, force: true })
          console.log('🗑️ Removed HLS directory:', hlsOutputDir)
        }

        await databaseService.videoStatus.updateOne(
          { name: fileName },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              update_at: true
            }
          }
        )

        console.log(`✅ Successfully encoded and uploaded: ${fileName}`)
        console.log(`🎯 M3U8 URL: ${m3u8Url}`)

        if (onComplete) {
          if (m3u8Url) {
            onComplete(m3u8Url)
          } else {
            onError && onError(new Error('No master.m3u8 URL found'))
          }
        }
      } catch (error) {
        console.error(`❌ Encode video ${videoPath} error:`, error)

        // ✅ Enhanced cleanup on error
        const videoDir = path.dirname(videoPath)
        const hlsOutputDir = path.join(videoDir, fileNameWithoutExt)
        const cleanupPaths = [videoPath]

        if (fs.existsSync(hlsOutputDir)) {
          cleanupPaths.push(hlsOutputDir)
        }

        await immediateCleanup(cleanupPaths)

        await databaseService.videoStatus
          .updateOne(
            { name: fileName },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                update_at: true
              }
            }
          )
          .catch((err) => {
            console.log('Update video status error', err)
          })

        if (onError) onError(error)
      }

      this.encoding = false
      this.processEncode(onComplete, onError)
    }
  }
}

const queue = new Queue()

class MediaService {
  async uploadImage(req: Request) {
    const startTime = Date.now()
    const filesToCleanup: string[] = []

    try {
      console.log('📤 Starting image upload...')
      const files = await handleUploadImage(req)

      const result = await Promise.all(
        files.map(async (file, index) => {
          const fileStartTime = Date.now()
          filesToCleanup.push(file.filepath)

          try {
            // Kiểm tra file tồn tại
            if (!fs.existsSync(file.filepath)) {
              throw new Error(`Uploaded file not found: ${file.filepath}`)
            }

            const newName = getNameFromFullname(file.newFilename)
            const newFullFileName = `${newName}.jpg`
            const processedPath = path.resolve(UPLOAD_IMAGES_DIR, newFullFileName)
            filesToCleanup.push(processedPath)

            // Đảm bảo thư mục images tồn tại
            if (!fs.existsSync(UPLOAD_IMAGES_DIR)) {
              fs.mkdirSync(UPLOAD_IMAGES_DIR, { recursive: true })
            }

            // Xử lý ảnh với sharp (với options tối ưu cho Render)
            try {
              await sharp(file.filepath)
                .jpeg({
                  quality: 85, // Giảm quality để tiết kiệm dung lượng
                  progressive: true
                })
                .resize(2048, 2048, {
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .toFile(processedPath)
            } catch (sharpError) {
              console.warn('Sharp processing failed, using direct copy:', sharpError)
              await fs.promises.copyFile(file.filepath, processedPath)
            }

            // Upload lên S3 ngay lập tức
            const s3Result = await uploadFileS3({
              filename: 'Images/' + newFullFileName,
              filePath: processedPath,
              contentType: mime.default.getType(newFullFileName) as string
            })

            console.log(`✅ File ${index + 1} uploaded in ${Date.now() - fileStartTime}ms`)

            return {
              url: (s3Result as CompleteMultipartUploadCommandOutput).Location,
              type: MediaType.Image
            }
          } catch (fileError) {
            console.error('Error processing file:', file.filepath, fileError)
            throw fileError
          }
        })
      )

      console.log(`🎉 All images uploaded in ${Date.now() - startTime}ms`)
      return result
    } catch (error) {
      console.error('❌ Upload image service error:', error)
      throw error
    } finally {
      // Cleanup tất cả files bất kể thành công hay thất bại
      if (filesToCleanup.length > 0) {
        console.log(`🧹 Cleaning up ${filesToCleanup.length} files...`)
        await immediateCleanup(filesToCleanup)
      }
    }
  }

  async uploadVideo(req: Request) {
    const filesToCleanup: string[] = []

    try {
      const files = await handleUploadVideo(req)

      const result = await Promise.all(
        files.map(async (file) => {
          filesToCleanup.push(file.filepath)

          const s3Result = await uploadFileS3({
            filename: 'Videos/' + file.newFilename,
            contentType: file.mimetype as string,
            filePath: file.filepath
          })

          // Không tạo local copy cho video trên Render
          // Vì sẽ tốn dung lượng và không cần thiết

          return {
            url: (s3Result as CompleteMultipartUploadCommandOutput).Location,
            type: MediaType.Video
          }
        })
      )

      return result
    } finally {
      await immediateCleanup(filesToCleanup)
    }
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req)

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const m3u8Url = await queue.enqueue(file.filepath)

        return {
          url: m3u8Url,
          type: MediaType.HLS
        }
      })
    )

    return result
  }

  async getVideoStatus(idStatus: string) {
    const result = await databaseService.videoStatus.findOne({ name: idStatus })
    return result
  }
  async processYouTubeToHLS(youtubeUrl: string): Promise<string> {
    let tempVideoPath = ''

    try {
      //  Download YouTube video
      tempVideoPath = await downloadYouTubeVideo(youtubeUrl)

      //  existing queue để convert HLS
      const m3u8Url = await queue.enqueue(tempVideoPath)

      return m3u8Url
    } catch (error) {
      // Cleanup temp file
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath)
      }
      throw error
    }
  }
}

const mediaService = new MediaService()

// Render.com: Setup cleanup interval để giữ /tmp sạch sẽ
if (isRender) {
  setInterval(
    async () => {
      try {
        const tempFiles = fs.readdirSync('/tmp')
        const oldFiles = tempFiles.filter((file) => {
          try {
            const filePath = path.join('/tmp', file)
            const stats = fs.statSync(filePath)
            const age = Date.now() - stats.mtime.getTime()
            return age > 30 * 60 * 1000 // 30 minutes
          } catch {
            return false
          }
        })

        if (oldFiles.length > 0) {
          await immediateCleanup(oldFiles.map((f) => path.join('/tmp', f)))
          console.log(`🧹 Cleaned ${oldFiles.length} old files from /tmp`)
        }
      } catch (error) {
        console.error('Periodic cleanup error:', error)
      }
    },
    10 * 60 * 1000
  ) // Every 10 minutes
}

export default mediaService
