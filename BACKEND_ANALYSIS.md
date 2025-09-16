# BookMovie Backend Analysis

## Tech Stack Analysis

### Backend
- **Runtime**: Node.js 18+ with TypeScript 5.6+
- **Framework**: Express.js 4.21+ with TypeScript support
- **Database**: MongoDB 6.9+ with native MongoDB driver (no ORM/ODM)
- **Real-time Communication**: Socket.IO 4.8+ for live updates and notifications
- **Caching**: Redis 4.7+ / Valkey for session management and caching
- **File Storage**: AWS S3 integration with @aws-sdk/client-s3 for media assets
- **Email Services**: Multiple providers - SendGrid, Mailjet, Nodemailer with SMTP support
- **Payment Processing**: VNPay integration for Vietnamese market
- **Media Processing**: FFmpeg integration for video processing and YouTube download capabilities
- **Security**: Helmet.js, CORS, express-rate-limit for API protection
- **API Documentation**: Swagger UI Express with comprehensive endpoint documentation

### Authentication
- **Method**: JWT-based authentication with access/refresh token pattern
- **Token Management**: Separate JWT secrets for access tokens, refresh tokens, email verification, and password reset
- **User Roles**: Customer, Staff, Admin, Concierge with role-based access control (RBAC)
- **Email Verification**: 6-digit verification codes with expiration and monitoring
- **Password Security**: Crypto-based hashing with configurable secrets

### Real-time
- **Socket.IO Features**:
  - Live showtime status updates and cleanup notifications
  - Real-time booking and payment status updates
  - Coupon assignment and usage notifications
  - Administrative cleanup operations
  - User-specific and role-based room management
  - Theater-specific event broadcasting

### File Storage
- **AWS S3 Integration**: Complete S3 lifecycle management
  - Multipart upload support for large files (5MB+ chunks)
  - Automatic content-type detection
  - File deletion and folder cleanup capabilities
  - Image processing with Sharp library
  - Video processing and HLS streaming support

### Deployment
- **Platform**: Optimized for Render.com with fallback support
- **Containerization**: Docker support with multi-stage builds
- **Environment**: Configurable environment-based settings (.env files)
- **Health Monitoring**: Built-in health checks and service status endpoints
- **Memory Management**: Memory usage monitoring with alerts (512MB limit optimization)
- **Graceful Shutdown**: Proper cleanup of services, connections, and background jobs

### Monitoring
- **Health Checks**: Comprehensive health endpoint with service status
- **Memory Monitoring**: Real-time memory usage tracking for cloud deployment
- **Service Status**: Database, Socket.IO, cleanup services monitoring
- **Background Jobs**: Scheduled cleanup and maintenance tasks with monitoring
- **Error Handling**: Centralized error handling with detailed logging

### Additional Tech Stack Details
- **Cron Jobs**: node-cron for scheduled tasks (showtime cleanup, booking expiration)
- **Validation**: express-validator with custom validation chains
- **Date/Time**: Moment.js and Day.js for date manipulation
- **Image Processing**: Sharp for image optimization and resizing
- **QR Code**: QR code generation for booking confirmations
- **Crypto**: Built-in crypto for secure operations and token generation
- **Rate Limiting**: Express-rate-limit for API protection
- **File Upload**: Formidable for multipart form handling

## Key Features Documented

### MVP Core Features

- **JWT-based User Authentication**: Complete authentication system with role-based access control (Customer, Staff, Admin, Concierge), email verification with 6-digit codes, password reset functionality, and refresh token rotation
- **Movie Management System**: Full CRUD operations for movies with status tracking (coming_soon, now_showing, ended), cast and crew information, ratings and reviews, featured movie management, and trailer/poster media handling
- **Theater & Screen Management**: Multi-theater support with screen configuration, seat mapping (Standard, VIP, Premium), amenities tracking, and theater status management (active, inactive, maintenance)
- **Showtime Scheduling**: Automated showtime management with status tracking (scheduled, ongoing, completed), seat availability updates, and automatic cleanup of expired showtimes
- **Booking System**: Complete booking workflow with seat selection, temporary seat locking (15-minute expiration), booking status tracking (pending, confirmed, cancelled, completed), and ticket code generation
- **Payment Integration**: VNPay payment gateway integration with payment status tracking, automatic payment expiration (15 minutes), booking-payment status synchronization, and refund handling
- **Media Upload & Processing**: AWS S3 integration for file storage, image processing and optimization, video upload with processing capabilities, and automatic media cleanup
- **Email Notification System**: Multi-provider email support (SendGrid, Mailjet, SMTP), booking confirmations, payment notifications, and verification code delivery

### Advanced Features

- **Real-time Communication Hub**: Socket.IO implementation with user-specific rooms, role-based broadcasting, live showtime updates, payment status notifications, administrative real-time monitoring, and coupon assignment notifications
- **Automated Cleanup Services**: Scheduled background jobs for expired showtime cleanup, booking expiration handling, payment timeout management, seat lock releases, and database maintenance tasks
- **Coupon & Discount System**: Dynamic coupon assignment based on booking amounts, usage tracking and analytics, real-time coupon availability updates, and automated coupon expiration management
- **Advanced Booking Analytics**: Revenue statistics by theater and time period, booking pattern analysis, user behavior tracking, seat utilization reports, and performance metrics dashboard
- **Multi-role Staff Management**: Theater-specific staff assignments, role-based permission system, staff activity tracking, theater analytics for managers, and administrative oversight capabilities
- **Partner Integration System**: Partner movie management, revenue sharing calculations, contract management, and partner-specific analytics
- **Comprehensive Rating & Feedback**: Movie rating system with analytics, user feedback collection, sentiment analysis preparation, and review moderation capabilities
- **Admin Panel with Analytics**: Complete administrative dashboard, system health monitoring, manual cleanup triggers, user management, theater performance analytics, revenue reports, and system configuration management
- **Notification Management**: Targeted user notifications, promotional message broadcasting, system alerts, booking reminders, and notification history tracking
- **Banner & Content Management**: Dynamic banner management for promotions, content scheduling, and marketing campaign support

### Technical Architecture Highlights

- **Database Design**: Well-structured MongoDB collections with proper indexing, data relationships using ObjectIds, and optimized queries for performance
- **Service Layer Architecture**: Modular service design with clear separation of concerns, reusable business logic components, and proper error handling throughout
- **Background Job Management**: Robust cron job system with job monitoring, automatic recovery mechanisms, and graceful shutdown handling
- **Security Implementation**: Multi-layer security with JWT tokens, input validation, rate limiting, CORS configuration, and environment-based secrets management
- **Scalability Considerations**: Stateless design for horizontal scaling, efficient database queries, proper connection pooling, and memory optimization for cloud deployment
- **Error Handling & Logging**: Centralized error handling, comprehensive logging system, and detailed error reporting for debugging and monitoring

### Integration Points

- **Payment Gateway**: Full VNPay integration with webhook handling, payment verification, and automatic status updates
- **Cloud Storage**: Complete AWS S3 integration with lifecycle management, CDN-ready file serving, and automatic cleanup
- **Email Services**: Multi-provider email system with failover capabilities and delivery tracking
- **Real-time Updates**: Socket.IO implementation with room management, event broadcasting, and connection handling
- **Media Processing**: FFmpeg integration for video processing, thumbnail generation, and streaming preparation

This comprehensive backend system provides a solid foundation for a movie booking platform with extensive features for scalability, real-time operations, and multi-role management. The architecture supports both MVP functionality and advanced enterprise features, making it suitable for expansion with additional business requirements, integrations, and performance optimizations.