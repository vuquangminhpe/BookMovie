import { Express } from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Ticket Booking API',
      version: '1.0.0',
      description: 'API documentation for Movie Ticket Booking System',
      contact: {
        name: 'API Support',
        email: 'support@api-movie.vercel.com'
      }
    },
    servers: [
      {
        url: 'https://api-movie.vercel.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Movie: {
          type: 'object',
          required: [
            'title',
            'description',
            'duration',
            'genre',
            'language',
            'release_date',
            'director',
            'cast',
            'poster_url'
          ],
          properties: {
            _id: {
              type: 'string',
              description: 'Movie ID'
            },
            title: {
              type: 'string',
              description: 'Movie title'
            },
            description: {
              type: 'string',
              description: 'Movie description'
            },
            duration: {
              type: 'integer',
              description: 'Movie duration in minutes'
            },
            genre: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Movie genres'
            },
            language: {
              type: 'string',
              description: 'Movie language'
            },
            release_date: {
              type: 'string',
              format: 'date',
              description: 'Movie release date'
            },
            director: {
              type: 'string',
              description: 'Movie director'
            },
            cast: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Movie cast'
            },
            poster_url: {
              type: 'string',
              description: 'URL to movie poster image'
            },
            trailer_url: {
              type: 'string',
              description: 'URL to movie trailer'
            },
            status: {
              type: 'string',
              enum: ['coming_soon', 'now_showing', 'ended'],
              description: 'Movie status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Theater: {
          type: 'object',
          required: ['name', 'location', 'address', 'city', 'state', 'pincode', 'screens'],
          properties: {
            _id: {
              type: 'string',
              description: 'Theater ID'
            },
            name: {
              type: 'string',
              description: 'Theater name'
            },
            location: {
              type: 'string',
              description: 'Theater location'
            },
            address: {
              type: 'string',
              description: 'Theater address'
            },
            city: {
              type: 'string',
              description: 'Theater city'
            },
            state: {
              type: 'string',
              description: 'Theater state'
            },
            pincode: {
              type: 'string',
              description: 'Theater pincode'
            },
            screens: {
              type: 'integer',
              description: 'Number of screens in the theater'
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Theater amenities'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              description: 'Theater status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Screen: {
          type: 'object',
          required: ['theater_id', 'name', 'seat_layout', 'capacity'],
          properties: {
            _id: {
              type: 'string',
              description: 'Screen ID'
            },
            theater_id: {
              type: 'string',
              description: 'Theater ID'
            },
            name: {
              type: 'string',
              description: 'Screen name'
            },
            seat_layout: {
              type: 'array',
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    row: {
                      type: 'string',
                      description: 'Seat row'
                    },
                    number: {
                      type: 'integer',
                      description: 'Seat number'
                    },
                    type: {
                      type: 'string',
                      enum: ['regular', 'premium', 'recliner', 'couple'],
                      description: 'Seat type'
                    },
                    status: {
                      type: 'string',
                      enum: ['active', 'inactive', 'maintenance'],
                      description: 'Seat status'
                    }
                  }
                }
              },
              description: 'Screen seat layout'
            },
            capacity: {
              type: 'integer',
              description: 'Screen capacity'
            },
            screen_type: {
              type: 'string',
              enum: ['standard', 'premium', 'imax', '3d', '4dx'],
              description: 'Screen type'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              description: 'Screen status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Showtime: {
          type: 'object',
          required: ['movie_id', 'screen_id', 'theater_id', 'start_time', 'end_time', 'price', 'available_seats'],
          properties: {
            _id: {
              type: 'string',
              description: 'Showtime ID'
            },
            movie_id: {
              type: 'string',
              description: 'Movie ID'
            },
            screen_id: {
              type: 'string',
              description: 'Screen ID'
            },
            theater_id: {
              type: 'string',
              description: 'Theater ID'
            },
            start_time: {
              type: 'string',
              format: 'date-time',
              description: 'Showtime start time'
            },
            end_time: {
              type: 'string',
              format: 'date-time',
              description: 'Showtime end time'
            },
            price: {
              type: 'object',
              properties: {
                regular: {
                  type: 'number',
                  description: 'Regular seat price'
                },
                premium: {
                  type: 'number',
                  description: 'Premium seat price'
                },
                recliner: {
                  type: 'number',
                  description: 'Recliner seat price'
                },
                couple: {
                  type: 'number',
                  description: 'Couple seat price'
                }
              },
              description: 'Ticket prices'
            },
            available_seats: {
              type: 'integer',
              description: 'Number of available seats'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'booking_open', 'booking_closed', 'cancelled', 'completed'],
              description: 'Showtime status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Booking: {
          type: 'object',
          required: ['user_id', 'showtime_id', 'seats'],
          properties: {
            _id: {
              type: 'string',
              description: 'Booking ID'
            },
            user_id: {
              type: 'string',
              description: 'User ID'
            },
            showtime_id: {
              type: 'string',
              description: 'Showtime ID'
            },
            movie_id: {
              type: 'string',
              description: 'Movie ID'
            },
            theater_id: {
              type: 'string',
              description: 'Theater ID'
            },
            screen_id: {
              type: 'string',
              description: 'Screen ID'
            },
            seats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row: {
                    type: 'string',
                    description: 'Seat row'
                  },
                  number: {
                    type: 'integer',
                    description: 'Seat number'
                  },
                  type: {
                    type: 'string',
                    enum: ['regular', 'premium', 'recliner', 'couple'],
                    description: 'Seat type'
                  },
                  price: {
                    type: 'number',
                    description: 'Seat price'
                  }
                }
              },
              description: 'Booked seats'
            },
            total_amount: {
              type: 'number',
              description: 'Total booking amount'
            },
            booking_time: {
              type: 'string',
              format: 'date-time',
              description: 'Booking time'
            },
            ticket_code: {
              type: 'string',
              description: 'Ticket code for verification'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled', 'completed'],
              description: 'Booking status'
            },
            payment_status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              description: 'Payment status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Payment: {
          type: 'object',
          required: ['booking_id', 'user_id', 'amount', 'payment_method'],
          properties: {
            _id: {
              type: 'string',
              description: 'Payment ID'
            },
            booking_id: {
              type: 'string',
              description: 'Booking ID'
            },
            user_id: {
              type: 'string',
              description: 'User ID'
            },
            amount: {
              type: 'number',
              description: 'Payment amount'
            },
            payment_method: {
              type: 'string',
              enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'cash'],
              description: 'Payment method'
            },
            transaction_id: {
              type: 'string',
              description: 'Transaction ID'
            },
            payment_time: {
              type: 'string',
              format: 'date-time',
              description: 'Payment time'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              description: 'Payment status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'admin'],
              description: 'User role'
            },
            verify: {
              type: 'integer',
              enum: [0, 1, 2],
              description: 'Verification status: 0=unverified, 1=verified, 2=banned'
            },
            avatar: {
              type: 'string',
              description: 'User avatar URL'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            errorInfo: {
              type: 'object',
              description: 'Error information details'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Unauthorized',
                errorInfo: {
                  name: 'JsonWebTokenError',
                  message: 'Invalid token'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Validation error',
                errors: {
                  title: {
                    msg: 'Title is required',
                    path: 'title',
                    location: 'body'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Resource not found'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Internal server error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {}
  },
  apis: ['./src/swagger/*.ts'] // paths to files containing OpenAPI specifications
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }))
}
