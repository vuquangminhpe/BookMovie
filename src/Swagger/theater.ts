/**
 * @swagger
 * /cinema/theaters:
 *   get:
 *     summary: Get all theaters
 *     description: Retrieve a list of all theaters with pagination and filtering options
 *     tags: [Theaters]
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
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *         description: Filter by theater status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for theater name or location
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
 *                   example: Get theaters success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theaters:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Theater'
 *                     total:
 *                       type: integer
 *                       example: 20
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 2
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Create a new theater
 *     description: Create a new theater (admin only)
 *     tags: [Theaters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location, address, city, state, pincode, screens]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "PVR Cinemas"
 *               location:
 *                 type: string
 *                 example: "City Center Mall"
 *               address:
 *                 type: string
 *                 example: "123 Main Street"
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               pincode:
 *                 type: string
 *                 example: "400001"
 *               screens:
 *                 type: integer
 *                 example: 5
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Parking", "Food Court", "Gaming Zone"]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Theater created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create theater success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theater_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/theaters/{theater_id}:
 *   get:
 *     summary: Get theater by ID
 *     description: Retrieve a theater by its ID
 *     tags: [Theaters]
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
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
 *                   example: Get theater success
 *                 result:
 *                   $ref: '#/components/schemas/Theater'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update theater
 *     description: Update an existing theater (admin only)
 *     tags: [Theaters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               screens:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *     responses:
 *       200:
 *         description: Theater updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update theater success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theater_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
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
 *     summary: Delete theater
 *     description: Delete a theater (admin only)
 *     tags: [Theaters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
 *     responses:
 *       200:
 *         description: Theater deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete theater success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theater_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
