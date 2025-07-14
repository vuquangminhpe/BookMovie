import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
export const execFileAsync = promisify(execFile)

const MAXIMUM_BITRATE_720P = 5 * 10 ** 6 // 5Mbps
const MAXIMUM_BITRATE_1080P = 8 * 10 ** 6 // 8Mbps
const MAXIMUM_BITRATE_1440P = 16 * 10 ** 6 // 16Mbps

const checkVideoHasAudio = async (filePath: string): Promise<boolean> => {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'a:0',
    '-show_entries',
    'stream=codec_type',
    '-of',
    'default=nw=1:nk=1',
    filePath
  ])
  return stdout.trim() === 'audio'
}

const getBitrate = async (filePath: string): Promise<number> => {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=bit_rate',
    '-of',
    'default=nw=1:nk=1',
    filePath
  ])
  return Number(stdout.trim())
}

const getResolution = async (filePath: string): Promise<{ width: number; height: number }> => {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-of',
    'csv=s=x:p=0',
    filePath
  ])
  const [width, height] = stdout.trim().split('x').map(Number)
  return { width, height }
}

const getWidth = (height: number, resolution: { width: number; height: number }) => {
  const width = Math.round((height * resolution.width) / resolution.height)
  return width % 2 === 0 ? width : width + 1 // Ensure width is even
}

type EncodeByResolution = {
  inputPath: string
  isHasAudio: boolean
  resolution: { width: number; height: number }
  outputSegmentPath: string
  outputPath: string
  bitrate: {
    720: number
    1080: number
    1440: number
    original: number
  }
}

const runFfmpeg = async (args: string[]): Promise<void> => {
  await execFileAsync('ffmpeg', args)
}

const encodeMax720 = async (params: EncodeByResolution) => {
  const { bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution } = params

  const args = [
    '-y',
    '-i',
    inputPath,
    '-preset',
    'ultrafast',
    '-g',
    '48',
    '-crf',
    '23',
    '-sc_threshold',
    '0',
    '-map',
    '0:0',
    ...(isHasAudio ? ['-map', '0:1'] : []),
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-c:a',
    'copy',
    '-var_stream_map',
    isHasAudio ? 'v:0,a:0' : 'v:0',
    '-master_pl_name',
    'master.m3u8',
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_list_size',
    '0',
    '-hls_segment_filename',
    outputSegmentPath,
    outputPath
  ]

  await runFfmpeg(args)
}

const encodeMax1080 = async (params: EncodeByResolution) => {
  const { bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution } = params

  const args = [
    '-y',
    '-i',
    inputPath,
    '-preset',
    'veryslow',
    '-g',
    '48',
    '-crf',
    '17',
    '-sc_threshold',
    '0',
    '-map',
    '0:0',
    ...(isHasAudio ? ['-map', '0:1'] : []),
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-s:v:1',
    `${getWidth(1080, resolution)}x1080`,
    '-c:v:1',
    'libx264',
    '-b:v:1',
    `${bitrate[1080]}`,
    '-c:a',
    'copy',
    '-var_stream_map',
    isHasAudio ? 'v:0,a:0 v:1,a:1' : 'v:0 v:1',
    '-master_pl_name',
    'master.m3u8',
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_list_size',
    '0',
    '-hls_segment_filename',
    outputSegmentPath,
    outputPath
  ]

  await runFfmpeg(args)
}

const encodeMax1440 = async (params: EncodeByResolution) => {
  const { bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution } = params

  const args = [
    '-y',
    '-i',
    inputPath,
    '-preset',
    'veryslow',
    '-g',
    '48',
    '-crf',
    '17',
    '-sc_threshold',
    '0',
    '-map',
    '0:0',
    ...(isHasAudio ? ['-map', '0:1'] : []),
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-s:v:1',
    `${getWidth(1080, resolution)}x1080`,
    '-c:v:1',
    'libx264',
    '-b:v:1',
    `${bitrate[1080]}`,
    '-s:v:2',
    `${getWidth(1440, resolution)}x1440`,
    '-c:v:2',
    'libx264',
    '-b:v:2',
    `${bitrate[1440]}`,
    '-c:a',
    'copy',
    '-var_stream_map',
    isHasAudio ? 'v:0,a:0 v:1,a:1 v:2,a:2' : 'v:0 v:1 v2',
    '-master_pl_name',
    'master.m3u8',
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_list_size',
    '0',
    '-hls_segment_filename',
    outputSegmentPath,
    outputPath
  ]

  await runFfmpeg(args)
}

const encodeMaxOriginal = async (params: EncodeByResolution) => {
  const { bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution } = params

  const args = [
    '-y',
    '-i',
    inputPath,
    '-preset',
    'veryfast',
    '-g',
    '48',
    '-crf',
    '17',
    '-sc_threshold',
    '0',
    '-map',
    '0:0',
    ...(isHasAudio ? ['-map', '0:1'] : []),
    '-s:v:0',
    `${getWidth(720, resolution)}x720`,
    '-c:v:0',
    'libx264',
    '-b:v:0',
    `${bitrate[720]}`,
    '-s:v:1',
    `${getWidth(1080, resolution)}x1080`,
    '-c:v:1',
    'libx264',
    '-b:v:1',
    `${bitrate[1080]}`,
    '-s:v:2',
    `${resolution.width}x${resolution.height}`,
    '-c:v:2',
    'libx264',
    '-b:v:2',
    `${bitrate.original}`,
    '-c:a',
    'copy',
    '-var_stream_map',
    isHasAudio ? 'v:0,a:0 v:1,a:1 v:2,a:2' : 'v:0 v:1 v2',
    '-master_pl_name',
    'master.m3u8',
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_list_size',
    '0',
    '-hls_segment_filename',
    outputSegmentPath,
    outputPath
  ]

  await runFfmpeg(args)
}

export const encodeHLSWithMultipleVideoStreams = async (inputPath: string): Promise<boolean> => {
  console.log('🎬 Starting HLS encoding for:', inputPath)

  // ✅ Kiểm tra file input tồn tại
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video file not found: ${inputPath}`)
  }

  // ✅ Lấy thông tin file đúng cách
  const inputDir = path.dirname(inputPath) // /tmp/uploads/video-hls/56fidrXazurekrpHQ8d1E
  const inputBasename = path.basename(inputPath) // 56fidrXazurekrpHQ8d1E

  console.log('📁 Input dir:', inputDir)
  console.log('📄 Input file:', inputBasename)

  // ✅ FIXED: Output directory = input directory (cùng thư mục với file gốc)
  const outputDir = inputDir // NOT path.join(inputDir, inputNameWithoutExt)

  console.log('📁 Output dir:', outputDir)

  // ✅ Định nghĩa output paths đúng
  const outputSegmentPath = path.join(outputDir, 'v%v/fileSequence%d.ts')
  const outputPath = path.join(outputDir, 'v%v/prog_index.m3u8')

  console.log('📤 Output segment path:', outputSegmentPath)
  console.log('📤 Output path:', outputPath)

  const [bitrate, resolution] = await Promise.all([getBitrate(inputPath), getResolution(inputPath)])

  const bitrate720 = Math.min(bitrate, MAXIMUM_BITRATE_720P)
  const bitrate1080 = Math.min(bitrate, MAXIMUM_BITRATE_1080P)
  const bitrate1440 = Math.min(bitrate, MAXIMUM_BITRATE_1440P)
  const isHasAudio = await checkVideoHasAudio(inputPath)

  console.log(`🎯 Video resolution: ${resolution.width}x${resolution.height}`)
  console.log(`🎯 Has audio: ${isHasAudio}`)
  console.log(`🎯 Bitrates - 720p: ${bitrate720}, 1080p: ${bitrate1080}, Original: ${bitrate}`)

  const encodeFunc =
    resolution.height > 1440
      ? encodeMaxOriginal
      : resolution.height > 1080
        ? encodeMax1440
        : resolution.height > 720
          ? encodeMax1080
          : encodeMax720

  console.log(`🎯 Using encode function for ${resolution.height}p`)

  await encodeFunc({
    inputPath,
    isHasAudio,
    resolution,
    outputSegmentPath,
    outputPath,
    bitrate: {
      720: bitrate720,
      1080: bitrate1080,
      1440: bitrate1440,
      original: bitrate
    }
  })

  console.log('✅ HLS encoding completed for:', inputBasename)
  return true
}
