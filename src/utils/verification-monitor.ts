import { Server as SocketServer } from 'socket.io'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'
import { UserVerifyStatus } from '../constants/enums'
import tempRegisterService from '../services/temp-register.services'

// Global interval reference
let verificationMonitorInterval: NodeJS.Timeout | null = null

/**
 * Initializes the verification code monitoring system.
 * This runs on the server-side only to check for expired verification codes.
 * @param io Socket.io server instance
 */
export const initVerificationCodeMonitor = (io: SocketServer): void => {
  console.log('Starting server-side verification code monitor')
  
  // Stop any existing monitor before starting a new one
  if (verificationMonitorInterval) {
    clearInterval(verificationMonitorInterval)
  }

  // Monitor runs every 30 seconds to check for expired codes
  verificationMonitorInterval = setInterval(async () => {
    try {
      await checkExpiredDatabaseCodes()
      await checkExpiredTempRegistrations()
      console.log('Verification code check completed')
    } catch (error) {
      console.error('Error in verification code monitor:', error)
    }
  }, 30 * 1000) // 30 seconds
  
  // Clean up on server shutdown
  process.on('SIGINT', stopVerificationMonitor)
  process.on('SIGTERM', stopVerificationMonitor)
}

/**
 * Stops the verification code monitor
 */
export const stopVerificationMonitor = (): void => {
  if (verificationMonitorInterval) {
    clearInterval(verificationMonitorInterval)
    verificationMonitorInterval = null
    console.log('Verification code monitor stopped')
  }
}

/**
 * Checks database for users with expired verification codes
 */
async function checkExpiredDatabaseCodes(): Promise<void> {
  const now = new Date()
  
  // Find users with expired verification codes
  const expiredUsers = await databaseService.users.find({
    verify: UserVerifyStatus.Unverified,
    verify_code_expires_at: { $lt: now },
    email_verify_code: { $ne: '' }
  }).toArray()
  
  if (expiredUsers.length > 0) {
    console.log(`Found ${expiredUsers.length} users with expired verification codes in database`)
    
    // Update each user to clear the expired code
    for (const user of expiredUsers) {
      await databaseService.users.updateOne(
        { _id: user._id },
        {
          $set: {
            email_verify_code: '',
            verify_code_expires_at: null
          }
        }
      )
      console.log(`Cleared expired verification code for user ${user._id}`)
    }
  }
}

/**
 * Checks temporary registration storage for expired verification codes
 */
async function checkExpiredTempRegistrations(): Promise<void> {
  const expiredEmails = tempRegisterService.removeExpiredRegistrations()
  
  if (expiredEmails.length > 0) {
    console.log(`Removed ${expiredEmails.length} expired temporary registrations`)
    expiredEmails.forEach(email => {
      console.log(`Registration expired for email: ${email}`)
    })
  }
}
