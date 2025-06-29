import fs from 'fs'
import path from 'path'
import { UPLOAD_VIDEO_HLS_DIR } from '../constants/dir'
import ytdl from '@distube/ytdl-core'

// src/utils/youtube-download.ts
export const downloadYouTubeVideo = async (youtubeUrl: string): Promise<string> => {
  console.log(`🎬 Downloading: ${youtubeUrl}`)

  if (!ytdl.validateURL(youtubeUrl)) {
    throw new Error('Invalid YouTube URL')
  }

  const info = await ytdl.getInfo(youtubeUrl)
  const videoId = info.videoDetails.videoId

  // Tạo unique folder name (như handleUploadVideoHLS)
  const folderName = `trailer_${videoId}_${Date.now()}`
  const folderPath = path.join(UPLOAD_VIDEO_HLS_DIR, folderName)

  // Tạo folder structure như handleUploadVideoHLS
  if (!fs.existsSync(UPLOAD_VIDEO_HLS_DIR)) {
    fs.mkdirSync(UPLOAD_VIDEO_HLS_DIR, { recursive: true })
  }
  fs.mkdirSync(folderPath, { recursive: true })

  // File sẽ nằm TRONG folder
  const fileName = `${folderName}.mp4`
  const outputPath = path.join(folderPath, fileName)

  const videoStream = ytdl(youtubeUrl, {
    quality: 'highest',
    filter: (format) => format.container === 'mp4' && format.hasVideo && format.hasAudio && (format.height || 0) <= 1080
  })

  const writeStream = fs.createWriteStream(outputPath)

  return new Promise((resolve, reject) => {
    videoStream.pipe(writeStream)

    videoStream.on('progress', (chunkLength, downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2)
      process.stdout.write(`\r   📥 ${percent}%`)
    })

    writeStream.on('finish', () => {
      console.log(`\n   ✅ Downloaded: ${fileName}`)
      resolve(outputPath)
    })

    writeStream.on('error', reject)
    videoStream.on('error', reject)
  })
}
