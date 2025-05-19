/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Get user favorites
 *     description: Retrieve a list of movies that the authenticated user has added to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get favorites successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Add movie to favorites
 *     description: Add a movie to the authenticated user's favorites list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movie_id
 *             properties:
 *               movie_id:
 *                 type: string
 *                 description: ID of the movie to add to favorites
 *     responses:
 *       201:
 *         description: Movie added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Movie added to favorites
 *       400:
 *         description: Invalid movie ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /favorites/{movie_id}:
 *   delete:
 *     summary: Remove movie from favorites
 *     description: Remove a movie from the authenticated user's favorites list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the movie to remove from favorites
 *     responses:
 *       200:
 *         description: Movie removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Movie removed from favorites
 *       400:
 *         description: Invalid movie ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /favorites/{movie_id}/status:
 *   get:
 *     summary: Check favorite status
 *     description: Check if a movie is in the authenticated user's favorites list
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the movie to check favorite status
 *     responses:
 *       200:
 *         description: Favorite status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get favorite status successfully
 *                 result:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid movie ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
