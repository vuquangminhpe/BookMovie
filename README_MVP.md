# BookMovie MVP - Complete Movie Booking Platform

## Overview

BookMovie MVP is a comprehensive movie booking platform that allows users to browse movies, select theaters, book tickets, and manage their cinema experience online. Built with modern technologies and designed for scalability.

## 🚀 Features

### Core Features (MVP Ready)
- ✅ **User Authentication** - Registration, login, JWT-based auth
- ✅ **Movie Catalog** - Browse movies with details, ratings, trailers
- ✅ **Theater Management** - Multiple locations, screens, seating layouts
- ✅ **Showtime Booking** - Real-time seat selection and availability
- ✅ **Payment Processing** - Secure payment gateway integration
- ✅ **Ticket Generation** - QR codes and digital tickets
- ✅ **Real-time Updates** - Socket.IO for live seat availability
- ✅ **Mobile Responsive** - Works on all devices

### Advanced Features
- ✅ **Staff Dashboard** - Theater management for staff users
- ✅ **Admin Panel** - System administration and analytics
- ✅ **Rating System** - User reviews and movie ratings
- ✅ **Loyalty Program** - Coupons and rewards system
- ✅ **Notifications** - Email and real-time notifications
- ✅ **Analytics** - Revenue tracking and user insights

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with native driver
- **Authentication**: JWT (Access + Refresh tokens)
- **Real-time**: Socket.IO
- **File Storage**: AWS S3 (configurable)
- **Email**: SendGrid/Mailjet
- **Caching**: Redis/Valkey
- **API Docs**: Swagger/OpenAPI

### Frontend (Optional)
- **Framework**: React.js with TypeScript
- **State Management**: Context API / Redux
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router

### DevOps
- **Containerization**: Docker & Docker Compose
- **Hosting**: Render.com (configured)
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Built-in health checks

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 6.0+ (optional but recommended)
- Docker & Docker Compose (for containerized setup)

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/vuquangminhpe/BookMovie.git
   cd BookMovie
   ```

2. **Start with Docker Compose**
   ```bash
   # Start all services (MongoDB, Redis, Backend)
   docker-compose -f docker-compose.mvp.yml up -d
   
   # View logs
   docker-compose -f docker-compose.mvp.yml logs -f backend
   ```

3. **Seed sample data**
   ```bash
   # Run inside backend container
   docker exec -it bookmovie-backend npm run seed:mvp
   ```

4. **Access the application**
   - API: http://localhost:5001
   - Health Check: http://localhost:5001/health
   - API Docs: http://localhost:5001/api-docs

### Option 2: Manual Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/vuquangminhpe/BookMovie.git
   cd BookMovie
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB and Redis** (if not using Docker)
   ```bash
   # MongoDB
   mongod --dbpath /path/to/your/db
   
   # Redis
   redis-server
   ```

4. **Build and start the application**
   ```bash
   npm run build
   npm run start:prod
   ```

5. **Seed sample data**
   ```bash
   npm run seed:mvp
   ```

## 📁 Project Structure

```
BookMovie/
├── src/
│   ├── controllers/         # Request handlers
│   ├── models/             # Data models and schemas
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic layer
│   ├── middlewares/        # Custom middleware
│   ├── utils/              # Helper functions
│   ├── scripts/            # Database seeding scripts
│   ├── constants/          # Application constants
│   └── index.ts            # Application entry point
├── docs/                   # Documentation
├── docker-compose.mvp.yml  # Docker setup for MVP
├── Dockerfile.mvp          # Container definition
├── MVP_GUIDE.md           # Comprehensive MVP guide
├── MVP_IMPLEMENTATION.md  # Implementation examples
└── FRONTEND_EXAMPLE.md    # Frontend implementation guide
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bookmovie_mvp
REDIS_URL=redis://localhost:6379

# Server
NODE_ENV=development
PORT=5001
HOST=localhost

# JWT Configuration
JWT_SECRET_ACCESS_TOKEN=your-access-token-secret
JWT_SECRET_REFRESH_TOKEN=your-refresh-token-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-key
MAILJET_API_KEY=your-mailjet-key
MAILJET_SECRET_KEY=your-mailjet-secret

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1

# Client Configuration
CLIENT_URL=http://localhost:3000
CLIENT_REDIRECT_CALLBACK=http://localhost:3000/auth/callback
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Refresh access token
```

### Movie Endpoints
```
GET  /api/movies           # Get all movies
GET  /api/movies/:id       # Get movie by ID
GET  /api/movies/:id/showtimes  # Get movie showtimes
```

### Booking Endpoints
```
POST /api/bookings         # Create new booking
GET  /api/bookings         # Get user's bookings
GET  /api/bookings/:id     # Get booking details
PUT  /api/bookings/:id/status  # Update booking status
```

### Theater Endpoints
```
GET  /api/theaters         # Get all theaters
GET  /api/theaters/:id     # Get theater details
GET  /api/theaters/:id/showtimes  # Get theater showtimes
```

For complete API documentation, visit: http://localhost:5001/api-docs

## 🧪 Testing

### Sample User Accounts (After seeding)
```
Admin:
  Email: admin@bookmovie.com
  Password: password123

Staff:
  Email: staff@bookmovie.com
  Password: password123

Customer:
  Email: customer@example.com
  Password: password123
```

### API Testing with curl

```bash
# Register a new user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get movies (authenticated)
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5001/api/movies

# Create booking
curl -X POST http://localhost:5001/api/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"showtime_id":"SHOWTIME_ID","seats":[{"row":"A","number":1}]}'
```

## 🚀 Deployment

### Deploy to Render.com

1. **Connect your GitHub repository** to Render
2. **Create a new Web Service** with these settings:
   - Build Command: `npm run build`
   - Start Command: `npm run start:prod`
   - Environment: Add all required environment variables

3. **Create a MongoDB Atlas database** (or use Render's PostgreSQL)
4. **Configure environment variables** in Render dashboard

### Deploy with Docker

```bash
# Build the image
docker build -f Dockerfile.mvp -t bookmovie-mvp .

# Run the container
docker run -d \
  --name bookmovie-mvp \
  -p 5001:5001 \
  --env-file .env \
  bookmovie-mvp
```

## 📊 Monitoring & Health Checks

The application includes comprehensive health monitoring:

- **Health Check Endpoint**: `GET /health`
- **Service Status**: Database, Redis, Socket.IO status
- **System Metrics**: Memory usage, uptime, environment info
- **Docker Health Checks**: Built-in container health monitoring

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** with bcrypt
- **Input Validation** with express-validator
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests
- **Helmet.js** for security headers
- **Environment Variable Protection**

## 🎯 Scaling Considerations

### Horizontal Scaling
- **Load Balancer** configuration ready
- **Stateless Architecture** with JWT tokens
- **Database Sharding** strategies planned
- **Microservices Migration** path defined

### Performance Optimization
- **Redis Caching** for frequently accessed data
- **Database Indexing** on critical queries
- **Image Optimization** with Sharp
- **Connection Pooling** for database connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the MVP guides for implementation details

## 🎉 Acknowledgments

- Express.js team for the robust framework
- MongoDB team for the flexible database
- Socket.IO team for real-time capabilities
- All contributors who helped build this platform

---

**BookMovie MVP** - Making movie booking simple and efficient! 🎬🎟️