/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media upload and management
 *
 * /medias/upload-image:
 *   post:
 *     summary: Upload image
 *     description: Upload an image file (max 300KB, formats: JPG, PNG, etc.)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, etc.)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Upload success"
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         example: "https://example-bucket.s3.amazonaws.com/Images/123456789.jpg"
 *                       type:
 *                         type: string
 *                         example: "Image"
 *       400:
 *         description: Invalid file or error in upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File type is not valid"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /medias/upload-video:
 *   post:
 *     summary: Upload video
 *     description: Upload a video file to S3 storage
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (MP4, AVI, MOV, etc.)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Upload success"
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         example: "https://example-bucket.s3.amazonaws.com/Videos/video123.mp4"
 *                       type:
 *                         type: string
 *                         example: "Video"
 *       400:
 *         description: Invalid file or error in upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File type is not valid"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /medias/upload-video-hls:
 *   post:
 *     summary: Upload video for HLS streaming
 *     description: Upload a video file that will be processed for HLS streaming with multiple quality levels
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file to be processed for HLS streaming
 *     responses:
 *       200:
 *         description: Video uploaded and queued for HLS processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Upload success"
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         example: "https://example-bucket.s3.amazonaws.com/videos-hls/video123/master.m3u8"
 *                       type:
 *                         type: string
 *                         example: "HLS"
 *       400:
 *         description: Invalid file or error in upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File type is not valid"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /medias/video-status/{id}:
 *   get:
 *     summary: Get video processing status
 *     description: Check the current processing status of an uploaded video for HLS conversion
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID/filename to check status
 *         example: "video123.mp4"
 *     responses:
 *       200:
 *         description: Video status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get video status success"
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       example: "video123.mp4"
 *                     status:
 *                       type: string
 *                       enum: ["Pending", "Processing", "Success", "Failed"]
 *                       example: "Processing"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:05:00.000Z"
 *       404:
 *         description: Video status not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video status not found"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 
 * /medias/delete-s3:
 *   post:
 *     summary: Delete file from S3
 *     description: Delete a file or folder from S3 storage
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, link]
 *             properties:
 *               url:
 *                 type: string
 *                 description: Full S3 URL of the file to delete
 *                 example: "https://example-bucket.s3.amazonaws.com/images/123456789.jpg"
 *               link:
 *                 type: string
 *                 description: Relative path of the file in S3 bucket
 *                 example: "images/123456789.jpg"
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Delete success"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /static/image/{name}:
 *   get:
 *     summary: Serve image
 *     description: Get an image file by name from local storage
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Image filename
 *         example: "image123.jpg"
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Not found"
 *
 * /static/video-stream/{name}:
 *   get:
 *     summary: Stream video
 *     description: Stream a video file with support for range requests (partial content)
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Video filename
 *         example: "video123.mp4"
 *       - in: header
 *         name: Range
 *         required: false
 *         schema:
 *           type: string
 *         description: HTTP Range header for partial content requests
 *         example: "bytes=0-1023"
 *     responses:
 *       200:
 *         description: Full video file
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: Size of the video file
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME type of the video
 *       206:
 *         description: Partial video content (range request)
 *         content:
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Range:
 *             schema:
 *               type: string
 *             description: Range of bytes being served
 *             example: "bytes 0-1023/2048000"
 *           Accept-Ranges:
 *             schema:
 *               type: string
 *             description: Indicates server accepts range requests
 *             example: "bytes"
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: Size of the partial content
 *       404:
 *         description: Video not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 *
 * /static/video-hls/{id}/master.m3u8:
 *   get:
 *     summary: Get HLS master playlist
 *     description: Retrieve the master M3U8 playlist file for HLS video streaming
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID for HLS streaming
 *         example: "video123"
 *     responses:
 *       200:
 *         description: M3U8 playlist file
 *         content:
 *           application/vnd.apple.mpegurl:
 *             schema:
 *               type: string
 *               example: |
 *                 #EXTM3U
 *                 #EXT-X-VERSION:3
 *                 #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
 *                 360p/index.m3u8
 *                 #EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
 *                 480p/index.m3u8
 *       404:
 *         description: Playlist not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Not found"
 *
 * /static/video-hls/{id}/{quality}/{segment}:
 *   get:
 *     summary: Get HLS video segment
 *     description: Retrieve a specific video segment file for HLS streaming
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *         example: "video123"
 *       - in: path
 *         name: quality
 *         required: true
 *         schema:
 *           type: string
 *         description: Video quality level
 *         example: "480p"
 *       - in: path
 *         name: segment
 *         required: true
 *         schema:
 *           type: string
 *         description: Segment filename
 *         example: "segment001.ts"
 *     responses:
 *       200:
 *         description: Video segment file
 *         content:
 *           video/mp2t:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Segment not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Not found"
 *
 * components:
 *   schemas:
 *     MediaUploadResponse:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: S3 URL of the uploaded file
 *         type:
 *           type: string
 *           enum: ["Image", "Video", "HLS"]
 *           description: Type of media uploaded
 *     
 *     VideoStatus:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the video status
 *         name:
 *           type: string
 *           description: Original filename of the video
 *         status:
 *           type: string
 *           enum: ["Pending", "Processing", "Success", "Failed"]
 *           description: Current processing status
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the video was uploaded
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last status update time
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Access token is required"
 *     
 *     ValidationError:
 *       description: Request validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Validation error"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 *     
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Internal server error"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
