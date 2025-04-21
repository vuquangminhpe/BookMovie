/**
 * @swagger
 * tags:
 *   name: Screens
 *   description: Screen/auditorium management
 *
 * /cinema/screens:
 *   get:
 *     summary: Get all screens
 *     description: Retrieve a list of all screens with pagination and filtering options
 *     tags: [Screens]
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
 *         name: theater_id
 *         schema:
 *           type: string
 *         description: Filter by theater ID
 *       - in: query
 *         name: screen_type
 *         schema:
 *           type: string
 *           enum: [standard, premium, imax, 3d, 4dx]
 *         description: Filter by screen type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *         description: Filter by screen status
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: name
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
 *                   example: Get screens success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c88"
 *                           theater_id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c86"
 *                           name:
 *                             type: string
 *                             example: "Screen 1"
 *                           capacity:
 *                             type: integer
 *                             example: 150
 *                           screen_type:
 *                             type: string
 *                             example: "imax"
 *                           status:
 *                             type: string
 *                             example: "active"
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
 *                               city:
 *                                 type: string
 *                                 example: "Mumbai"
 *                     total:
 *                       type: integer
 *                       example: 30
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 3
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Create a new screen
 *     description: Create a new screen (admin only)
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theater_id, name, seat_layout, capacity]
 *             properties:
 *               theater_id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c86"
 *               name:
 *                 type: string
 *                 example: "Screen 3"
 *               seat_layout:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: string
 *                         example: "A"
 *                       number:
 *                         type: integer
 *                         example: 1
 *                       type:
 *                         type: string
 *                         enum: [regular, premium, recliner, couple]
 *                         example: "regular"
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, maintenance]
 *                         example: "active"
 *                 example: [
 *                   [
 *                     {"row": "A", "number": 1, "type": "regular", "status": "active"},
 *                     {"row": "A", "number": 2, "type": "regular", "status": "active"}
 *                   ],
 *                   [
 *                     {"row": "B", "number": 1, "type": "premium", "status": "active"},
 *                     {"row": "B", "number": 2, "type": "premium", "status": "active"}
 *                   ]
 *                 ]
 *               capacity:
 *                 type: integer
 *                 example: 120
 *               screen_type:
 *                 type: string
 *                 enum: [standard, premium, imax, 3d, 4dx]
 *                 example: "premium"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Screen created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create screen success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screen_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c88"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/screens/{screen_id}:
 *   get:
 *     summary: Get screen by ID
 *     description: Retrieve a screen by its ID
 *     tags: [Screens]
 *     parameters:
 *       - in: path
 *         name: screen_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Screen ID
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
 *                   example: Get screen success
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c88"
 *                     theater_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *                     name:
 *                       type: string
 *                       example: "Screen 1"
 *                     seat_layout:
 *                       type: array
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             row:
 *                               type: string
 *                               example: "A"
 *                             number:
 *                               type: integer
 *                               example: 1
 *                             type:
 *                               type: string
 *                               example: "regular"
 *                             status:
 *                               type: string
 *                               example: "active"
 *                     capacity:
 *                       type: integer
 *                       example: 150
 *                     screen_type:
 *                       type: string
 *                       example: "imax"
 *                     status:
 *                       type: string
 *                       example: "active"
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
 *                         city:
 *                           type: string
 *                           example: "Mumbai"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update screen
 *     description: Update an existing screen (admin only)
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: screen_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Screen ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Screen 3 Updated"
 *               seat_layout:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: string
 *                         example: "A"
 *                       number:
 *                         type: integer
 *                         example: 1
 *                       type:
 *                         type: string
 *                         enum: [regular, premium, recliner, couple]
 *                         example: "regular"
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, maintenance]
 *                         example: "active"
 *               capacity:
 *                 type: integer
 *                 example: 130
 *               screen_type:
 *                 type: string
 *                 enum: [standard, premium, imax, 3d, 4dx]
 *                 example: "premium"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 example: "maintenance"
 *     responses:
 *       200:
 *         description: Screen updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update screen success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screen_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c88"
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
 *     summary: Delete screen
 *     description: Delete a screen (admin only)
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: screen_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Screen ID
 *     responses:
 *       200:
 *         description: Screen deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete screen success
 *                 result:
 *                   type: object
 *                   properties:
 *                     screen_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c88"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
