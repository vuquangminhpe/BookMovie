/**
 * @swagger
 * /cinema/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new booking for a showtime
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showtime_id, seats]
 *             properties:
 *               showtime_id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c87"
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     row:
 *                       type: string
 *                       example: "A"
 *                     number:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       enum: [regular, premium, recliner, couple]
 *                       example: "premium"
 *     responses:
 *       200:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create booking success
 *                 result:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c89"
 *                         user_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c80"
 *                         showtime_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c87"
 *                         movie_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         theater_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c86"
 *                         screen_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c88"
 *                         seats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               row:
 *                                 type: string
 *                                 example: "A"
 *                               number:
 *                                 type: integer
 *                                 example: 1
 *                               type:
 *                                 type: string
 *                                 example: "premium"
 *                               price:
 *                                 type: number
 *                                 example: 250
 *                         total_amount:
 *                           type: number
 *                           example: 250
 *                         booking_time:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-07-05T10:30:00.000Z"
 *                         ticket_code:
 *                           type: string
 *                           example: "ABC12345"
 *                         status:
 *                           type: string
 *                           example: "pending"
 *                         payment_status:
 *                           type: string
 *                           example: "pending"
 *                         movie:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "60d21b4667d0d8992e610c85"
 *                             title:
 *                               type: string
 *                               example: "Avengers: Endgame"
 *                             poster_url:
 *                               type: string
 *                               example: "https://example.com/poster.jpg"
 *                         theater:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "60d21b4667d0d8992e610c86"
 *                             name:
 *                               type: string
 *                               example: "PVR Cinemas"
 *                             location:
 *                               type: string
 *                               example: "City Center Mall"
 *                         showtime:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               example: "60d21b4667d0d8992e610c87"
 *                             start_time:
 *                               type: string
 *                               format: date-time
 *                               example: "2023-07-05T18:30:00.000Z"
 *                             end_time:
 *                               type: string
 *                               format: date-time
 *                               example: "2023-07-05T21:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/my-bookings:
 *   get:
 *     summary: Get user's bookings
 *     description: Retrieve a list of all bookings made by the authenticated user
 *     tags: [Bookings]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter by booking status
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: booking_time
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by booking date from
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by booking date to
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
 *                   example: Get bookings success
 *                 result:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c89"
 *                           showtime_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c87"
 *                           movie_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c85"
 *                           seats:
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
 *                                   example: "premium"
 *                                 price:
 *                                   type: number
 *                                   example: 250
 *                           total_amount:
 *                             type: number
 *                             example: 250
 *                           booking_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-07-05T10:30:00.000Z"
 *                           ticket_code:
 *                             type: string
 *                             example: "ABC12345"
 *                           status:
 *                             type: string
 *                             example: "confirmed"
 *                           payment_status:
 *                             type: string
 *                             example: "completed"
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
 *                           showtime:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60d21b4667d0d8992e610c87"
 *                               start_time:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2023-07-05T18:30:00.000Z"
 *                               end_time:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2023-07-05T21:30:00.000Z"
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/{booking_id}:
 *   get:
 *     summary: Get booking by ID
 *     description: Retrieve a booking by its ID (must be owner or admin)
 *     tags: [Bookings]
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
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get booking success
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c89"
 *                     user_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c80"
 *                     showtime_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c87"
 *                     movie_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     theater_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *                     screen_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c88"
 *                     seats:
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
 *                           type:
 *                             type: string
 *                             example: "premium"
 *                           price:
 *                             type: number
 *                             example: 250
 *                     total_amount:
 *                       type: number
 *                       example: 250
 *                     booking_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-07-05T10:30:00.000Z"
 *                     ticket_code:
 *                       type: string
 *                       example: "ABC12345"
 *                     status:
 *                       type: string
 *                       example: "confirmed"
 *                     payment_status:
 *                       type: string
 *                       example: "completed"
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
 *                     showtime:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c87"
 *                         start_time:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-07-05T18:30:00.000Z"
 *                         end_time:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-07-05T21:30:00.000Z"
 *                     payment:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c90"
 *                         payment_method:
 *                           type: string
 *                           example: "credit_card"
 *                         status:
 *                           type: string
 *                           example: "completed"
 *                         transaction_id:
 *                           type: string
 *                           example: "TXN12345678"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/verify/{ticket_code}:
 *   get:
 *     summary: Verify ticket by code
 *     description: Verify a ticket using its code (for theater staff)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: ticket_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket code
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
 *                   example: Get booking success
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c89"
 *                     user_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c80"
 *                     showtime_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c87"
 *                     seats:
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
 *                           type:
 *                             type: string
 *                             example: "premium"
 *                     ticket_code:
 *                       type: string
 *                       example: "ABC12345"
 *                     status:
 *                       type: string
 *                       example: "confirmed"
 *                     payment_status:
 *                       type: string
 *                       example: "completed"
 *                     movie:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: "Avengers: Endgame"
 *                     theater:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "PVR Cinemas"
 *                     showtime:
 *                       type: object
 *                       properties:
 *                         start_time:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-07-05T18:30:00.000Z"
 *                         end_time:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-07-05T21:30:00.000Z"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/{booking_id}/status:
 *   put:
 *     summary: Update booking status
 *     description: Update a booking status (cancel booking)
 *     tags: [Bookings]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *                 example: "cancelled"
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cancel booking success
 *                 result:
 *                   type: object
 *                   properties:
 *                     booking_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c89"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
