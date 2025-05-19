/**
 * @swagger
 * /banners/home-slider:
 *   get:
 *     summary: Get home slider banners
 *     description: Retrieve banners for the home page slider
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of home slider banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get home slider banners successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       link:
 *                         type: string
 *                       type:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /banners/promotions:
 *   get:
 *     summary: Get promotion banners
 *     description: Retrieve banners for promotions
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of promotion banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get promotion banners successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       link:
 *                         type: string
 *                       type:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /banners/announcements:
 *   get:
 *     summary: Get announcement banners
 *     description: Retrieve banners for announcements
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of announcement banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get announcement banners successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       link:
 *                         type: string
 *                       type:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /banners:
 *   get:
 *     summary: Get all banners
 *     description: Admin only - Retrieve all banners with optional filters
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [home_slider, promotion, announcement]
 *         description: Filter by banner type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of all banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get all banners successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       link:
 *                         type: string
 *                       type:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Create a new banner
 *     description: Admin only - Create a new banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - image_url
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 description: Banner title
 *               description:
 *                 type: string
 *                 description: Banner description
 *               image_url:
 *                 type: string
 *                 description: URL of the banner image
 *               link:
 *                 type: string
 *                 description: Action link for the banner (optional)
 *               type:
 *                 type: string
 *                 enum: [home_slider, promotion, announcement]
 *                 description: Banner type
 *               is_active:
 *                 type: boolean
 *                 description: Whether the banner is active (default true)
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for banner display
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date for banner display
 *     responses:
 *       201:
 *         description: Banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Banner created successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     link:
 *                       type: string
 *                     type:
 *                       type: string
 *                     is_active:
 *                       type: boolean
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /banners/{banner_id}:
 *   get:
 *     summary: Get banner by ID
 *     description: Admin only - Get a specific banner by its ID
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: banner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get banner successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     link:
 *                       type: string
 *                     type:
 *                       type: string
 *                     is_active:
 *                       type: boolean
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid banner ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Banner not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update banner
 *     description: Admin only - Update an existing banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: banner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Banner title
 *               description:
 *                 type: string
 *                 description: Banner description
 *               image_url:
 *                 type: string
 *                 description: URL of the banner image
 *               link:
 *                 type: string
 *                 description: Action link for the banner
 *               type:
 *                 type: string
 *                 enum: [home_slider, promotion, announcement]
 *                 description: Banner type
 *               is_active:
 *                 type: boolean
 *                 description: Whether the banner is active
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for banner display
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date for banner display
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Banner updated successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     link:
 *                       type: string
 *                     type:
 *                       type: string
 *                     is_active:
 *                       type: boolean
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Banner not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete banner
 *     description: Admin only - Delete a banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: banner_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Banner deleted successfully
 *       400:
 *         description: Invalid banner ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: Banner not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
