/**
 * @swagger
 * /staff/contract:
 *   get:
 *     summary: Get my contract details
 *     description: Staff only - Get current active contract details
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contract details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get contract success
 *                 result:
 *                   $ref: '#/components/schemas/Contract'
 *       404:
 *         description: No active contract found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No active contract found
 *                 result:
 *                   type: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as staff
 *
 * /staff/theater:
 *   post:
 *     summary: Create theater
 *     description: Staff only - Create a new theater (staff can only create one theater)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - address
 *               - city
 *               - state
 *               - pincode
 *               - screens
 *             properties:
 *               name:
 *                 type: string
 *                 description: Theater name
 *                 example: "Cinema Plus Downtown"
 *               location:
 *                 type: string
 *                 description: Theater location
 *                 example: "Downtown District"
 *               address:
 *                 type: string
 *                 description: Theater address
 *                 example: "123 Main Street"
 *               city:
 *                 type: string
 *                 description: Theater city
 *                 example: "Ho Chi Minh City"
 *               state:
 *                 type: string
 *                 description: Theater state
 *                 example: "Ho Chi Minh"
 *               pincode:
 *                 type: string
 *                 description: Theater pincode
 *                 example: "700000"
 *               screens:
 *                 type: integer
 *                 description: Number of screens
 *                 example: 8
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Theater amenities
 *                 example: ["Parking", "Food Court", "AC", "Wheelchair Access"]
 *               contact_phone:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "0901234567"
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *                 example: "contact@cinemaplus.com"
 *               description:
 *                 type: string
 *                 description: Theater description
 *                 example: "Premium cinema experience in downtown"
 *     responses:
 *       200:
 *         description: Theater created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create theater success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theater_id:
 *                       type: string
 *       400:
 *         description: Staff can only create one theater or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as staff or no valid contract
 *
 * /staff/theater/mine:
 *   get:
 *     summary: Get my theater details
 *     description: Staff only - Get theater managed by current staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Theater details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get my theater success
 *                 result:
 *                   $ref: '#/components/schemas/Theater'
 *       404:
 *         description: No theater found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No theater found. Please create your theater first.
 *                 result:
 *                   type: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as staff
 *
 * /staff/theater/{theater_id}:
 *   get:
 *     summary: Get theater details
 *     description: Staff only - Get specific theater details (must own the theater)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     responses:
 *       200:
 *         description: Theater details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get theater success
 *                 result:
 *                   $ref: '#/components/schemas/Theater'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to access this theater
 *       404:
 *         description: Theater not found
 *
 *   put:
 *     summary: Update my theater
 *     description: Staff only - Update theater information (must own the theater)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Theater name
 *               location:
 *                 type: string
 *                 description: Theater location
 *               address:
 *                 type: string
 *                 description: Theater address
 *               city:
 *                 type: string
 *                 description: Theater city
 *               state:
 *                 type: string
 *                 description: Theater state
 *               pincode:
 *                 type: string
 *                 description: Theater pincode
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Theater amenities
 *               contact_phone:
 *                 type: string
 *                 description: Contact phone number
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               description:
 *                 type: string
 *                 description: Theater description
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 description: Theater status
 *     responses:
 *       200:
 *         description: Theater updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update theater success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theater_id:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this theater
 *       404:
 *         description: Theater not found
 *
 * /staff/theater/{theater_id}/screens:
 *   get:
 *     summary: Get screens of my theater
 *     description: Staff only - Get all screens for staff's theater
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Screens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get screens success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screens:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Screen'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to access this theater
 *
 *   post:
 *     summary: Create screen for my theater
 *     description: Staff only - Create a new screen for staff's theater
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - seat_layout
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 description: Screen name
 *                 example: "Screen 1"
 *               seat_layout:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: string
 *                         description: Seat row identifier
 *                       number:
 *                         type: integer
 *                         description: Seat number
 *                       type:
 *                         type: string
 *                         enum: [regular, premium, recliner, couple]
 *                         description: Seat type
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, maintenance]
 *                         description: Seat status
 *                 description: Seat layout matrix
 *               capacity:
 *                 type: integer
 *                 description: Total screen capacity
 *                 example: 150
 *               screen_type:
 *                 type: string
 *                 enum: [standard, premium, imax, 3d, 4dx]
 *                 description: Screen type
 *                 default: standard
 *     responses:
 *       200:
 *         description: Screen created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create screen success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screen_id:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to create screen for this theater
 *
 * /staff/screens/{screen_id}:
 *   get:
 *     summary: Get screen details
 *     description: Staff only - Get specific screen details
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: screen_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Screen ID
 *     responses:
 *       200:
 *         description: Screen details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get screen success
 *                 result:
 *                   $ref: '#/components/schemas/Screen'
 *       404:
 *         description: Screen not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update screen
 *     description: Staff only - Update screen information
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: screen_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Screen ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Screen name
 *               seat_layout:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                 description: Seat layout matrix
 *               capacity:
 *                 type: integer
 *                 description: Screen capacity
 *               screen_type:
 *                 type: string
 *                 enum: [standard, premium, imax, 3d, 4dx]
 *                 description: Screen type
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 description: Screen status
 *     responses:
 *       200:
 *         description: Screen updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update screen success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screen_id:
 *                       type: string
 *       404:
 *         description: Screen not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete screen
 *     description: Staff only - Delete a screen
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: screen_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Screen ID
 *     responses:
 *       200:
 *         description: Screen deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete screen success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screen_id:
 *                       type: string
 *       404:
 *         description: Screen not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/movies:
 *   get:
 *     summary: Get movies
 *     description: Staff only - Get list of movies with filtering options
 *     tags: [Staff]
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
 *         description: Number of items per page
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
 *         description: Filter by movie status
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
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
 *                   example: Get movies success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Movie'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     summary: Create movie
 *     description: Staff only - Create a new movie
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
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
 *               - cast
 *               - poster_url
 *             properties:
 *               title:
 *                 type: string
 *                 description: Movie title
 *                 example: "Avatar: The Way of Water"
 *               description:
 *                 type: string
 *                 description: Movie description
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 example: 192
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Movie genres
 *                 example: ["Action", "Adventure", "Sci-Fi"]
 *               language:
 *                 type: string
 *                 description: Movie language
 *                 example: "English"
 *               release_date:
 *                 type: string
 *                 format: date
 *                 description: Release date
 *               director:
 *                 type: string
 *                 description: Movie director
 *                 example: "James Cameron"
 *               cast:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     character:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     profile_image:
 *                       type: string
 *                     gender:
 *                       type: integer
 *                 description: Movie cast
 *               poster_url:
 *                 type: string
 *                 description: Poster image URL
 *               trailer_url:
 *                 type: string
 *                 description: Trailer video URL
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *                 description: Movie status
 *                 default: coming_soon
 *     responses:
 *       200:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create movie success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movie_id:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as staff
 *
 * /staff/movies/{movie_id}:
 *   get:
 *     summary: Get movie details
 *     description: Staff only - Get specific movie details
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get movie success
 *                 result:
 *                   $ref: '#/components/schemas/Movie'
 *       404:
 *         description: Movie not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update movie
 *     description: Staff only - Update movie information
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *                 description: Movie title
 *               description:
 *                 type: string
 *                 description: Movie description
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Movie genres
 *               language:
 *                 type: string
 *                 description: Movie language
 *               release_date:
 *                 type: string
 *                 format: date
 *                 description: Release date
 *               director:
 *                 type: string
 *                 description: Movie director
 *               cast:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Movie cast
 *               poster_url:
 *                 type: string
 *                 description: Poster image URL
 *               trailer_url:
 *                 type: string
 *                 description: Trailer video URL
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *                 description: Movie status
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update movie success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movie_id:
 *                       type: string
 *       404:
 *         description: Movie not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete movie
 *     description: Staff only - Delete a movie
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete movie success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movie_id:
 *                       type: string
 *       404:
 *         description: Movie not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/showtimes:
 *   get:
 *     summary: Get showtimes for my theater
 *     description: Staff only - Get showtimes for staff's theater
 *     tags: [Staff]
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
 *         description: Number of items per page
 *       - in: query
 *         name: movie_id
 *         schema:
 *           type: string
 *         description: Filter by movie ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: Showtimes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get showtimes success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtimes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Showtime'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     summary: Create showtime for my theater
 *     description: Staff only - Create a new showtime for staff's theater
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movie_id
 *               - screen_id
 *               - theater_id
 *               - start_time
 *               - end_time
 *               - price
 *               - available_seats
 *             properties:
 *               movie_id:
 *                 type: string
 *                 description: Movie ID
 *               screen_id:
 *                 type: string
 *                 description: Screen ID
 *               theater_id:
 *                 type: string
 *                 description: Theater ID
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime start time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime end time
 *               price:
 *                 type: object
 *                 required:
 *                   - regular
 *                 properties:
 *                   regular:
 *                     type: number
 *                     description: Regular seat price
 *                   premium:
 *                     type: number
 *                     description: Premium seat price
 *                   recliner:
 *                     type: number
 *                     description: Recliner seat price
 *                   couple:
 *                     type: number
 *                     description: Couple seat price
 *                 description: Ticket prices
 *               available_seats:
 *                 type: integer
 *                 description: Number of available seats
 *     responses:
 *       200:
 *         description: Showtime created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtime_id:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as staff
 *
 * /staff/showtimes/{showtime_id}:
 *   get:
 *     summary: Get showtime details
 *     description: Staff only - Get specific showtime details
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Showtime details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get showtime success
 *                 result:
 *                   $ref: '#/components/schemas/Showtime'
 *       404:
 *         description: Showtime not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update showtime
 *     description: Staff only - Update showtime information
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime start time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime end time
 *               price:
 *                 type: object
 *                 properties:
 *                   regular:
 *                     type: number
 *                   premium:
 *                     type: number
 *                   recliner:
 *                     type: number
 *                   couple:
 *                     type: number
 *                 description: Ticket prices
 *               available_seats:
 *                 type: integer
 *                 description: Number of available seats
 *               status:
 *                 type: string
 *                 enum: [scheduled, booking_open, booking_closed, cancelled, completed]
 *                 description: Showtime status
 *     responses:
 *       200:
 *         description: Showtime updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtime_id:
 *                       type: string
 *       404:
 *         description: Showtime not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete showtime
 *     description: Staff only - Delete a showtime
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Showtime deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtime_id:
 *                       type: string
 *       404:
 *         description: Showtime not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/bookings:
 *   get:
 *     summary: Get bookings for my theater
 *     description: Staff only - Get all bookings for staff's theater
 *     tags: [Staff]
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Theater bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get theater bookings success
 *                 result:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       404:
 *         description: No theater found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/bookings/{booking_id}:
 *   get:
 *     summary: Get booking details
 *     description: Staff only - Get specific booking details
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get booking success
 *                 result:
 *                   $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/stats:
 *   get:
 *     summary: Get theater statistics
 *     description: Staff only - Get comprehensive statistics for staff's theater
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Theater statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get theater statistics success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theater_info:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         location:
 *                           type: string
 *                         total_screens:
 *                           type: integer
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_bookings:
 *                           type: integer
 *                           description: Total number of bookings
 *                         completed_bookings:
 *                           type: integer
 *                           description: Number of completed bookings
 *                         today_bookings:
 *                           type: integer
 *                           description: Today's bookings count
 *                         total_revenue:
 *                           type: number
 *                           description: Total revenue generated
 *                         available_movies:
 *                           type: integer
 *                           description: Number of available movies
 *       404:
 *         description: No theater found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
