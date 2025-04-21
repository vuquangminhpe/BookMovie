/**
 * @swagger
 * /cinema/movies:
 *   get:
 *     summary: Get all movies
 *     description: Retrieve a list of all movies with pagination and filtering options
 *     tags: [Movies]
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
 *           enum: [coming_soon, now_showing, ended]
 *         description: Filter by movie status
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by movie genre
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by movie language
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for movie title or description
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: release_date
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: release_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by release date from
 *       - in: query
 *         name: release_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by release date to
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
 *                   example: Get movies success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Movie'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total_pages:
 *                       type: integer
 *                       example: 5
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Create a new movie
 *     description: Create a new movie (admin only)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, duration, genre, language, release_date, director, cast, poster_url]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Avengers: Endgame"
 *               description:
 *                 type: string
 *                 example: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe."
 *               duration:
 *                 type: integer
 *                 example: 181
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Action", "Adventure", "Drama"]
 *               language:
 *                 type: string
 *                 example: "English"
 *               release_date:
 *                 type: string
 *                 format: date
 *                 example: "2019-04-26"
 *               director:
 *                 type: string
 *                 example: "Anthony Russo, Joe Russo"
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo"]
 *               poster_url:
 *                 type: string
 *                 example: "https://example.com/poster.jpg"
 *               trailer_url:
 *                 type: string
 *                 example: "https://example.com/trailer.mp4"
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *                 example: "now_showing"
 *     responses:
 *       200:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create movie success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movie_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /cinema/movies/{movie_id}:
 *   get:
 *     summary: Get movie by ID
 *     description: Retrieve a movie by its ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
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
 *                   example: Get movie success
 *                 result:
 *                   $ref: '#/components/schemas/Movie'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update movie
 *     description: Update an existing movie (admin only)
 *     tags: [Movies]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               director:
 *                 type: string
 *               cast:
 *                 type: array
 *                 items:
 *                   type: string
 *               poster_url:
 *                 type: string
 *               trailer_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update movie success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movie_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
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
 *     summary: Delete movie
 *     description: Delete a movie (admin only)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete movie success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movie_id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
