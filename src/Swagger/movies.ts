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
 *         created_by:
 *           type: string
 *           description: Staff ID who created this movie
 *           example: "60d21b4667d0d8992e610c86"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2023-07-01T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2023-07-01T10:00:00.000Z"
 *
 *     Screen:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         theater_id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c84"
 *         name:
 *           type: string
 *           example: "Screen 1"
 *         seat_layout:
 *           type: array
 *           items:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 row:
 *                   type: string
 *                   example: "A"
 *                 number:
 *                   type: integer
 *                   example: 1
 *                 type:
 *                   type: string
 *                   enum: [regular, premium, recliner, couple]
 *                   example: "regular"
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, maintenance]
 *                   example: "active"
 *         capacity:
 *           type: integer
 *           example: 150
 *         screen_type:
 *           type: string
 *           enum: [standard, premium, imax, 3d, 4dx]
 *           example: "standard"
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *           example: "active"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
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
 *         description: Search term for movie title, description, director, or cast
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
 *
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
 *         example: "Tom Cruise"
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *         example: "Action"
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by release year
 *         example: 2023
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *         example: "en"
 *       - in: query
 *         name: rating_min
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum rating filter
 *         example: 7.0
 *       - in: query
 *         name: rating_max
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum rating filter
 *         example: 9.0
 *       - in: query
 *         name: duration_min
 *         schema:
 *           type: integer
 *         description: Minimum duration in minutes
 *         example: 90
 *       - in: query
 *         name: duration_max
 *         schema:
 *           type: integer
 *         description: Maximum duration in minutes
 *         example: 180
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
 *     responses:
 *       200:
 *         description: Search results
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
 *                     query:
 *                       type: string
 *                     filters:
 *                       type: object
 *
 * /cinema/movies/categories/featured:
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
 *         description: Featured movies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get movies success
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *
 * /cinema/movies/categories/now-showing:
 *   get:
 *     summary: Get now showing movies
 *     description: Retrieve movies currently showing in theaters
 *     tags: [Movies]
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
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: release_date
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Now showing movies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get now showing movies success
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
 *
 * /cinema/movies/categories/coming-soon:
 *   get:
 *     summary: Get coming soon movies
 *     description: Retrieve movies that will be released in the future
 *     tags: [Movies]
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
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: release_date
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Coming soon movies retrieved successfully
 *
 * /cinema/movies/categories/top-rated:
 *   get:
 *     summary: Get top rated movies
 *     description: Retrieve highest rated movies with minimum rating threshold
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of movies to return
 *       - in: query
 *         name: min_ratings_count
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Minimum number of ratings required
 *       - in: query
 *         name: time_period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: all
 *         description: Time period filter
 *     responses:
 *       200:
 *         description: Top rated movies retrieved successfully
 *
 * /cinema/movies/categories/trending:
 *   get:
 *     summary: Get trending movies
 *     description: Retrieve movies trending based on recent activity
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look back for activity
 *     responses:
 *       200:
 *         description: Trending movies retrieved successfully
 *
 * /cinema/movies/categories/popular:
 *   get:
 *     summary: Get popular movies
 *     description: Retrieve popular movies based on booking activity
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: time_period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Popular movies retrieved successfully
 *
 * /cinema/movies/categories/recently-added:
 *   get:
 *     summary: Get recently added movies
 *     description: Retrieve movies added to the system recently
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Recently added movies retrieved successfully
 *
 * /cinema/movies/genre/{genre}:
 *   get:
 *     summary: Get movies by genre
 *     description: Retrieve movies filtered by specific genre
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre name
 *         example: "Action"
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
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: release_date
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Movies by genre retrieved successfully
 *
 * /cinema/movies/with-showtimes:
 *   get:
 *     summary: Get movies with showtimes
 *     description: Retrieve movies that have upcoming showtimes
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: theater_id
 *         schema:
 *           type: string
 *         description: Filter by specific theater
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
 *     responses:
 *       200:
 *         description: Movies with showtimes retrieved successfully
 *
 * /cinema/movies/meta/stats:
 *   get:
 *     summary: Get movie statistics
 *     description: Retrieve comprehensive movie statistics
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Movie statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get movie statistics success
 *                 result:
 *                   type: object
 *                   properties:
 *                     total_movies:
 *                       type: integer
 *                     by_status:
 *                       type: object
 *                       properties:
 *                         now_showing:
 *                           type: integer
 *                         coming_soon:
 *                           type: integer
 *                         ended:
 *                           type: integer
 *                     ratings:
 *                       type: object
 *                       properties:
 *                         total_ratings:
 *                           type: integer
 *                         average_rating:
 *                           type: number
 *                     genres:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     languages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     recent_additions:
 *                       type: integer
 *
 * /cinema/movies/meta/genres:
 *   get:
 *     summary: Get available genres
 *     description: Retrieve list of all available movie genres
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Available genres retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get available genres success
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Action"
 *                       count:
 *                         type: integer
 *                         example: 25
 *
 * /cinema/movies/meta/languages:
 *   get:
 *     summary: Get available languages
 *     description: Retrieve list of all available movie languages
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Available languages retrieved successfully
 *
 * /staff/screens/stats:
 *   get:
 *     summary: Get my screen statistics
 *     description: Staff only - Get comprehensive statistics for staff's theater screens
 *     tags: [Staff - Screen Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Screen statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get my screen statistics success
 *                 result:
 *                   type: object
 *                   properties:
 *                     theater_info:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         location:
 *                           type: string
 *                         max_screens:
 *                           type: integer
 *                     screen_statistics:
 *                       type: object
 *                       properties:
 *                         total_screens:
 *                           type: integer
 *                         active_screens:
 *                           type: integer
 *                         inactive_screens:
 *                           type: integer
 *                         maintenance_screens:
 *                           type: integer
 *                         total_capacity:
 *                           type: integer
 *                         screens_utilization:
 *                           type: number
 *                           description: Percentage of active screens
 *                     showtime_statistics:
 *                       type: object
 *                       properties:
 *                         total_showtimes:
 *                           type: integer
 *                         upcoming_showtimes:
 *                           type: integer
 *                     screen_types:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         standard: 5
 *                         premium: 2
 *                         imax: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No theater found
 *
 * /staff/theater/{theater_id}/screens:
 *   post:
 *     summary: Create screen for my theater
 *     description: Staff only - Create a new screen for staff's theater with capacity validation
 *     tags: [Staff - Screen Management]
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
 *             required:
 *               - name
 *               - seat_layout
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 description: Screen name (must be unique within theater)
 *                 example: "Screen 1"
 *               seat_layout:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: string
 *                         description: Seat row identifier
 *                         example: "A"
 *                       number:
 *                         type: integer
 *                         description: Seat number
 *                         example: 1
 *                       type:
 *                         type: string
 *                         enum: [regular, premium, recliner, couple]
 *                         description: Seat type
 *                         example: "regular"
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, maintenance]
 *                         description: Seat status
 *                         example: "active"
 *                 description: Seat layout matrix
 *               capacity:
 *                 type: integer
 *                 description: Total screen capacity (must match seat layout count)
 *                 example: 150
 *               screen_type:
 *                 type: string
 *                 enum: [standard, premium, imax, 3d, 4dx]
 *                 description: Screen type
 *                 default: standard
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 description: Screen status
 *                 default: active
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
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     capacity_exceeded: "Theater can only have maximum 8 screens. Current: 7"
 *                     duplicate_name: "Screen name already exists in this theater"
 *                     capacity_mismatch: "Capacity must match total number of seats in seat layout"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to create screen for this theater
 *
 *   get:
 *     summary: Get screens of my theater
 *     description: Staff only - Get all screens for staff's theater with enhanced details
 *     tags: [Staff - Screen Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: theater_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theater ID
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
 *         description: Screens retrieved successfully
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
 *                         allOf:
 *                           - $ref: '#/components/schemas/Screen'
 *                           - type: object
 *                             properties:
 *                               showtime_count:
 *                                 type: integer
 *                                 description: Number of upcoming showtimes
 *                               upcoming_showtimes:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     _id:
 *                                       type: string
 *                                     start_time:
 *                                       type: string
 *                                       format: date-time
 *                                     end_time:
 *                                       type: string
 *                                       format: date-time
 *                                     status:
 *                                       type: string
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
 *         description: Not authorized to access this theater
 *
 * /staff/screens/{screen_id}:
 *   get:
 *     summary: Get my screen details
 *     description: Staff only - Get detailed screen information with statistics
 *     tags: [Staff - Screen Management]
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
 *         description: Screen details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get screen success
 *                 result:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Screen'
 *                     - type: object
 *                       properties:
 *                         theater:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             location:
 *                               type: string
 *                             city:
 *                               type: string
 *                             address:
 *                               type: string
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             total_showtimes:
 *                               type: integer
 *                             upcoming_showtimes:
 *                               type: integer
 *                             active_bookings:
 *                               type: integer
 *                         recent_showtimes:
 *                           type: array
 *                           items:
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
 *                               status:
 *                                 type: string
 *                               available_seats:
 *                                 type: integer
 *       404:
 *         description: Screen not found or not owned by staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update my screen
 *     description: Staff only - Update screen information with validation
 *     tags: [Staff - Screen Management]
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
 *                 description: Screen name
 *               seat_layout:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                 description: Seat layout matrix
 *               capacity:
 *                 type: integer
 *                 description: Screen capacity
 *               screen_type:
 *                 type: string
 *                 enum: [standard, premium, imax, 3d, 4dx]
 *                 description: Screen type
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 description: Screen status
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
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     duplicate_name: "Screen name already exists in this theater"
 *                     capacity_reduction: "Cannot reduce screen capacity while there are active showtimes"
 *       404:
 *         description: Screen not found or not owned by staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete my screen
 *     description: Staff only - Delete or deactivate a screen based on constraints
 *     tags: [Staff - Screen Management]
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
 *         description: Screen action completed successfully
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
 *                     message:
 *                       type: string
 *                       examples:
 *                         deleted: "Screen deleted successfully"
 *                         deactivated_showtimes: "Screen marked as inactive due to existing future showtimes"
 *                         deactivated_bookings: "Screen marked as inactive due to booking history"
 *       404:
 *         description: Screen not found or not owned by staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/movies:
 *   get:
 *     summary: Get my movies
 *     description: Staff only - Get list of movies created by current staff with filtering options
 *     tags: [Staff - Movie Management]
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
 *         description: Search by movie title
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
 *         description: Filter by genre
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
 *     responses:
 *       200:
 *         description: My movies retrieved successfully
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
 *                         allOf:
 *                           - $ref: '#/components/schemas/Movie'
 *                           - type: object
 *                             properties:
 *                               creator:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   email:
 *                                     type: string
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
 *
 *   post:
 *     summary: Create my movie
 *     description: Staff only - Create a new movie with ownership
 *     tags: [Staff - Movie Management]
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
 *               - description
 *               - duration
 *               - genre
 *               - language
 *               - release_date
 *               - director
 *               - cast
 *               - poster_url
 *             properties:
 *               title:
 *                 type: string
 *                 description: Movie title
 *                 example: "Avatar: The Way of Water"
 *               description:
 *                 type: string
 *                 description: Movie description
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 example: 192
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Movie genres
 *                 example: ["Action", "Adventure", "Sci-Fi"]
 *               language:
 *                 type: string
 *                 description: Movie language
 *                 example: "English"
 *               release_date:
 *                 type: string
 *                 format: date
 *                 description: Release date
 *               director:
 *                 type: string
 *                 description: Movie director
 *                 example: "James Cameron"
 *               cast:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CastMember'
 *                 description: Movie cast
 *               poster_url:
 *                 type: string
 *                 description: Poster image URL
 *               trailer_url:
 *                 type: string
 *                 description: Trailer video URL
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *                 description: Movie status
 *                 default: coming_soon
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized as staff
 *
 * /staff/movies/{movie_id}:
 *   get:
 *     summary: Get my movie details
 *     description: Staff only - Get specific movie details (must be owned by current staff)
 *     tags: [Staff - Movie Management]
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
 *         description: Movie details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get movie success
 *                 result:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Movie'
 *                     - type: object
 *                       properties:
 *                         creator:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *       404:
 *         description: Movie not found or not owned by current staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update my movie
 *     description: Staff only - Update movie information (must be owned by current staff)
 *     tags: [Staff - Movie Management]
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
 *                 description: Movie title
 *               description:
 *                 type: string
 *                 description: Movie description
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Movie genres
 *               language:
 *                 type: string
 *                 description: Movie language
 *               release_date:
 *                 type: string
 *                 format: date
 *                 description: Release date
 *               director:
 *                 type: string
 *                 description: Movie director
 *               cast:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CastMember'
 *                 description: Movie cast
 *               poster_url:
 *                 type: string
 *                 description: Poster image URL
 *               trailer_url:
 *                 type: string
 *                 description: Trailer video URL
 *               status:
 *                 type: string
 *                 enum: [coming_soon, now_showing, ended]
 *                 description: Movie status
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
 *       404:
 *         description: Movie not found or not owned by current staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete my movie
 *     description: Staff only - Delete a movie (must be owned by current staff)
 *     tags: [Staff - Movie Management]
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
 *       400:
 *         description: Cannot delete movie that has associated showtimes
 *       404:
 *         description: Movie not found or not owned by current staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/movies/stats:
 *   get:
 *     summary: Get my movie statistics
 *     description: Staff only - Get comprehensive statistics for movies owned by current staff
 *     tags: [Staff - Movie Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Movie statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get my movie statistics success
 *                 result:
 *                   type: object
 *                   properties:
 *                     total_movies:
 *                       type: integer
 *                       description: Total movies created by staff
 *                     now_showing:
 *                       type: integer
 *                       description: Movies currently showing
 *                     coming_soon:
 *                       type: integer
 *                       description: Movies coming soon
 *                     ended:
 *                       type: integer
 *                       description: Movies that have ended
 *                     total_ratings:
 *                       type: integer
 *                       description: Total ratings received
 *                     average_rating:
 *                       type: number
 *                       description: Average rating across all movies
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/movies/top-rated:
 *   get:
 *     summary: Get my top rated movies
 *     description: Staff only - Get top rated movies owned by current staff
 *     tags: [Staff - Movie Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of top movies to return
 *     responses:
 *       200:
 *         description: Top rated movies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get my top rated movies success
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/movies/{movie_id}/ratings:
 *   get:
 *     summary: Get ratings for my movie
 *     description: Staff only - Get ratings for movie owned by current staff
 *     tags: [Staff - Movie Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
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
 *         description: Movie ratings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get my movie ratings success
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
 *                           user_id:
 *                             type: string
 *                           movie_id:
 *                             type: string
 *                           rating:
 *                             type: number
 *                             format: float
 *                           comment:
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
 *                               avatar:
 *                                 type: string
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       404:
 *         description: Movie not found or not owned by current staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/movies/{movie_id}/feedbacks:
 *   get:
 *     summary: Get feedbacks for my movie
 *     description: Staff only - Get feedbacks for movie owned by current staff
 *     tags: [Staff - Movie Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movie_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
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
 *         name: include_all
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include all feedback statuses (pending, approved, rejected)
 *     responses:
 *       200:
 *         description: Movie feedbacks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get my movie feedbacks success
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
 *                           user_id:
 *                             type: string
 *                           movie_id:
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
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       404:
 *         description: Movie not found or not owned by current staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/showtimes:
 *   get:
 *     summary: Get showtimes for my movies
 *     description: Staff only - Get showtimes for movies owned by current staff
 *     tags: [Staff - Showtime Management]
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
 *         name: movie_id
 *         schema:
 *           type: string
 *         description: Filter by specific movie ID (must be owned by staff)
 *       - in: query
 *         name: theater_id
 *         schema:
 *           type: string
 *         description: Filter by theater ID
 *       - in: query
 *         name: screen_id
 *         schema:
 *           type: string
 *         description: Filter by screen ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, booking_open, booking_closed, cancelled, completed]
 *         description: Filter by showtime status
 *     responses:
 *       200:
 *         description: Showtimes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get showtimes success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtimes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           movie_id:
 *                             type: string
 *                           screen_id:
 *                             type: string
 *                           theater_id:
 *                             type: string
 *                           start_time:
 *                             type: string
 *                             format: date-time
 *                           end_time:
 *                             type: string
 *                             format: date-time
 *                           price:
 *                             type: object
 *                             properties:
 *                               regular:
 *                                 type: number
 *                               premium:
 *                                 type: number
 *                               recliner:
 *                                 type: number
 *                               couple:
 *                                 type: number
 *                           available_seats:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           movie:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               poster_url:
 *                                 type: string
 *                               duration:
 *                                 type: integer
 *                           theater:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               location:
 *                                 type: string
 *                           screen:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               screen_type:
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
 *
 *   post:
 *     summary: Create showtime for my movie
 *     description: Staff only - Create a new showtime for movie owned by current staff
 *     tags: [Staff - Showtime Management]
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
 *               - screen_id
 *               - theater_id
 *               - start_time
 *               - end_time
 *               - price
 *               - available_seats
 *             properties:
 *               movie_id:
 *                 type: string
 *                 description: Movie ID (must be owned by current staff)
 *               screen_id:
 *                 type: string
 *                 description: Screen ID
 *               theater_id:
 *                 type: string
 *                 description: Theater ID
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime start time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime end time
 *               price:
 *                 type: object
 *                 required:
 *                   - regular
 *                 properties:
 *                   regular:
 *                     type: number
 *                     description: Regular seat price
 *                   premium:
 *                     type: number
 *                     description: Premium seat price
 *                   recliner:
 *                     type: number
 *                     description: Recliner seat price
 *                   couple:
 *                     type: number
 *                     description: Couple seat price
 *                 description: Ticket prices
 *               available_seats:
 *                 type: integer
 *                 description: Number of available seats
 *               status:
 *                 type: string
 *                 enum: [scheduled, booking_open, booking_closed, cancelled, completed]
 *                 description: Showtime status
 *                 default: scheduled
 *     responses:
 *       200:
 *         description: Showtime created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Create showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtime_id:
 *                       type: string
 *       400:
 *         description: Showtime overlap or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     overlap: "Showtime overlap detected"
 *                     validation: "Invalid request data"
 *       403:
 *         description: Movie not owned by current staff
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /staff/showtimes/{showtime_id}:
 *   get:
 *     summary: Get my showtime details
 *     description: Staff only - Get specific showtime details (must be for movie owned by current staff)
 *     tags: [Staff - Showtime Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Showtime details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     movie_id:
 *                       type: string
 *                     screen_id:
 *                       type: string
 *                     theater_id:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *                     price:
 *                       type: object
 *                       properties:
 *                         regular:
 *                           type: number
 *                         premium:
 *                           type: number
 *                         recliner:
 *                           type: number
 *                         couple:
 *                           type: number
 *                     available_seats:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     movie:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         poster_url:
 *                           type: string
 *                         duration:
 *                           type: integer
 *                         genre:
 *                           type: array
 *                           items:
 *                             type: string
 *                         language:
 *                           type: string
 *                     theater:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         location:
 *                           type: string
 *                         address:
 *                           type: string
 *                         city:
 *                           type: string
 *                     screen:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         screen_type:
 *                           type: string
 *                         capacity:
 *                           type: integer
 *                         seat_layout:
 *                           type: array
 *                     booked_seats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: string
 *                           number:
 *                             type: integer
 *       404:
 *         description: Showtime not found or not authorized
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     summary: Update my showtime
 *     description: Staff only - Update showtime information (must be for movie owned by current staff)
 *     tags: [Staff - Showtime Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime start time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Showtime end time
 *               price:
 *                 type: object
 *                 properties:
 *                   regular:
 *                     type: number
 *                   premium:
 *                     type: number
 *                   recliner:
 *                     type: number
 *                   couple:
 *                     type: number
 *                 description: Ticket prices
 *               available_seats:
 *                 type: integer
 *                 description: Number of available seats
 *               status:
 *                 type: string
 *                 enum: [scheduled, booking_open, booking_closed, cancelled, completed]
 *                 description: Showtime status
 *     responses:
 *       200:
 *         description: Showtime updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtime_id:
 *                       type: string
 *       400:
 *         description: Showtime overlap or validation error
 *       403:
 *         description: Not authorized to update this showtime
 *       404:
 *         description: Showtime not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     summary: Delete my showtime
 *     description: Staff only - Delete a showtime (must be for movie owned by current staff)
 *     tags: [Staff - Showtime Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: showtime_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Showtime ID
 *     responses:
 *       200:
 *         description: Showtime deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete showtime success
 *                 result:
 *                   type: object
 *                   properties:
 *                     showtime_id:
 *                       type: string
 *       403:
 *         description: Not authorized to delete this showtime
 *       404:
 *         description: Showtime not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * components:
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Access token is required"
 *
 *     ValidationError:
 *       description: Request validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Validation error"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 *
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Internal server error"
 *
 *     NotFoundError:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Resource not found"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT */
