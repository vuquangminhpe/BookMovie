/**
 * @swagger
 * /cinema/payments:
 *   post:
 *     summary: Create a new payment
 *     description: Process payment for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [booking_id, payment_method]
 *             properties:
 *               booking_id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c89"
 *               payment_method:
 *                 type: string
 *                 enum: [credit_card, debit_card, net_banking, upi, wallet, cash]
 *                 example: "credit_card"
 *               transaction_id:
 *                 type: string
 *                 example: "TXN12345678"
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create payment success
 *                 result:
 *                   type: object
 *                   properties:
 *                     payment_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c90"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/payments/my-payments:
 *   get:
 *     summary: Get user's payments
 *     description: Retrieve a list of all payments made by the authenticated user
 *     tags: [Payments]
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
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [credit_card, debit_card, net_banking, upi, wallet, cash]
 *         description: Filter by payment method
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: payment_time
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
 *         description: Filter by payment date from
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by payment date to
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
 *                   example: Get payments success
 *                 result:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c90"
 *                           booking_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c89"
 *                           user_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c80"
 *                           amount:
 *                             type: number
 *                             example: 250
 *                           payment_method:
 *                             type: string
 *                             example: "credit_card"
 *                           transaction_id:
 *                             type: string
 *                             example: "TXN12345678"
 *                           payment_time:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-07-05T10:35:00.000Z"
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                           booking:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60d21b4667d0d8992e610c89"
 *                               ticket_code:
 *                                 type: string
 *                                 example: "ABC12345"
 *                               status:
 *                                 type: string
 *                                 example: "confirmed"
 *                               seats:
 *                                 type: integer
 *                                 example: 2
 *                               total_amount:
 *                                 type: number
 *                                 example: 250
 *                           movie:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60d21b4667d0d8992e610c85"
 *                               title:
 *                                 type: string
 *                                 example: "Avengers: Endgame"
 *                           theater:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "60d21b4667d0d8992e610c86"
 *                               name:
 *                                 type: string
 *                                 example: "PVR Cinemas"
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
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/payments/{payment_id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Retrieve a payment by its ID (must be owner or admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
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
 *                   example: Get payment success
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c90"
 *                     booking_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c89"
 *                     user_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c80"
 *                     amount:
 *                       type: number
 *                       example: 250
 *                     payment_method:
 *                       type: string
 *                       example: "credit_card"
 *                     transaction_id:
 *                       type: string
 *                       example: "TXN12345678"
 *                     payment_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-07-05T10:35:00.000Z"
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     booking:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c89"
 *                         ticket_code:
 *                           type: string
 *                           example: "ABC12345"
 *                         status:
 *                           type: string
 *                           example: "confirmed"
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
 *                     movie:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         title:
 *                           type: string
 *                           example: "Avengers: Endgame"
 *                         poster_url:
 *                           type: string
 *                           example: "https://example.com/poster.jpg"
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/payments/{payment_id}/status:
 *   put:
 *     summary: Update payment status
 *     description: Update a payment status (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
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
 *                 enum: [pending, completed, failed, refunded]
 *                 example: "completed"
 *               transaction_id:
 *                 type: string
 *                 example: "TXN12345678"
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update payment success
 *                 result:
 *                   type: object
 *                   properties:
 *                     payment_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c90"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
