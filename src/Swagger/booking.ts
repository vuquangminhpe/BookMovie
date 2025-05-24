/**
 * @swagger
 * /cinema/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new movie booking with seat selection. Seats will be locked for 5 minutes and booking will auto-expire if not paid within 5 minutes.
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - showtime_id
 *               - seats
 *             properties:
 *               showtime_id:
 *                 type: string
 *                 description: ID of the showtime to book
 *                 example: "60d21b4667d0d8992e610c85"
 *               seats:
 *                 type: array
 *                 description: Array of seats to book
 *                 items:
 *                   type: object
 *                   required:
 *                     - row
 *                     - number
 *                     - type
 *                   properties:
 *                     row:
 *                       type: string
 *                       description: Seat row (e.g., A, B, C)
 *                       example: "A"
 *                     number:
 *                       type: integer
 *                       description: Seat number (e.g., 1, 2, 3)
 *                       example: 5
 *                     type:
 *                       type: string
 *                       enum: [regular, premium, recliner, couple]
 *                       description: Type of seat
 *                       example: "regular"
 *     responses:
 *       201:
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
 *                           example: "60d21b4667d0d8992e610c87"
 *                         user_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c84"
 *                         showtime_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         movie_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c86"
 *                         theater_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c88"
 *                         screen_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c89"
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
 *                                 example: 5
 *                               type:
 *                                 type: string
 *                                 example: "regular"
 *                               price:
 *                                 type: number
 *                                 example: 150
 *                         ticket_code:
 *                           type: string
 *                           example: "ABC12345"
 *                           description: Unique ticket code for verification
 *                         total_amount:
 *                           type: number
 *                           example: 300
 *                           description: Total booking amount
 *                         status:
 *                           type: string
 *                           enum: [pending, confirmed, cancelled, completed]
 *                           example: "pending"
 *                           description: Booking status
 *                         payment_status:
 *                           type: string
 *                           enum: [pending, completed, failed, refunded]
 *                           example: "pending"
 *                           description: Payment status
 *                         booking_time:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T14:30:00.000Z"
 *                           description: When the booking was created
 *                         movie:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                               example: "Avengers: Endgame"
 *                             poster_url:
 *                               type: string
 *                               example: "https://example.com/poster.jpg"
 *                             duration:
 *                               type: integer
 *                               example: 181
 *                             language:
 *                               type: string
 *                               example: "English"
 *                         theater:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                               example: "PVR Cinemas"
 *                             location:
 *                               type: string
 *                               example: "City Center Mall"
 *                             address:
 *                               type: string
 *                               example: "123 Main Street"
 *                             city:
 *                               type: string
 *                               example: "Mumbai"
 *                         screen:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                               example: "Screen 1"
 *                             screen_type:
 *                               type: string
 *                               example: "imax"
 *                         showtime:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             start_time:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-01-15T18:30:00.000Z"
 *                             end_time:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-01-15T21:30:00.000Z"
 *                         payment:
 *                           type: object
 *                           nullable: true
 *                           description: Payment information (null for new bookings)
 *                     seat_lock:
 *                       type: object
 *                       description: Information about seat locks created for this booking
 *                       properties:
 *                         lock_id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c90"
 *                           description: Seat lock ID
 *                         expires_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T14:35:00.000Z"
 *                           description: When the seat lock expires (5 minutes from now)
 *                     expiration_info:
 *                       $ref: '#/components/schemas/BookingExpiration'
 *                       description: Booking expiration information
 *       400:
 *         description: Invalid input, seats already booked, or seats currently locked by another user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     seats_already_booked:
 *                       value: "Seats already booked"
 *                       description: When trying to book already confirmed seats
 *                     seats_locked:
 *                       value: "Seats A-5, A-6 are currently being selected by another user"
 *                       description: When trying to book seats that are temporarily locked
 *                     showtime_not_available:
 *                       value: "Showtime not available for booking"
 *                       description: When showtime is not in booking_open status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Showtime not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/my-bookings:
 *   get:
 *     summary: Get user's bookings
 *     description: Get all bookings for the authenticated user with optional filters
 *     tags: [Booking]
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
 *         description: Filter bookings from this date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings until this date
 *     responses:
 *       200:
 *         description: List of user's bookings
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
 *                           ticket_code:
 *                             type: string
 *                           total_amount:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [pending, confirmed, cancelled, completed]
 *                           payment_status:
 *                             type: string
 *                             enum: [pending, completed, failed, refunded]
 *                           booking_time:
 *                             type: string
 *                             format: date-time
 *                           seats:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 row:
 *                                   type: string
 *                                 number:
 *                                   type: integer
 *                                 type:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *                           movie:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               poster_url:
 *                                 type: string
 *                           theater:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               location:
 *                                 type: string
 *                           showtime:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               start_time:
 *                                 type: string
 *                                 format: date-time
 *                               end_time:
 *                                 type: string
 *                                 format: date-time
 *                     total:
 *                       type: integer
 *                       description: Total number of bookings
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                     total_pages:
 *                       type: integer
 *                       description: Total number of pages
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/{booking_id}:
 *   get:
 *     summary: Get booking details
 *     description: Get detailed information about a specific booking
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
 *         description: Booking details
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
 *       400:
 *         description: Invalid booking ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to view this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/verify/{ticket_code}:
 *   get:
 *     summary: Verify ticket by code
 *     description: Verify a booking ticket by its code (for theater staff)
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: ticket_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket code
 *         example: "ABC12345"
 *     responses:
 *       200:
 *         description: Booking details for verification
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
 *       400:
 *         description: Invalid ticket code
 *       404:
 *         description: Ticket not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/{booking_id}/status:
 *   put:
 *     summary: Update booking status
 *     description: Update the status of a booking (e.g., cancel a booking). Note that bookings automatically expire after 5 minutes if not paid.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [cancelled]
 *                 description: New booking status (only cancellation is allowed by users)
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
 *                       example: "60d21b4667d0d8992e610c87"
 *       400:
 *         description: Invalid booking ID, status, or booking cannot be cancelled (already started, completed, etc.)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/bookings/ticket/{ticket_code}/qr:
 *   get:
 *     summary: Get ticket QR code
 *     description: Get the QR code for a specific ticket
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticket_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket code
 *         example: "ABC12345"
 *     responses:
 *       200:
 *         description: Ticket QR code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get ticket QR code success
 *                 result:
 *                   type: object
 *                   properties:
 *                     qr_code:
 *                       type: string
 *                       description: QR code as data URL (base64 image)
 *                       example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *       400:
 *         description: Invalid ticket code
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to access this ticket
 *       404:
 *         description: Ticket not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /bookings/verify-qr:
 *   post:
 *     summary: Verify ticket QR code
 *     description: Verify a ticket QR code (admin/staff use for ticket checking)
 *     tags: [Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_code
 *             properties:
 *               ticket_code:
 *                 type: string
 *                 description: Ticket code from QR scan
 *                 example: "ABC12345"
 *     responses:
 *       200:
 *         description: Ticket verification success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ticket verification success
 *                 result:
 *                   type: object
 *                   properties:
 *                     booking_id:
 *                       type: string
 *                     ticket_code:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, confirmed, cancelled, completed]
 *                     payment_status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     movie:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         poster_url:
 *                           type: string
 *                         duration:
 *                           type: integer
 *                         genre:
 *                           type: array
 *                           items:
 *                             type: string
 *                         language:
 *                           type: string
 *                     theater:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         location:
 *                           type: string
 *                     screen:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         screen_type:
 *                           type: string
 *                     showtime:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         start_time:
 *                           type: string
 *                           format: date-time
 *                         end_time:
 *                           type: string
 *                           format: date-time
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: string
 *                           number:
 *                             type: integer
 *                           type:
 *                             type: string
 *                           price:
 *                             type: number
 *                     booking_time:
 *                       type: string
 *                       format: date-time
 *                     verified_at:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the ticket was verified
 *       400:
 *         description: Invalid or missing ticket code
 *       404:
 *         description: Ticket not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
