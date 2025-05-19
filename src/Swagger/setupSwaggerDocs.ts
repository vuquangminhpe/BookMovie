import express from 'express'
import { setupSwagger } from './swagger-config'

// Make sure to import all Swagger docs files to ensure they're included
import './users'
import './movies'
import './bookings'
import './medias'
import './payments'
import './screen'
import './showtimes'
import './theater'
import './recommendations'
import './favorites'
import './ratings'
import './coupons'
import './banners'
import './feedback'
import './notifications'
import './admin'
import './booking'

// Setup Swagger documentation
export const setupSwaggerDocs = (app: express.Express) => {
  // This creates a route at /api-docs that serves the Swagger UI
  setupSwagger(app)

  // Add a redirect from root to Swagger docs
  app.get('/', (req, res) => {
    res.redirect('/api-docs')
  })
}
