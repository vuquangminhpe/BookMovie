import { checkSchema } from 'express-validator'
import { validate } from '../../utils/validation'

export const revenueStatsValidator = validate(
  checkSchema(
    {
      period: {
        optional: true,
        isIn: {
          options: [['day', 'week', 'month']],
          errorMessage: 'Period must be one of: day, week, month'
        }
      },
      start_date: {
        optional: true,
        isISO8601: {
          options: { strict: true },
          errorMessage: 'Start date must be in YYYY-MM-DD format'
        },
        custom: {
          options: (value, { req }) => {
            if (value && req?.query?.end_date) {
              const startDate = new Date(value)
              const endDate = new Date(req?.query?.end_date)
              if (startDate > endDate) {
                throw new Error('Start date must be before or equal to end date')
              }
            }
            return true
          }
        }
      },
      end_date: {
        optional: true,
        isISO8601: {
          options: { strict: true },
          errorMessage: 'End date must be in YYYY-MM-DD format'
        },
        custom: {
          options: (value, { req }) => {
            if (value && req?.query?.start_date) {
              const startDate = new Date(req?.query?.start_date)
              const endDate = new Date(value)
              if (endDate < startDate) {
                throw new Error('End date must be after or equal to start date')
              }
            }
            // Check if end date is not in the future
            const today = new Date()
            today.setHours(23, 59, 59, 999)
            const endDate = new Date(value)
            if (endDate > today) {
              throw new Error('End date cannot be in the future')
            }
            return true
          }
        }
      },
      page: {
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage: 'Page must be a positive integer'
        },
        toInt: true
      },
      limit: {
        optional: true,
        isInt: {
          options: { min: 1, max: 100 },
          errorMessage: 'Limit must be between 1 and 100'
        },
        toInt: true
      },
      sort_by: {
        optional: true,
        isIn: {
          options: [['date', 'revenue', 'bookings']],
          errorMessage: 'Sort by must be one of: date, revenue, bookings'
        }
      },
      sort_order: {
        optional: true,
        isIn: {
          options: [['asc', 'desc']],
          errorMessage: 'Sort order must be either asc or desc'
        }
      }
    },
    ['query']
  )
)
