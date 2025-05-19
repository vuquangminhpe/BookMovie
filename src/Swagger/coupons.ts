/**
 * @swagger
 * /coupons/my-coupons:
 *   get:
 *     summary: Get user's available coupons
 *     description: Retrieve a list of available coupons for the authenticated user
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get user coupons successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       discount_type:
 *                         type: string
 *                         enum: [percentage, fixed]
 *                       discount_value:
 *                         type: number
 *                       min_purchase:
 *                         type: number
 *                       max_discount:
 *                         type: number
 *                       valid_from:
 *                         type: string
 *                         format: date-time
 *                       valid_to:
 *                         type: string
 *                         format: date-time
 *                       is_active:
 *                         type: boolean
 *                       usage_limit:
 *                         type: number
 *                       current_usage:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /coupons/validate:
 *   post:
 *     summary: Validate coupon
 *     description: Validate a coupon code for a booking
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - booking_amount
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code
 *               booking_amount:
 *                 type: number
 *                 description: Total booking amount
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Coupon is valid
 *                 result:
 *                   type: object
 *                   properties:
 *                     coupon:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         code:
 *                           type: string
 *                         discount_type:
 *                           type: string
 *                         discount_value:
 *                           type: number
 *                     discount_amount:
 *                       type: number
 *                     final_amount:
 *                       type: number
 *       400:
 *         description: Invalid coupon or coupon not applicable
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Coupon not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /coupons/apply:
 *   post:
 *     summary: Apply coupon
 *     description: Apply a coupon to a booking
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - booking_id
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code
 *               booking_id:
 *                 type: string
 *                 description: Booking ID
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Coupon applied successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       type: object
 *                     discount_amount:
 *                       type: number
 *                     final_amount:
 *                       type: number
 *       400:
 *         description: Invalid coupon or already applied
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Coupon or booking not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
