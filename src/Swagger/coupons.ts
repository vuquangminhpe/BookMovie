/**
 * @swagger
 * components:
 *   schemas:
 *     CouponType:
 *       type: string
 *       enum: [percentage, fixed_amount]
 *       description: Type of discount - percentage or fixed amount
 *
 *     CouponStatus:
 *       type: string
 *       enum: [active, inactive, expired]
 *       description: Current status of the coupon
 *
 *     CouponApplicableTo:
 *       type: string
 *       enum: [all, movie, theater]
 *       description: What the coupon can be applied to
 *
 *     Coupon:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier of the coupon
 *         code:
 *           type: string
 *           description: Unique coupon code (uppercase)
 *         description:
 *           type: string
 *           description: Description of the coupon
 *         type:
 *           $ref: '#/components/schemas/CouponType'
 *         value:
 *           type: number
 *           description: Discount value (percentage 1-100 or fixed amount)
 *         min_purchase:
 *           type: number
 *           description: Minimum purchase amount required
 *         max_discount:
 *           type: number
 *           description: Maximum discount amount (for percentage type)
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: When the coupon becomes valid
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: When the coupon expires
 *         status:
 *           $ref: '#/components/schemas/CouponStatus'
 *         usage_limit:
 *           type: number
 *           description: Maximum number of times the coupon can be used (0 = unlimited)
 *         usage_count:
 *           type: number
 *           description: Current number of times the coupon has been used
 *         applicable_to:
 *           $ref: '#/components/schemas/CouponApplicableTo'
 *         applicable_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of specific movies or theaters this coupon applies to
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon (Admin only)
 *     description: Create a new coupon with specified discount rules and constraints
 *     tags: [Coupons - Admin]
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
 *               - description
 *               - type
 *               - value
 *               - start_date
 *               - end_date
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique coupon code (will be converted to uppercase)
 *                 example: "SUMMER2024"
 *               description:
 *                 type: string
 *                 description: Description of the coupon
 *                 example: "Summer special - 20% off all bookings"
 *               type:
 *                 $ref: '#/components/schemas/CouponType'
 *               value:
 *                 type: number
 *                 description: Discount value (1-100 for percentage, any positive number for fixed amount)
 *                 example: 20
 *               min_purchase:
 *                 type: number
 *                 description: Minimum purchase amount required to use this coupon
 *                 example: 100000
 *               max_discount:
 *                 type: number
 *                 description: Maximum discount amount (only applies to percentage type)
 *                 example: 50000
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: When the coupon becomes valid
 *                 example: "2024-06-01T00:00:00.000Z"
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: When the coupon expires
 *                 example: "2024-08-31T23:59:59.999Z"
 *               status:
 *                 $ref: '#/components/schemas/CouponStatus'
 *               usage_limit:
 *                 type: number
 *                 description: Maximum number of times the coupon can be used (0 = unlimited)
 *                 example: 100
 *               applicable_to:
 *                 $ref: '#/components/schemas/CouponApplicableTo'
 *               applicable_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of specific movies or theaters this coupon applies to
 *                 example: ["movie_id_1", "movie_id_2"]
 *     responses:
 *       200:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Create coupon successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     coupon_id:
 *                       type: string
 *                       example: "60d5eca77dd70b1234567890"
 *       400:
 *         description: Bad request - Invalid data or coupon code already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Coupon code already exists"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     summary: Get all coupons with pagination (Admin only)
 *     description: Retrieve a paginated list of all coupons with optional filters
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/CouponStatus'
 *         description: Filter by coupon status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in code and description
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, code, value, usage_count]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Only show active and valid coupons
 *     responses:
 *       200:
 *         description: List of coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get coupons successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     coupons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *                     total:
 *                       type: integer
 *                       description: Total number of coupons
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       description: Current page
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       description: Items per page
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       description: Total number of pages
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /coupons/{coupon_id}:
 *   get:
 *     summary: Get coupon by ID (Admin only)
 *     description: Retrieve detailed information about a specific coupon
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupon_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Get coupon successfully"
 *                 result:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Invalid coupon ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Coupon not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update coupon (Admin only)
 *     description: Update an existing coupon's details
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupon_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Description of the coupon
 *               type:
 *                 $ref: '#/components/schemas/CouponType'
 *               value:
 *                 type: number
 *                 description: Discount value
 *               min_purchase:
 *                 type: number
 *                 description: Minimum purchase amount
 *               max_discount:
 *                 type: number
 *                 description: Maximum discount amount
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date
 *               status:
 *                 $ref: '#/components/schemas/CouponStatus'
 *               usage_limit:
 *                 type: number
 *                 description: Usage limit
 *               applicable_to:
 *                 $ref: '#/components/schemas/CouponApplicableTo'
 *               applicable_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Applicable IDs
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Update coupon successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     coupon_id:
 *                       type: string
 *                       example: "60d5eca77dd70b1234567890"
 *       400:
 *         description: Invalid data provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Coupon not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete or deactivate coupon (Admin only)
 *     description: Delete a coupon if unused, or deactivate if already used
 *     tags: [Coupons - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupon_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon deleted or deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Delete coupon successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     coupon_id:
 *                       type: string
 *                       example: "60d5eca77dd70b1234567890"
 *       400:
 *         description: Invalid coupon ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Coupon not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /coupons/my-coupons:
 *   get:
 *     summary: Get user's available coupons
 *     description: Retrieve a list of available coupons for the authenticated user
 *     tags: [Coupons - User]
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
 *                   example: "Get coupons successfully"
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /coupons/validate:
 *   post:
 *     summary: Validate coupon
 *     description: Validate a coupon code for a booking
 *     tags: [Coupons - User]
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
 *               - movie_id
 *               - theater_id
 *               - total_amount
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code to validate
 *                 example: "SUMMER2024"
 *               movie_id:
 *                 type: string
 *                 description: ID of the movie being booked
 *                 example: "60d5eca77dd70b1234567890"
 *               theater_id:
 *                 type: string
 *                 description: ID of the theater
 *                 example: "60d5eca77dd70b1234567891"
 *               total_amount:
 *                 type: number
 *                 description: Total booking amount before discount
 *                 example: 150000
 *     responses:
 *       200:
 *         description: Coupon is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Coupon applied successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     coupon:
 *                       $ref: '#/components/schemas/Coupon'
 *                     discount_amount:
 *                       type: number
 *                       description: Calculated discount amount
 *                       example: 30000
 *       400:
 *         description: Invalid request or coupon not applicable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     required_field:
 *                       value: "Coupon code is required"
 *                     invalid_data:
 *                       value: "Invalid movie or theater ID"
 *                     min_purchase:
 *                       value: "Minimum purchase amount not met (Min: 100000)"
 *                     expired:
 *                       value: "Coupon has expired"
 *                     already_used:
 *                       value: "You have already used this coupon"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Coupon not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Coupon not found"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /coupons/apply:
 *   post:
 *     summary: Apply coupon to booking
 *     description: Apply a validated coupon to a booking (called during booking finalization)
 *     tags: [Coupons - User]
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
 *               - discount_amount
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code to apply
 *                 example: "SUMMER2024"
 *               booking_id:
 *                 type: string
 *                 description: ID of the booking to apply coupon to
 *                 example: "60d5eca77dd70b1234567892"
 *               discount_amount:
 *                 type: number
 *                 description: Discount amount calculated from validation
 *                 example: 30000
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
 *                   example: "Coupon applied successfully"
 *                 result:
 *                   type: object
 *                   properties:
 *                     coupon_code:
 *                       type: string
 *                       example: "SUMMER2024"
 *                     discount_amount:
 *                       type: number
 *                       example: 30000
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     required_field:
 *                       value: "Coupon code is required"
 *                     invalid_booking:
 *                       value: "Invalid booking ID"
 *                     invalid_amount:
 *                       value: "Invalid discount amount"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Coupon not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Coupon not found"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
