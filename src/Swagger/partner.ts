/**
 * @swagger
 * tags:
 *   name: Partner
 *   description: Partner management and movie operations
 *
 * components:
 *   schemas:
 *     Partner:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - company_name
 *         - theater_id
 *       properties:
 *         _id:
 *           type: string
 *           description: Partner ID
 *         name:
 *           type: string
 *           example: "Nguyễn Văn Anh"
 *         email:
 *           type: string
 *           format: email
 *           example: "partner@cgv.vn"
 *         phone:
 *           type: string
 *           example: "0901234567"
 *         company_name:
 *           type: string
 *           example: "CGV Cinemas Vietnam"
 *         theater_id:
 *           type: string
 *           description: Theater ID that this partner manages
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           example: "active"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     CreatePartnerRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - company_name
 *         - theater_id
 *       properties:
 *         name:
 *           type: string
 *           example: "Nguyễn Văn Anh"
 *         email:
 *           type: string
 *           format: email
 *           example: "partner@cgv.vn"
 *         phone:
 *           type: string
 *           example: "0901234567"
 *         company_name:
 *           type: string
 *           example: "CGV Cinemas Vietnam"
 *         theater_id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           example: "active"
 *
 *     PartnerMovie:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - duration
 *         - genre
 *         - language
 *         - release_date
 *         - director
 *         - poster_url
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *           example: "Avengers: Endgame"
 *         description:
 *           type: string
 *           example: "Epic superhero movie"
 *         duration:
 *           type: integer
 *           example: 180
 *         genre:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Action", "Adventure", "Drama"]
 *         language:
 *           type: string
 *           example: "English"
 *         release_date:
 *           type: string
 *           format: date
 *           example: "2024-05-01"
 *         director:
 *           type: string
 *           example: "Anthony Russo, Joe Russo"
 *         cast:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo"]
 *         poster_url:
 *           type: string
 *           format: url
 *           example: "https://example.com/poster.jpg"
 *         trailer_url:
 *           type: string
 *           format: url
 *           example: "https://example.com/trailer.m3u8"
 *         status:
 *           type: string
 *           enum: [coming_soon, now_showing, ended]
 *           example: "now_showing"
 *         partner_id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 */

/**
 * @swagger
 * /partners:
 *   post:
 *     summary: Create new partner
 *     description: Create a new cinema partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePartnerRequest'
 *     responses:
 *       201:
 *         description: Partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Create partner success"
 *                 result:
 *                   type: object
 *                   properties:
 *                     partner_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *       400:
 *         description: Validation error or theater already has partner
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     summary: Get all partners
 *     description: Get list of partners with filtering and pagination
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or company name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by partner status
 *       - in: query
 *         name: theater_id
 *         schema:
 *           type: string
 *         description: Filter by theater ID
 *     responses:
 *       200:
 *         description: Partners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get partners success"
 *                 result:
 *                   type: object
 *                   properties:
 *                     partners:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Partner'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *
 * /partners/{partner_id}:
 *   get:
 *     summary: Get partner by ID
 *     description: Get detailed information about a specific partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get partner success"
 *                 result:
 *                   $ref: '#/components/schemas/Partner'
 *       404:
 *         description: Partner not found
 *
 *   put:
 *     summary: Update partner
 *     description: Update partner information
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nguyễn Văn Bình"
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               company_name:
 *                 type: string
 *               theater_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Partner not found
 *
 *   delete:
 *     summary: Delete partner
 *     description: Delete a partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner deleted successfully
 *       404:
 *         description: Partner not found
 *
 * /partners/{partner_id}/movies:
 *   post:
 *     summary: Create movie for partner
 *     description: Create a new movie managed by the partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - duration
 *               - genre
 *               - language
 *               - release_date
 *               - director
 *               - poster_url
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Avengers: Endgame"
 *               description:
 *                 type: string
 *                 example: "Epic superhero movie"
 *               duration:
 *                 type: integer
 *                 example: 180
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Action", "Adventure"]
 *               language:
 *                 type: string
 *                 example: "English"
 *               release_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-01"
 *               director:
 *                 type: string
 *                 example: "Anthony Russo, Joe Russo"
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Robert Downey Jr.", "Chris Evans"]
 *               poster_url:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/poster.jpg"
 *               trailer_url:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/trailer.m3u8"
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *                 example: "coming_soon"
 *     responses:
 *       201:
 *         description: Movie created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Partner not found
 *
 *   get:
 *     summary: Get partner movies
 *     description: Get all movies managed by the partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by movie title
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [coming_soon, now_showing, ended]
 *     responses:
 *       200:
 *         description: Movies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     movies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PartnerMovie'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *
 * /partners/{partner_id}/movies/{movie_id}:
 *   put:
 *     summary: Update partner movie
 *     description: Update a movie managed by the partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               director:
 *                 type: string
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *               poster_url:
 *                 type: string
 *                 format: url
 *               trailer_url:
 *                 type: string
 *                 format: url
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *       404:
 *         description: Partner or movie not found
 *
 *   delete:
 *     summary: Delete partner movie
 *     description: Delete a movie managed by the partner
 *     tags: [Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       404:
 *         description: Partner or movie not found
 */
