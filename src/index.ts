import express from 'express'
import databaseService from './services/database.services'
import usersRouter from './routes/user.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { initFolderImage, initFolderVideo, initFolderVideoHls } from './utils/file'
import cors, { CorsOptions } from 'cors'
import { createServer } from 'http'
import helmet from 'helmet'
import { envConfig } from './constants/config'
import cinemaRouter from './routes/cinema.routes'
import { setupSwaggerDocs } from './Swagger/setupSwaggerDocs'

config()
databaseService
  .connect()
  .then(() => {
    databaseService.indexVideoStatus()
    databaseService.createCinemaIndexes()
  })
  .catch()

const app = express()
const httpServer = createServer(app)
const port = envConfig.port || 3002
app.use(helmet())
const corsOptions: CorsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

try {
  initFolderImage()
  initFolderVideo()
  initFolderVideoHls()
} catch (error) {
  // console.error('Error initializing directories:', error)
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
setupSwaggerDocs(app)

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/cinema', cinemaRouter)

app.use(defaultErrorHandler)

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`)
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`)
})

export default app
