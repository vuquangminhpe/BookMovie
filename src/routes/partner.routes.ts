import { Router } from 'express'
import {
  createPartnerController,
  getPartnersController,
  getPartnerController,
  updatePartnerController,
  deletePartnerController,
  createPartnerMovieController,
  getPartnerMoviesController,
  updatePartnerMovieController,
  deletePartnerMovieController
} from '../controllers/partner.controllers'
import {
  createPartnerValidator,
  updatePartnerValidator,
  partnerIdValidator,
  createPartnerMovieValidator,
  updatePartnerMovieValidator,
  partnerMovieIdValidator
} from '../middlewares/partner.middlewares'
import { AccessTokenValidator, verifiedUserValidator } from '../middlewares/users.middlewares'
import { wrapAsync } from '../utils/handler'

const partnerRouter = Router()

/**
 * Description: Create new partner
 * Path: /partners
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: CreatePartnerReqBody
 */
partnerRouter.post(
  '/',
  AccessTokenValidator,
  verifiedUserValidator,
  createPartnerValidator,
  wrapAsync(createPartnerController)
)

/**
 * Description: Get all partners with filtering
 * Path: /partners
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Query: GetPartnersReqQuery
 */
partnerRouter.get('/', AccessTokenValidator, verifiedUserValidator, wrapAsync(getPartnersController))

/**
 * Description: Get partner by ID
 * Path: /partners/:partner_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { partner_id: string }
 */
partnerRouter.get(
  '/:partner_id',
  AccessTokenValidator,
  verifiedUserValidator,
  partnerIdValidator,
  wrapAsync(getPartnerController)
)

/**
 * Description: Update partner
 * Path: /partners/:partner_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Params: { partner_id: string }
 * Body: UpdatePartnerReqBody
 */
partnerRouter.put(
  '/:partner_id',
  AccessTokenValidator,
  verifiedUserValidator,
  partnerIdValidator,
  updatePartnerValidator,
  wrapAsync(updatePartnerController)
)

/**
 * Description: Delete partner
 * Path: /partners/:partner_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 * Params: { partner_id: string }
 */
partnerRouter.delete(
  '/:partner_id',
  AccessTokenValidator,
  verifiedUserValidator,
  partnerIdValidator,
  wrapAsync(deletePartnerController)
)

// =============================================================================
// PARTNER MOVIE MANAGEMENT ROUTES
// =============================================================================

/**
 * Description: Create movie for partner
 * Path: /partners/:partner_id/movies
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Params: { partner_id: string }
 * Body: CreatePartnerMovieReqBody
 */
partnerRouter.post(
  '/:partner_id/movies',
  AccessTokenValidator,
  verifiedUserValidator,
  partnerIdValidator,
  createPartnerMovieValidator,
  wrapAsync(createPartnerMovieController)
)

/**
 * Description: Get all movies for partner
 * Path: /partners/:partner_id/movies
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 * Params: { partner_id: string }
 * Query: GetPartnerMoviesReqQuery
 */
partnerRouter.get(
  '/:partner_id/movies',
  AccessTokenValidator,
  verifiedUserValidator,
  partnerIdValidator,
  wrapAsync(getPartnerMoviesController)
)

/**
 * Description: Update partner movie
 * Path: /partners/:partner_id/movies/:movie_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Params: { partner_id: string, movie_id: string }
 * Body: UpdatePartnerMovieReqBody
 */
partnerRouter.put(
  '/:partner_id/movies/:movie_id',
  AccessTokenValidator,
  verifiedUserValidator,
  partnerIdValidator,
  partnerMovieIdValidator,
  updatePartnerMovieValidator,
  wrapAsync(updatePartnerMovieController)
)

/**
 * Description: Delete partner movie
 * Path: /partners/:partner_id/movies/:movie_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 * Params: { partner_id: string, movie_id: string }
 */
partnerRouter.delete(
  '/:partner_id/movies/:movie_id',
  AccessTokenValidator,
  verifiedUserValidator,
  partnerIdValidator,
  partnerMovieIdValidator,
  wrapAsync(deletePartnerMovieController)
)

export default partnerRouter
