import express from 'express'
import { setupSwagger } from './swagger-config'

// Setup Swagger documentation
export const setupSwaggerDocs = (app: express.Express) => {
  // This creates a route at /api-docs that serves the Swagger UI
  setupSwagger(app)

  // Add a redirect from root to Swagger docs
  app.get('/', (req, res) => {
    res.redirect('/api-docs')
  })
}
