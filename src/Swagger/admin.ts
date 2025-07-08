/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Get overall dashboard statistics for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year, all]
 *           default: all
 *         description: Time period for statistics
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get dashboard statistics success
 *                 result:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       example: all
 *                     user_stats:
 *                       type: object
 *                       properties:
 *                         total_users:
 *                           type: integer
 *                           example: 1250
 *                         new_users:
 *                           type: integer
 *                           example: 45
 *                     booking_stats:
 *                       type: object
 *                       properties:
 *                         total_bookings:
 *                           type: integer
 *                           example: 3420
 *                         completed_bookings:
 *                           type: integer
 *                           example: 3100
 *                         revenue:
 *                           type: number
 *                           example: 1250000
 *                         revenue_by_status:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               total:
 *                                 type: number
 *                     content_stats:
 *                       type: object
 *                       properties:
 *                         total_movies:
 *                           type: integer
 *                           example: 125
 *                         total_theaters:
 *                           type: integer
 *                           example: 8
 *                         total_screens:
 *                           type: integer
 *                           example: 45
 *                         total_ratings:
 *                           type: integer
 *                           example: 2850
 *                         total_feedbacks:
 *                           type: integer
 *                           example: 180
 *                     charts:
 *                       type: object
 *                       properties:
 *                         bookings_per_day:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 example: "2024-01-15"
 *                               bookings:
 *                                 type: integer
 *                               revenue:
 *                                 type: number
 *                     top_performers:
 *                       type: object
 *                       properties:
 *                         top_movies:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               movie_id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               poster_url:
 *                                 type: string
 *                               bookings_count:
 *                                 type: integer
 *                               revenue:
 *                                 type: number
 *                         top_theaters:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               theater_id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               location:
 *                                 type: string
 *                               bookings_count:
 *                                 type: integer
 *                               revenue:
 *                                 type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Admin only - Retrieve all users with optional filters and pagination
 *     tags: [Admin]
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
 *         description: Search by name, email, or username
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, staff, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: verify
 *         schema:
 *           type: string
 *           enum: [0, 1, 2]
 *         description: Filter by verification status (0=unverified, 1=verified, 2=banned)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get users success
 *                 result:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           username:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [customer, staff, admin]
 *                           verify:
 *                             type: integer
 *                             enum: [0, 1, 2]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           stats:
 *                             type: object
 *                             properties:
 *                               bookings_count:
 *                                 type: integer
 *                               ratings_count:
 *                                 type: integer
 *                               feedbacks_count:
 *                                 type: integer
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
 *         description: Not authorized as admin
 *
 * /admin/users/{user_id}:
 *   get:
 *     summary: Get user by ID
 *     description: Admin only - Get detailed information about a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get users success
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                     verify:
 *                       type: integer
 *                     phone:
 *                       type: string
 *                     address:
 *                       type: object
 *                       properties:
 *                         street:
 *                           type: string
 *                         city:
 *                           type: string
 *                         state:
 *                           type: string
 *                         country:
 *                           type: string
 *                         zipCode:
 *                           type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     stats:
 *                       type: object
 *                       properties:
 *                         bookings_count:
 *                           type: integer
 *                         ratings_count:
 *                           type: integer
 *                         feedbacks_count:
 *                           type: integer
 *                         total_spent:
 *                           type: number
 *                     recent_activity:
 *                       type: object
 *                       properties:
 *                         recent_bookings:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Booking'
 *                         recent_ratings:
 *                           type: array
 *                           items:
 *                             type: object
 *                         recent_feedbacks:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Invalid user ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: User not found
 *
 *   put:
 *     summary: Update user information
 *     description: Admin only - Update user's profile information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email (must be unique)
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               role:
 *                 type: string
 *                 enum: [customer, staff, admin]
 *                 description: User role
 *               verify:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: Verification status (0=unverified, 1=verified, 2=banned)
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update user success
 *                 result:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data or email already exists
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin or cannot update another admin
 *       404:
 *         description: User not found
 *
 *   delete:
 *     summary: Delete user
 *     description: Admin only - Delete a user account and related data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete user success
 *                 result:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid user ID or user has active bookings
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin, cannot delete self or another admin
 *       404:
 *         description: User not found
 *
 * /admin/users/{user_id}/role:
 *   put:
 *     summary: Update user role
 *     description: Admin only - Update a user's role (customer/staff/admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [customer, staff, admin]
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update user role success
 *                 result:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *       400:
 *         description: Invalid role
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin or cannot update another admin
 *       404:
 *         description: User not found
 *
 * /admin/users/{user_id}/ban:
 *   put:
 *     summary: Ban user
 *     description: Admin only - Ban a user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User banned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ban user success
 *                 result:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *       400:
 *         description: User already banned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin or cannot ban another admin
 *       404:
 *         description: User not found
 *
 * /admin/users/{user_id}/unban:
 *   put:
 *     summary: Unban user
 *     description: Admin only - Unban a user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User unbanned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unban user success
 *                 result:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *       400:
 *         description: User is not banned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: User not found
 *
 * /admin/users/{user_id}/promote-to-staff:
 *   put:
 *     summary: Promote user to staff
 *     description: Admin only - Promote a user to staff role and create contract
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to promote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *               - salary
 *               - start_date
 *               - end_date
 *             properties:
 *               position:
 *                 type: string
 *                 description: Staff position/title
 *               salary:
 *                 type: number
 *                 description: Monthly salary
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Contract start date
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Contract end date
 *               contract_type:
 *                 type: string
 *                 enum: [full_time, part_time, contract, intern]
 *                 default: full_time
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of benefits
 *               terms:
 *                 type: string
 *                 description: Additional contract terms
 *     responses:
 *       200:
 *         description: User promoted to staff successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User promoted to staff and contract created successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     contract_id:
 *                       type: string
 *       400:
 *         description: Invalid input or user already staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: User not found
 *
 * /admin/contracts:
 *   get:
 *     summary: Get all contracts
 *     description: Admin only - Get list of all staff contracts with filtering and pagination
 *     tags: [Admin]
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
 *           enum: [draft, active, expired, terminated]
 *         description: Filter by contract status
 *       - in: query
 *         name: staff_id
 *         schema:
 *           type: string
 *         description: Filter by staff member ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by staff name or position
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Contracts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get contracts success
 *                 result:
 *                   type: object
 *                   properties:
 *                     contracts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           staff_id:
 *                             type: string
 *                           staff_info:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                           position:
 *                             type: string
 *                           salary:
 *                             type: number
 *                           contract_type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
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
 *         description: Not authorized as admin
 *
 *   post:
 *     summary: Create contract
 *     description: Admin only - Create a new staff contract
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staff_id
 *               - position
 *               - salary
 *               - start_date
 *               - end_date
 *             properties:
 *               staff_id:
 *                 type: string
 *                 description: Staff member ID
 *               position:
 *                 type: string
 *                 description: Job position/title
 *               salary:
 *                 type: number
 *                 description: Monthly salary
 *               contract_type:
 *                 type: string
 *                 enum: [full_time, part_time, contract, intern]
 *                 default: full_time
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Contract start date
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Contract end date
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of benefits
 *               terms:
 *                 type: string
 *                 description: Additional contract terms
 *     responses:
 *       200:
 *         description: Contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create contract success
 *                 result:
 *                   type: object
 *                   properties:
 *                     contract_id:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Staff member not found
 *
 * /admin/contracts/{contract_id}:
 *   get:
 *     summary: Get contract by ID
 *     description: Admin only - Get detailed contract information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contract_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
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
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     staff_id:
 *                       type: string
 *                     staff_info:
 *                       type: object
 *                     admin_id:
 *                       type: string
 *                     position:
 *                       type: string
 *                     salary:
 *                       type: number
 *                     contract_type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     benefits:
 *                       type: array
 *                       items:
 *                         type: string
 *                     terms:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid contract ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Contract not found
 *
 *   put:
 *     summary: Update contract
 *     description: Admin only - Update contract information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contract_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position:
 *                 type: string
 *               salary:
 *                 type: number
 *               contract_type:
 *                 type: string
 *                 enum: [full_time, part_time, contract, intern]
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               terms:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update contract success
 *                 result:
 *                   type: object
 *                   properties:
 *                     contract_id:
 *                       type: string
 *       400:
 *         description: Invalid input or contract cannot be updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Contract not found
 *
 * /admin/contracts/{contract_id}/activate:
 *   put:
 *     summary: Activate contract
 *     description: Admin only - Activate a draft contract
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contract_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Activate contract success
 *                 result:
 *                   type: object
 *                   properties:
 *                     contract_id:
 *                       type: string
 *       400:
 *         description: Contract already active or cannot be activated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Contract not found
 *
 * /admin/contracts/{contract_id}/terminate:
 *   put:
 *     summary: Terminate contract
 *     description: Admin only - Terminate an active contract
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contract_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for termination
 *     responses:
 *       200:
 *         description: Contract terminated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terminate contract success
 *                 result:
 *                   type: object
 *                   properties:
 *                     contract_id:
 *                       type: string
 *       400:
 *         description: Contract already terminated or cannot be terminated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Contract not found
 *
 * /admin/contracts/check-expired:
 *   post:
 *     summary: Check and update expired contracts
 *     description: Admin only - Check for expired contracts and update their status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired contracts checked and updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Check expired contracts success
 *                 result:
 *                   type: object
 *                   properties:
 *                     expired_count:
 *                       type: integer
 *                       description: Number of contracts that were expired
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *
 * /admin/movies/{movie_id}/feature:
 *   put:
 *     summary: Update movie feature status
 *     description: Admin only - Set a movie as featured or remove featured status
 *     tags: [Admin]
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
 *             required:
 *               - is_featured
 *             properties:
 *               is_featured:
 *                 type: boolean
 *                 description: Whether the movie should be featured
 *               featured_order:
 *                 type: integer
 *                 description: Order of appearance for featured movies (optional)
 *     responses:
 *       200:
 *         description: Movie feature status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Feature movie success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movie_id:
 *                       type: string
 *       400:
 *         description: Movie already has the requested feature status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Movie not found
 *
 * /admin/feedbacks/pending:
 *   get:
 *     summary: Get pending feedbacks for moderation
 *     description: Admin only - Get list of pending feedbacks for moderation
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Pending feedbacks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get users success
 *                 result:
 *                   type: object
 *                   properties:
 *                     feedbacks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           is_spoiler:
 *                             type: boolean
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                           movie:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               poster_url:
 *                                 type: string
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
 *         description: Not authorized as admin
 *
 * /admin/feedbacks/{feedback_id}/moderate:
 *   put:
 *     summary: Moderate feedback
 *     description: Admin only - Approve or reject a feedback
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedback_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
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
 *                 enum: [approved, rejected]
 *                 description: Moderation decision
 *               moderation_note:
 *                 type: string
 *                 description: Optional note for moderation decision
 *     responses:
 *       200:
 *         description: Feedback moderated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Moderate feedback success
 *                 result:
 *                   type: object
 *                   properties:
 *                     feedback_id:
 *                       type: string
 *       400:
 *         description: Invalid feedback ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Feedback not found
 *
 * /admin/ratings/moderate:
 *   get:
 *     summary: Get ratings for moderation
 *     description: Admin only - Get list of ratings for moderation
 *     tags: [Admin]
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
 *         name: show_hidden
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show hidden ratings
 *     responses:
 *       200:
 *         description: Ratings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get users success
 *                 result:
 *                   type: object
 *                   properties:
 *                     ratings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           rating:
 *                             type: number
 *                             minimum: 1
 *                             maximum: 5
 *                           comment:
 *                             type: string
 *                           is_hidden:
 *                             type: boolean
 *                           moderation_note:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                           movie:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               poster_url:
 *                                 type: string
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
 *         description: Not authorized as admin
 *
 * /admin/ratings/{rating_id}/moderate:
 *   put:
 *     summary: Moderate rating
 *     description: Admin only - Hide or show a rating
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rating_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Rating ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_hidden
 *             properties:
 *               is_hidden:
 *                 type: boolean
 *                 description: Whether to hide the rating
 *               moderation_note:
 *                 type: string
 *                 description: Optional note for moderation decision
 *     responses:
 *       200:
 *         description: Rating moderated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Moderate rating success
 *                 result:
 *                   type: object
 *                   properties:
 *                     rating_id:
 *                       type: string
 *       400:
 *         description: Invalid rating ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Rating not found
 *
 * /admin/banners:
 *   get:
 *     summary: Get all banners (Admin)
 *     description: Admin only - Get list of all banners with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [home_slider, promotion, announcement]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, scheduled]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get banners success
 *                 result:
 *                   type: object
 *                   properties:
 *                     banners:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *
 *   post:
 *     summary: Create banner
 *     description: Admin only - Create a new banner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, image_url, type]
 *             properties:
 *               title:
 *                 type: string
 *               image_url:
 *                 type: string
 *               link_url:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [home_slider, promotion, announcement]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, scheduled]
 *               position:
 *                 type: integer
 *               movie_id:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Banner created successfully
 *
 * /admin/banners/{banner_id}:
 *   get:
 *     summary: Get banner by ID (Admin)
 *     description: Admin only - Get banner details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: banner_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *
 *   put:
 *     summary: Update banner
 *     description: Admin only - Update banner information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: banner_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               image_url:
 *                 type: string
 *               link_url:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [home_slider, promotion, announcement]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, scheduled]
 *               position:
 *                 type: integer
 *               movie_id:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *
 *   delete:
 *     summary: Delete banner
 *     description: Admin only - Delete a banner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: banner_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *
 * /admin/payments:
 *   get:
 *     summary: Get all payments
 *     description: Admin only - Get list of all payments with filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [credit_card, debit_card, net_banking, upi, wallet, cash, vnpay]
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by transaction ID
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
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
 *                           payment_method:
 *                             type: string
 *                           transaction_id:
 *                             type: string
 *                           status:
 *                             type: string
 *                           payment_time:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                           booking:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               ticket_code:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               payment_status:
 *                                 type: string
 *                               total_amount:
 *                                 type: number
 *                               seats:
 *                                 type: integer
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
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *
 * /admin/payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     description: Admin only - Get comprehensive payment statistics and analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [all, today, week, month, year]
 *           default: all
 *         description: Time period for statistics
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get payment statistics success
 *                 result:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total_payments:
 *                           type: integer
 *                         completed_payments:
 *                           type: integer
 *                         pending_payments:
 *                           type: integer
 *                         failed_payments:
 *                           type: integer
 *                         refunded_payments:
 *                           type: integer
 *                         total_revenue:
 *                           type: number
 *                     payment_methods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           amount:
 *                             type: number
 *                     payment_status:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           amount:
 *                             type: number
 *                     payment_trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           total_payments:
 *                             type: integer
 *                           total_amount:
 *                             type: number
 *                           completed_payments:
 *                             type: integer
 *                           completed_amount:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *
 * /admin/payments/{payment_id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Admin only - Get detailed payment information
 *     tags: [Admin]
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
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get payment success
 *                 result:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid payment ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Payment not found
 *
 * /admin/payments/{payment_id}/status:
 *   put:
 *     summary: Update payment status
 *     description: Admin only - Update payment status and details
 *     tags: [Admin]
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
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID (optional)
 *               admin_note:
 *                 type: string
 *                 description: Admin note for the status change
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
 *         description: Invalid payment ID or status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Payment not found
 *
 * /admin/notifications/system:
 *   post:
 *     summary: Create system notification
 *     description: Admin only - Send system notification to multiple users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *               - title
 *               - content
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to send notification to
 *               title:
 *                 type: string
 *                 description: Notification title
 *               content:
 *                 type: string
 *                 description: Notification content
 *               link:
 *                 type: string
 *                 description: Optional link for the notification
 *     responses:
 *       200:
 *         description: System notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create system notification success
 *                 result:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     count:
 *                       type: integer
 *                       description: Number of notifications sent
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *
 * /admin/coupons:
 *   get:
 *     summary: Get all coupons (Admin)
 *     description: Admin only - Get list of all coupons
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *
 *   post:
 *     summary: Create coupon
 *     description: Admin only - Create a new coupon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon created successfully
 *
 * /admin/coupons/{coupon_id}:
 *   get:
 *     summary: Get coupon by ID (Admin)
 *     description: Admin only - Get coupon details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupon_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *
 *   put:
 *     summary: Update coupon
 *     description: Admin only - Update coupon information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupon_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *
 *   delete:
 *     summary: Delete coupon
 *     description: Admin only - Delete a coupon
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coupon_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *
 * /admin/verify-ticket:
 *   post:
 *     summary: Verify ticket QR code
 *     description: Admin only - Verify a ticket QR code at the theater entrance
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Ticket verified successfully
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
 *                     payment_status:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     movie:
 *                       type: object
 *                     theater:
 *                       type: object
 *                     screen:
 *                       type: object
 *                     showtime:
 *                       type: object
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                     booking_time:
 *                       type: string
 *                       format: date-time
 *                     verified_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid or missing ticket code
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Ticket not found
 */
