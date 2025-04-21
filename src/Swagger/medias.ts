/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media upload and management
 *
 * /medias/upload-image:
 *   post:
 *     summary: Upload image
 *     description: Upload an image file (max 300KB)
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
 *                   type: string
 *                   example: "https://example-bucket.s3.amazonaws.com/images/123456789.jpg"
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
 *                 example: "https://example-bucket.s3.amazonaws.com/images/123456789.jpg"
 *               link:
 *                 type: string
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
 *     description: Get an image file by name
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Image filename
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
 */
