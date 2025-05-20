/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Create a new payment
 *     description: Create a new payment for a booking. Supports VNPay and other payment methods.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - payment_method
 *             properties:
 *               booking_id:
 *                 type: string
 *                 description: ID of the booking to pay for
 *               payment_method:
 *                 type: string
 *                 enum: [credit_card, debit_card, net_banking, upi, wallet, cash, vnpay]
 *                 description: Payment method
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID for non-VNPay payments (optional)
 *     responses:
 *       200:
 *         description: Payment creation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create payment success
 *                 result:
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         payment_id:
 *                           type: string
 *                           description: ID of the created payment
 *                     - type: object
 *                       properties:
 *                         payment_id:
 *                           type: string
 *                           description: ID of the created payment
 *                         payment_url:
 *                           type: string
 *                           description: URL to redirect for VNPay payment
 *                         order_id:
 *                           type: string
 *                           description: VNPay order reference ID
 *       400:
 *         description: Invalid input data or booking already paid
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to make payment for this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /payments/vnpay-callback:
 *   get:
 *     summary: VNPay payment callback
 *     description: Endpoint for VNPay to redirect after payment completion
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: VNPay response code
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: VNPay transaction reference
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Payment amount (already multiplied by 100)
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Bank code used for payment
 *       - in: query
 *         name: vnp_CardType
 *         schema:
 *           type: string
 *         description: Card type used for payment
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema:
 *           type: string
 *         description: Order information
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: VNPay transaction number
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Secure hash for verification
 *       - in: query
 *         name: booking_id
 *         schema:
 *           type: string
 *         description: ID of the booking being paid for
 *     responses:
 *       302:
 *         description: Redirects to client application with payment result
 *       400:
 *         description: Invalid input or missing booking_id
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /payments/my-payments:
 *   get:
 *     summary: Get user's payment history
 *     description: Retrieve a list of payments made by the authenticated user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Filter by payment status
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [credit_card, debit_card, net_banking, upi, wallet, cash, vnpay]
 *         description: Filter by payment method
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (from)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (to)
 *     responses:
 *       200:
 *         description: List of payments
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
 *                           booking_id:
 *                             type: string
 *                           user_id:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           payment_method:
 *                             type: string
 *                           transaction_id:
 *                             type: string
 *                           order_id:
 *                             type: string
 *                           bank_code:
 *                             type: string
 *                           card_type:
 *                             type: string
 *                           payment_time:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                           booking:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               ticket_code:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               seats:
 *                                 type: number
 *                               total_amount:
 *                                 type: number
 *                           movie:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                           theater:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                           showtime:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               start_time:
 *                                 type: string
 *                                 format: date-time
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total_pages:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /payments/{payment_id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Retrieve a specific payment by its ID
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
 *         description: Payment details
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
 *                     booking_id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     payment_method:
 *                       type: string
 *                     transaction_id:
 *                       type: string
 *                     order_id:
 *                       type: string
 *                     bank_code:
 *                       type: string
 *                     card_type:
 *                       type: string
 *                     payment_time:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     booking:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         ticket_code:
 *                           type: string
 *                         status:
 *                           type: string
 *                         seats:
 *                           type: array
 *                           items:
 *                             type: object
 *                         total_amount:
 *                           type: number
 *                     movie:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         poster_url:
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
 *       400:
 *         description: Invalid payment ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Payment not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /payments/{payment_id}/status:
 *   put:
 *     summary: Update payment status
 *     description: Update the status of an existing payment (admin only)
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *                 description: New payment status
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID (optional)
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
 *       400:
 *         description: Invalid input data or payment already completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update payment status
 *       404:
 *         description: Payment not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
