/**
 * @swagger
 * /recommendations/personalized/{user_id}:
 *   get:
 *     summary: Get personalized movie recommendations
 *     description: Retrieve a list of movie recommendations personalized for a specific user based on their watching history, ratings, and favorites
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get personalized recommendations for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of recommendations to return
 *       - in: query
 *         name: excludeIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of movie IDs to exclude from recommendations
 *     responses:
 *       200:
 *         description: A list of personalized movie recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get personalized recommendations successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Invalid request or error processing the recommendation
 *       401:
 *         description: Unauthorized - user not authenticated
 *
 * /recommendations/similar/{movie_id}:
 *   get:
 *     summary: Get similar movies
 *     description: Retrieve a list of movies similar to a specific movie based on genre
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID to find similar movies for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of similar movies to return
 *       - in: query
 *         name: excludeIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of movie IDs to exclude from results
 *     responses:
 *       200:
 *         description: A list of similar movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get similar movies successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Invalid movie ID or error processing the request
 *
 * /recommendations/popular:
 *   get:
 *     summary: Get popular movies
 *     description: Retrieve a list of popular movies based on ratings and booking count
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of popular movies to return
 *       - in: query
 *         name: excludeIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of movie IDs to exclude from results
 *     responses:
 *       200:
 *         description: A list of popular movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get popular movies successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Error processing the request
 *
 * /recommendations/rated:
 *   get:
 *     summary: Get highly rated movies
 *     description: Retrieve a list of highly rated movies (4+ stars with at least 5 ratings)
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of highly rated movies to return
 *       - in: query
 *         name: excludeIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of movie IDs to exclude from results
 *     responses:
 *       200:
 *         description: A list of highly rated movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get highly rated movies successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Error processing the request
 */
