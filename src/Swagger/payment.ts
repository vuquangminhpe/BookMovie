/**
 * @swagger
 * /cinema/payments:
 *   post:
 *     summary: Create a new payment
 *     description: Create a payment for a booking. Supports multiple payment methods including VNPay integration.
 *     tags: [Payment]
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
 *                 example: "60d21b4667d0d8992e610c87"
 *               payment_method:
 *                 type: string
 *                 enum: [credit_card, debit_card, net_banking, upi, wallet, cash, vnpay]
 *                 description: Payment method
 *                 example: "vnpay"
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID (optional, for non-VNPay payments)
 *                 example: "TXN123456789"
 *     responses:
 *       200:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create payment success
 *                 payment_id:
 *                   type: string
 *                   example: "60d21b4667d0d8992e610c90"
 *                   description: Payment ID
 *                 payment_url:
 *                   type: string
 *                   example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
 *                   description: VNPay payment URL (only for VNPay payments)
 *                 order_id:
 *                   type: string
 *                   example: "15143500"
 *                   description: VNPay order ID (only for VNPay payments)
 *                 result:
 *                   type: object
 *                   description: Payment details (for non-VNPay payments)
 *                   properties:
 *                     payment_id:
 *                       type: string
 *       400:
 *         description: Invalid booking ID, booking already paid, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     booking_already_paid:
 *                       value: "Booking already paid"
 *                     booking_not_found:
 *                       value: "Booking not found"
 *                     unauthorized_payment:
 *                       value: "You are not authorized to make payment for this booking"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/payments/vnpay/callback:
 *   get:
 *     summary: VNPay payment callback
 *     description: Callback endpoint for VNPay payment verification (automatically called by VNPay)
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_Amount
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment amount from VNPay
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Bank code
 *       - in: query
 *         name: vnp_BankTranNo
 *         schema:
 *           type: string
 *         description: Bank transaction number
 *       - in: query
 *         name: vnp_CardType
 *         schema:
 *           type: string
 *         description: Card type
 *       - in: query
 *         name: vnp_OrderInfo
 *         required: true
 *         schema:
 *           type: string
 *         description: Order information
 *       - in: query
 *         name: vnp_PayDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment date
 *       - in: query
 *         name: vnp_ResponseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Response code from VNPay
 *       - in: query
 *         name: vnp_TmnCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Terminal code
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: VNPay transaction number
 *       - in: query
 *         name: vnp_TransactionStatus
 *         schema:
 *           type: string
 *         description: Transaction status
 *       - in: query
 *         name: vnp_TxnRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *       - in: query
 *         name: vnp_SecureHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Security hash
 *       - in: query
 *         name: booking_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       302:
 *         description: Redirect to client with payment result
 *         headers:
 *           Location:
 *             description: Redirect URL to client application
 *             schema:
 *               type: string
 *               example: "https://your-client-app.com/booking/123/payment-result?status=success&orderId=15143500"
 *       400:
 *         description: Missing booking_id parameter
 *       500:
 *         description: Payment verification error
 *
 * /cinema/payments/my-payments:
 *   get:
 *     summary: Get user's payments
 *     description: Get all payments for the authenticated user with optional filters
 *     tags: [Payment]
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
 *           enum: [credit_card, debit_card, net_banking, upi, wallet, cash, vnpay]
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
 *         description: Filter payments from this date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments until this date
 *     responses:
 *       200:
 *         description: List of user's payments
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
 *                           amount:
 *                             type: number
 *                             example: 300
 *                           payment_method:
 *                             type: string
 *                             example: "vnpay"
 *                           transaction_id:
 *                             type: string
 *                             example: "VNP123456789"
 *                           order_id:
 *                             type: string
 *                             example: "15143500"
 *                           bank_code:
 *                             type: string
 *                             example: "NCB"
 *                           card_type:
 *                             type: string
 *                             example: "ATM"
 *                           payment_time:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, failed, refunded]
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
 *                                 type: integer
 *                                 description: Number of seats
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
 *                       type: integer
 *                       description: Total number of payments
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
 * /cinema/payments/{payment_id}:
 *   get:
 *     summary: Get payment details
 *     description: Get detailed information about a specific payment
 *     tags: [Payment]
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
 *                       enum: [credit_card, debit_card, net_banking, upi, wallet, cash, vnpay]
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
 *                       enum: [pending, completed, failed, refunded]
 *                     admin_note:
 *                       type: string
 *                     error:
 *                       type: string
 *                     booking:
 *                       type: object
 *                       description: Associated booking details
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
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid payment ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to view this payment
 *       404:
 *         description: Payment not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/payments/{payment_id}/status:
 *   put:
 *     summary: Update payment status
 *     description: Update the status of a payment (user can only update their own payments)
 *     tags: [Payment]
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
 *                 enum: [pending, completed, failed, refunded]
 *                 description: New payment status
 *                 example: "completed"
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID (optional)
 *                 example: "TXN123456789"
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
 *         description: Invalid payment ID, status, or payment already completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this payment
 *       404:
 *         description: Payment not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentVNPay:
 *       type: object
 *       description: VNPay specific payment details
 *       properties:
 *         payment_url:
 *           type: string
 *           description: VNPay payment URL for redirect
 *           example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
 *         order_id:
 *           type: string
 *           description: VNPay order ID
 *           example: "15143500"
 *         vnp_params:
 *           type: object
 *           description: VNPay parameters
 *           properties:
 *             vnp_Version:
 *               type: string
 *               example: "2.1.0"
 *             vnp_Command:
 *               type: string
 *               example: "pay"
 *             vnp_TmnCode:
 *               type: string
 *               description: Terminal code
 *             vnp_Amount:
 *               type: integer
 *               description: Amount in VND (multiplied by 100)
 *               example: 30000
 *             vnp_CurrCode:
 *               type: string
 *               example: "VND"
 *             vnp_TxnRef:
 *               type: string
 *               description: Transaction reference
 *             vnp_OrderInfo:
 *               type: string
 *               description: Order information
 *               example: "Payment for booking #60d21b4667d0d8992e610c87"
 *             vnp_ReturnUrl:
 *               type: string
 *               description: Return URL after payment
 *             vnp_CreateDate:
 *               type: string
 *               description: Creation date in YYYYMMDDHHmmss format
 *
 *     PaymentCallback:
 *       type: object
 *       description: VNPay callback response
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether payment was successful
 *         message:
 *           type: string
 *           description: Payment result message
 *         transaction_details:
 *           type: object
 *           properties:
 *             vnp_Amount:
 *               type: string
 *             vnp_BankCode:
 *               type: string
 *             vnp_BankTranNo:
 *               type: string
 *             vnp_CardType:
 *               type: string
 *             vnp_OrderInfo:
 *               type: string
 *             vnp_PayDate:
 *               type: string
 *             vnp_ResponseCode:
 *               type: string
 *               description: "00 = Success, others = Error"
 *             vnp_TmnCode:
 *               type: string
 *             vnp_TransactionNo:
 *               type: string
 *             vnp_TransactionStatus:
 *               type: string
 *             vnp_TxnRef:
 *               type: string
 *
 *     PaymentMethodEnum:
 *       type: string
 *       enum:
 *         - credit_card
 *         - debit_card
 *         - net_banking
 *         - upi
 *         - wallet
 *         - cash
 *         - vnpay
 *       description: Available payment methods
 *
 *     PaymentStatusEnum:
 *       type: string
 *       enum:
 *         - pending
 *         - completed
 *         - failed
 *         - refunded
 *       description: Payment status values
 */
