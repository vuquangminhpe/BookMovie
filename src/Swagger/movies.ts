/**
 * @swagger
 * components:
 *   schemas:
 *     CastMember:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: TMDB person ID
 *           example: 500
 *         name:
 *           type: string
 *           description: Actor name
 *           example: "Tom Cruise"
 *         character:
 *           type: string
 *           description: Character name in the movie
 *           example: "Ethan Hunt"
 *         order:
 *           type: integer
 *           description: Cast order (0 = lead actor)
 *           example: 0
 *         profile_image:
 *           type: string
 *           description: Actor profile image URL from TMDB
 *           example: "https://image.tmdb.org/t/p/w185/eOWwvlmqazqkc8eEODI9cCqzBNs.jpg"
 *         gender:
 *           type: integer
 *           description: Gender (0=Not specified, 1=Female, 2=Male)
 *           example: 2
 *     
 *     Movie:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         title:
 *           type: string
 *           example: "Mission: Impossible – Dead Reckoning Part One"
 *         description:
 *           type: string
 *           example: "Ethan Hunt and his IMF team embark on their most dangerous mission yet: tracking down a terrifying new weapon that threatens all of humanity."
 *         duration:
 *           type: integer
 *           description: Duration in minutes
 *           example: 163
 *         genre:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Action", "Adventure", "Thriller"]
 *         language:
 *           type: string
 *           example: "en"
 *         release_date:
 *           type: string
 *           format: date
 *           example: "2023-07-10"
 *         director:
 *           type: string
 *           example: "Christopher McQuarrie"
 *         cast:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CastMember'
 *         poster_url:
 *           type: string
 *           description: Movie poster image URL from TMDB
 *           example: "https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg"
 *         trailer_url:
 *           type: string
 *           description: YouTube trailer URL
 *           example: "https://www.youtube.com/watch?v=avz06PDqDbM"
 *         status:
 *           type: string
 *           enum: [coming_soon, now_showing, ended]
 *           example: "now_showing"
 *         average_rating:
 *           type: number
 *           format: float
 *           description: Average rating from TMDB (0-10)
 *           example: 8.2
 *         ratings_count:
 *           type: integer
 *           description: Number of ratings from TMDB
 *           example: 1547
 *         is_featured:
 *           type: boolean
 *           description: Whether movie is featured on homepage
 *           example: true
 *         featured_order:
 *           type: integer
 *           nullable: true
 *           description: Display order for featured movies
 *           example: 1
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2023-07-01T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2023-07-01T10:00:00.000Z"

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
 *           enum: [release_date, average_rating, ratings_count, title, created_at]
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
 *       - in: query
 *         name: is_featured
 *         schema:
 *           type: boolean
 *         description: Filter featured movies only
 *       - in: query
 *         name: min_rating
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum average rating filter
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
 *                 example: "Mission: Impossible – Dead Reckoning Part One"
 *               description:
 *                 type: string
 *                 example: "Ethan Hunt and his IMF team embark on their most dangerous mission yet: tracking down a terrifying new weapon that threatens all of humanity."
 *               duration:
 *                 type: integer
 *                 example: 163
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Action", "Adventure", "Thriller"]
 *               language:
 *                 type: string
 *                 example: "en"
 *               release_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-07-10"
 *               director:
 *                 type: string
 *                 example: "Christopher McQuarrie"
 *               cast:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CastMember'
 *                 example: [
 *                   {
 *                     "id": 500,
 *                     "name": "Tom Cruise",
 *                     "character": "Ethan Hunt",
 *                     "order": 0,
 *                     "profile_image": "https://image.tmdb.org/t/p/w185/eOWwvlmqazqkc8eEODI9cCqzBNs.jpg",
 *                     "gender": 2
 *                   },
 *                   {
 *                     "id": 8891,
 *                     "name": "Rebecca Ferguson",
 *                     "character": "Ilsa Faust", 
 *                     "order": 1,
 *                     "profile_image": "https://image.tmdb.org/t/p/w185/lJloTOheuQSirSLXNA3JHsrMNfH.jpg",
 *                     "gender": 1
 *                   }
 *                 ]
 *               poster_url:
 *                 type: string
 *                 example: "https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg"
 *               trailer_url:
 *                 type: string
 *                 description: YouTube trailer URL
 *                 example: "https://www.youtube.com/watch?v=avz06PDqDbM"
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *                 example: "now_showing"
 *               average_rating:
 *                 type: number
 *                 format: float
 *                 example: 8.2
 *               ratings_count:
 *                 type: integer
 *                 example: 1547
 *               is_featured:
 *                 type: boolean
 *                 example: true
 *               featured_order:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
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

 * /cinema/movies/featured:
 *   get:
 *     summary: Get featured movies
 *     description: Retrieve featured movies for homepage slider
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of featured movies to return
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
 *                   example: Get featured movies success
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'

 * /cinema/movies/{movie_id}:
 *   get:
 *     summary: Get movie by ID
 *     description: Retrieve a movie by its ID with full details including cast images and trailer
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
 *             example:
 *               message: "Get movie success"
 *               result:
 *                 _id: "60d21b4667d0d8992e610c85"
 *                 title: "Mission: Impossible – Dead Reckoning Part One"
 *                 description: "Ethan Hunt and his IMF team embark on their most dangerous mission yet"
 *                 duration: 163
 *                 genre: ["Action", "Adventure", "Thriller"]
 *                 language: "en"
 *                 release_date: "2023-07-10"
 *                 director: "Christopher McQuarrie"
 *                 cast: [
 *                   {
 *                     "id": 500,
 *                     "name": "Tom Cruise",
 *                     "character": "Ethan Hunt",
 *                     "order": 0,
 *                     "profile_image": "https://image.tmdb.org/t/p/w185/eOWwvlmqazqkc8eEODI9cCqzBNs.jpg",
 *                     "gender": 2
 *                   }
 *                 ]
 *                 poster_url: "https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg"
 *                 trailer_url: "https://www.youtube.com/watch?v=avz06PDqDbM"
 *                 status: "now_showing"
 *                 average_rating: 8.2
 *                 ratings_count: 1547
 *                 is_featured: true
 *                 featured_order: 1
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'

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
 *                   $ref: '#/components/schemas/CastMember'
 *               poster_url:
 *                 type: string
 *               trailer_url:
 *                 type: string
 *                 description: YouTube trailer URL
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *               average_rating:
 *                 type: number
 *                 format: float
 *               ratings_count:
 *                 type: integer
 *               is_featured:
 *                 type: boolean
 *               featured_order:
 *                 type: integer
 *                 nullable: true
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

 * /cinema/movies/{movie_id}/cast:
 *   get:
 *     summary: Get movie cast
 *     description: Retrieve detailed cast information for a specific movie
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
 *                   example: Get movie cast success
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CastMember'

 * /cinema/movies/search:
 *   get:
 *     summary: Advanced movie search
 *     description: Search movies with advanced filters and full-text search
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (title, description, director, cast)
 *       - in: query
 *         name: genres
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by multiple genres
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by release year
 *       - in: query
 *         name: rating_min
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum rating filter
 *       - in: query
 *         name: rating_max
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum rating filter
 *       - in: query
 *         name: duration_min
 *         schema:
 *           type: integer
 *         description: Minimum duration in minutes
 *       - in: query
 *         name: duration_max
 *         schema:
 *           type: integer
 *         description: Maximum duration in minutes
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
 *                   example: Search movies success
 *                 result:
 *                   type: object
 *                   properties:
 *                     movies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Movie'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 */
