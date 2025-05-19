/**
 * @swagger
 * /booking:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new movie booking with seat selection
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
 *               seats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     row:
 *                       type: string
 *                       description: Seat row (e.g., A, B, C)
 *                     number:
 *                       type: string
 *                       description: Seat number (e.g., 1, 2, 3)
 *                     seat_type:
 *                       type: string
 *                       description: Type of seat (e.g., standard, premium, recliners)
 *               coupon_code:
 *                 type: string
 *                 description: Coupon code to apply to the booking (optional)
 *               payment_method:
 *                 type: string
 *                 enum: [card, wallet, cash]
 *                 description: Payment method for the booking
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
 *                   example: Booking created successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     showtime_id:
 *                       type: string
 *                     movie_id:
 *                       type: string
 *                     theater_id:
 *                       type: string
 *                     screen_id:
 *                       type: string
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                     ticket_code:
 *                       type: string
 *                     total_amount:
 *                       type: number
 *                     payment_status:
 *                       type: string
 *                     booking_status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input or seats already booked
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Showtime not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /booking/my-bookings:
 *   get:
 *     summary: Get user's bookings
 *     description: Get all bookings for the authenticated user
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled, completed]
 *         description: Filter by booking status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, oldest]
 *         description: Sort order for bookings
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
 *                   example: Get my bookings successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       showtime:
 *                         type: object
 *                       movie:
 *                         type: object
 *                       theater:
 *                         type: object
 *                       screen:
 *                         type: object
 *                       seats:
 *                         type: array
 *                         items:
 *                           type: object
 *                       ticket_code:
 *                         type: string
 *                       total_amount:
 *                         type: number
 *                       payment_status:
 *                         type: string
 *                       booking_status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /booking/{booking_id}:
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
 *                   example: Get booking details successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     showtime:
 *                       type: object
 *                     movie:
 *                       type: object
 *                     theater:
 *                       type: object
 *                     screen:
 *                       type: object
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                     ticket_code:
 *                       type: string
 *                     total_amount:
 *                       type: number
 *                     payment_status:
 *                       type: string
 *                     booking_status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
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
 * /booking/verify/{ticket_code}:
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
 *                   example: Ticket verified successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     showtime:
 *                       type: object
 *                     movie:
 *                       type: object
 *                     theater:
 *                       type: object
 *                     screen:
 *                       type: object
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                     ticket_code:
 *                       type: string
 *                     booking_status:
 *                       type: string
 *                     is_valid:
 *                       type: boolean
 *       400:
 *         description: Invalid ticket code
 *       404:
 *         description: Ticket not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /booking/{booking_id}/status:
 *   put:
 *     summary: Update booking status
 *     description: Update the status of a booking (e.g., cancel a booking)
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
 *                   example: Booking cancelled successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     booking_status:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid booking ID or status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /booking/ticket/{ticket_code}/qr:
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
 *                   example: Get ticket QR code successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     qr_code_url:
 *                       type: string
 *                     ticket_info:
 *                       type: object
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
 */
