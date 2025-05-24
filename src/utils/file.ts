import { Request } from 'express'
import fs from 'fs'
import formidable, { Part } from 'formidable'
import { File } from 'formidable'
import { UPLOAD_IMAGES_DIR, UPLOAD_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_HLS_DIR } from '../constants/dir'
import path from 'path'

let nanoid: any
;(async () => {
  const module = await import('nanoid')
  nanoid = module.nanoid
})()

const isRender = process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID

// Tạo thư mục với error handling tốt hơn cho Render
const ensureDir = (dirPath: string) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`📁 Created directory: ${dirPath}`)
    }

    // Test write permission
    const testFile = path.join(dirPath, '.write-test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)

    return true
  } catch (error) {
    console.error(`❌ Failed to setup directory ${dirPath}:`, error)
    return false
  }
}

export const initFolderTemp = () => {
  const success = ensureDir(UPLOAD_TEMP_DIR)
  if (!success && isRender) {
    throw new Error('Cannot create temp directory on Render. Check permissions.')
  }
  return success
}

export const initFolderImage = () => {
  return ensureDir(UPLOAD_IMAGES_DIR)
}

export const initFolderVideo = () => {
  return ensureDir(UPLOAD_VIDEO_DIR)
}

export const initFolderVideoHls = () => {
  return ensureDir(UPLOAD_VIDEO_HLS_DIR)
}

// Cleanup function để xóa file ngay sau khi dùng
const cleanupFile = async (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
      console.log(`🗑️ Cleaned up: ${path.basename(filePath)}`)
    }
  } catch (error) {
    console.warn(`⚠️ Failed to cleanup ${filePath}:`, error)
  }
}

export const handleUploadImage = async (req: Request) => {
  // Đảm bảo thư mục temp tồn tại
  if (!initFolderTemp()) {
    throw new Error('Upload system not available')
  }

  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 10,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300KB - giảm để phù hợp Render
    maxTotalFileSize: 1200 * 1024, // 1.2MB total
    filter: function ({ name, originalFilename, mimetype }: Part) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }

      const imageFiles = files.image as File[]

      // Kiểm tra tất cả files có tồn tại không
      for (const file of imageFiles) {
        if (!fs.existsSync(file.filepath)) {
          // Cleanup các file khác nếu có
          for (const otherFile of imageFiles) {
            await cleanupFile(otherFile.filepath)
          }
          return reject(new Error(`Uploaded file not found: ${file.filepath}`))
        }
      }

      resolve(imageFiles)
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)

  // Đảm bảo thư mục tồn tại
  if (!fs.existsSync(UPLOAD_VIDEO_DIR)) {
    fs.mkdirSync(UPLOAD_VIDEO_DIR, { recursive: true })
  }
  fs.mkdirSync(folderPath, { recursive: true })

  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB - có thể cần giảm cho Render
    filter: function ({ name, originalFilename, mimetype }: Part) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename() {
      return idName + '.mp4'
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.video as File[])
    })
  })
}

export const handleUploadVideoHLS = async (req: Request) => {
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_HLS_DIR, idName)

  if (!fs.existsSync(UPLOAD_VIDEO_HLS_DIR)) {
    fs.mkdirSync(UPLOAD_VIDEO_HLS_DIR, { recursive: true })
  }
  fs.mkdirSync(folderPath, { recursive: true })

  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }: Part) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename() {
      return idName
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.video as File[])
    })
  })
}

export const getNameFromFullname = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}

// Recursive function to get files
export const getFiles = (dir: string, files: string[] = []) => {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory does not exist: ${dir}`)
    return files
  }

  try {
    const fileList = fs.readdirSync(dir)
    for (const file of fileList) {
      const name = `${dir}/${file}`
      try {
        if (fs.statSync(name).isDirectory()) {
          getFiles(name, files)
        } else {
          files.push(name)
        }
      } catch (error) {
        console.warn(`Error processing file ${name}:`, error)
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return files
}

// Utility function để cleanup toàn bộ thư mục temp
export const cleanupTempDirectory = async () => {
  try {
    if (!fs.existsSync(UPLOAD_TEMP_DIR)) return

    const files = fs.readdirSync(UPLOAD_TEMP_DIR)
    const cleanupPromises = files.map((file) => cleanupFile(path.join(UPLOAD_TEMP_DIR, file)))

    await Promise.all(cleanupPromises)
    console.log(`🧹 Cleaned up ${files.length} temp files`)
  } catch (error) {
    console.error('Error during temp cleanup:', error)
  }
}
