/**
 * @swagger
 * /cinema/showtimes:
 *   get:
 *     summary: Get all showtimes
 *     description: Retrieve a list of all showtimes with pagination and filtering options
 *     tags: [Showtimes]
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
 *         name: theater_id
 *         schema:
 *           type: string
 *         description: Filter by theater ID
 *       - in: query
 *         name: screen_id
 *         schema:
 *           type: string
 *         description: Filter by screen ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, booking_open, booking_closed, cancelled, completed]
 *         description: Filter by showtime status
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: start_time
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successful operation
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
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c87"
 *                           movie_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c85"
 *                           screen_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c88"
 *                           theater_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c86"
 *                           start_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-07-05T18:30:00.000Z"
 *                           end_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-07-05T21:30:00.000Z"
 *                           price:
 *                             type: object
 *                             properties:
 *                               regular:
 *                                 type: number
 *                                 example: 150
 *                               premium:
 *                                 type: number
 *                                 example: 250
 *                               recliner:
 *                                 type: number
 *                                 example: 350
 *                           available_seats:
 *                             type: integer
 *                             example: 120
 *                           status:
 *                             type: string
 *                             example: "booking_open"
 *                           movie:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60d21b4667d0d8992e610c85"
 *                               title:
 *                                 type: string
 *                                 example: "Avengers: Endgame"
 *                               poster_url:
 *                                 type: string
 *                                 example: "https://example.com/poster.jpg"
 *                               duration:
 *                                 type: integer
 *                                 example: 181
 *                           theater:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60d21b4667d0d8992e610c86"
 *                               name:
 *                                 type: string
 *                                 example: "PVR Cinemas"
 *                               location:
 *                                 type: string
 *                                 example: "City Center Mall"
 *                           screen:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60d21b4667d0d8992e610c88"
 *                               name:
 *                                 type: string
 *                                 example: "Screen 1"
 *                               screen_type:
 *                                 type: string
 *                                 example: "imax"
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 5
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Create a new showtime
 *     description: Create a new showtime (admin only)
 *     tags: [Showtimes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movie_id, screen_id, theater_id, start_time, end_time, price, available_seats]
 *             properties:
 *               movie_id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               screen_id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c88"
 *               theater_id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c86"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-07-05T18:30:00.000Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-07-05T21:30:00.000Z"
 *               price:
 *                 type: object
 *                 properties:
 *                   regular:
 *                     type: number
 *                     example: 150
 *                   premium:
 *                     type: number
 *                     example: 250
 *                   recliner:
 *                     type: number
 *                     example: 350
 *                   couple:
 *                     type: number
 *                     example: 400
 *               available_seats:
 *                 type: integer
 *                 example: 120
 *               status:
 *                 type: string
 *                 enum: [scheduled, booking_open, booking_closed, cancelled, completed]
 *                 example: "booking_open"
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
 *                       example: "60d21b4667d0d8992e610c87"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/showtimes/{showtime_id}:
 *   get:
 *     summary: Get showtime by ID
 *     description: Retrieve a showtime by its ID with seat availability information
 *     tags: [Showtimes]
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c87"
 *                     movie_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     screen_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c88"
 *                     theater_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-07-05T18:30:00.000Z"
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-07-05T21:30:00.000Z"
 *                     price:
 *                       type: object
 *                       properties:
 *                         regular:
 *                           type: number
 *                           example: 150
 *                         premium:
 *                           type: number
 *                           example: 250
 *                         recliner:
 *                           type: number
 *                           example: 350
 *                     available_seats:
 *                       type: integer
 *                       example: 120
 *                     status:
 *                       type: string
 *                       example: "booking_open"
 *                     movie:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         title:
 *                           type: string
 *                           example: "Avengers: Endgame"
 *                         description:
 *                           type: string
 *                           example: "After the devastating events of Avengers: Infinity War..."
 *                         poster_url:
 *                           type: string
 *                           example: "https://example.com/poster.jpg"
 *                         duration:
 *                           type: integer
 *                           example: 181
 *                         genre:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Action", "Adventure", "Drama"]
 *                         language:
 *                           type: string
 *                           example: "English"
 *                     theater:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c86"
 *                         name:
 *                           type: string
 *                           example: "PVR Cinemas"
 *                         location:
 *                           type: string
 *                           example: "City Center Mall"
 *                         address:
 *                           type: string
 *                           example: "123 Main Street"
 *                         city:
 *                           type: string
 *                           example: "Mumbai"
 *                     screen:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c88"
 *                         name:
 *                           type: string
 *                           example: "Screen 1"
 *                         screen_type:
 *                           type: string
 *                           example: "imax"
 *                         capacity:
 *                           type: integer
 *                           example: 150
 *                         seat_layout:
 *                           type: array
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 row:
 *                                   type: string
 *                                   example: "A"
 *                                 number:
 *                                   type: integer
 *                                   example: 1
 *                                 type:
 *                                   type: string
 *                                   example: "regular"
 *                                 status:
 *                                   type: string
 *                                   example: "active"
 *                     booked_seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: string
 *                             example: "A"
 *                           number:
 *                             type: integer
 *                             example: 1
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update showtime
 *     description: Update an existing showtime (admin only)
 *     tags: [Showtimes]
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
 *               end_time:
 *                 type: string
 *                 format: date-time
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
 *               available_seats:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [scheduled, booking_open, booking_closed, cancelled, completed]
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
 *                       example: "60d21b4667d0d8992e610c87"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete showtime
 *     description: Delete a showtime (admin only)
 *     tags: [Showtimes]
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
 *                       example: "60d21b4667d0d8992e610c87"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 */
/**
 * @swagger
 * /cinema/showtimes/{showtime_id}/locked-seats:
 *   get:
 *     summary: Get locked seats for a showtime
 *     description: Get list of currently locked seats for a specific showtime (temporarily reserved by other users)
 *     tags: [Showtimes]
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Locked seats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get locked seats successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: string
 *                         example: "A"
 *                         description: Seat row
 *                       number:
 *                         type: integer
 *                         example: 5
 *                         description: Seat number
 *                       expires_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T14:35:00.000Z"
 *                         description: When the seat lock expires
 *       400:
 *         description: Invalid showtime ID
 *       404:
 *         description: Showtime not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /cinema/bookings/{booking_id}/expiration:
 *   get:
 *     summary: Get booking expiration information
 *     description: Get expiration details for a booking including time remaining before auto-cancellation
 *     tags: [Booking]
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
 *         description: Booking expiration info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get booking expiration info success
 *                 result:
 *                   type: object
 *                   properties:
 *                     booking_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c87"
 *                     booking_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T14:30:00.000Z"
 *                       description: When the booking was created
 *                     expiration_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T14:35:00.000Z"
 *                       description: When the booking will expire (5 minutes after creation)
 *                     time_remaining_ms:
 *                       type: integer
 *                       example: 240000
 *                       description: Time remaining in milliseconds
 *                     time_remaining_seconds:
 *                       type: integer
 *                       example: 240
 *                       description: Time remaining in seconds
 *                     is_expired:
 *                       type: boolean
 *                       example: false
 *                       description: Whether the booking has expired
 *                     status:
 *                       type: string
 *                       enum: [pending, confirmed, cancelled, completed]
 *                       example: "pending"
 *                       description: Current booking status
 *                     payment_status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: "pending"
 *                       description: Current payment status
 *       400:
 *         description: Invalid booking ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/{booking_id}/extend:
 *   post:
 *     summary: Extend booking expiration time
 *     description: Extend the expiration time for a pending booking (useful when user is in payment process)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               additional_minutes:
 *                 type: integer
 *                 default: 5
 *                 minimum: 1
 *                 maximum: 15
 *                 example: 5
 *                 description: Additional minutes to extend the booking (1-15 minutes)
 *     responses:
 *       200:
 *         description: Booking expiration extended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Booking expiration extended successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     booking_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c87"
 *                     extended_minutes:
 *                       type: integer
 *                       example: 5
 *                       description: Number of minutes the booking was extended by
 *       400:
 *         description: Invalid booking ID or cannot extend expiration for completed/cancelled booking
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to extend this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SeatLock:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Lock ID
 *         showtime_id:
 *           type: string
 *           description: Showtime ID
 *         user_id:
 *           type: string
 *           description: User ID who locked the seats
 *         seats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               row:
 *                 type: string
 *                 example: "A"
 *               number:
 *                 type: integer
 *                 example: 5
 *           description: Locked seats
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: When the lock expires (5 minutes from creation)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the lock was created
 *
 *     BookingExpiration:
 *       type: object
 *       properties:
 *         booking_id:
 *           type: string
 *           description: Booking ID
 *         booking_time:
 *           type: string
 *           format: date-time
 *           description: When the booking was created
 *         expiration_time:
 *           type: string
 *           format: date-time
 *           description: When the booking will expire
 *         time_remaining_ms:
 *           type: integer
 *           description: Time remaining in milliseconds
 *         time_remaining_seconds:
 *           type: integer
 *           description: Time remaining in seconds
 *         is_expired:
 *           type: boolean
 *           description: Whether the booking has expired
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           description: Current booking status
 *         payment_status:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *           description: Current payment status
 */
