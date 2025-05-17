import { RegisterReqBody } from '../models/request/User.request'

interface PendingRegistration {
  data: RegisterReqBody
  code: string
  expiresAt: Date
}

class TempRegisterService {
  private pendingRegistrations: Map<string, PendingRegistration> = new Map()

  // Store registration data temporarily with email as key
  storePendingRegistration(email: string, data: RegisterReqBody, code: string): void {
    // Create expiration time (2 minutes from now)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000)

    this.pendingRegistrations.set(email, {
      data,
      code,
      expiresAt
    })
  }

  // Retrieve pending registration by email
  getPendingRegistration(email: string): PendingRegistration | undefined {
    return this.pendingRegistrations.get(email)
  }

  // Verify if the code is correct and not expired
  verifyCode(email: string, code: string): boolean {
    const registration = this.pendingRegistrations.get(email)
    
    if (!registration) {
      return false
    }

    // Check if code is expired
    if (new Date() > registration.expiresAt) {
      this.removePendingRegistration(email)
      return false
    }

    // Check if code matches
    return registration.code === code
  }

  // Get the stored registration data once verified
  getVerifiedRegistrationData(email: string): RegisterReqBody | null {
    const registration = this.pendingRegistrations.get(email)
    
    if (!registration) {
      return null
    }
    
    return registration.data
  }

  // Remove pending registration after successful processing or expiration
  removePendingRegistration(email: string): void {
    this.pendingRegistrations.delete(email)
  }

  // Check if registration is expired
  isRegistrationExpired(email: string): boolean {
    const registration = this.pendingRegistrations.get(email)
    
    if (!registration) {
      return true
    }
    
    return new Date() > registration.expiresAt
  }

  // Get expiration time remaining in seconds
  getExpirationTimeRemaining(email: string): number {
    const registration = this.pendingRegistrations.get(email)
    
    if (!registration) {
      return 0
    }
    
    const remainingTime = registration.expiresAt.getTime() - Date.now()
    return Math.max(0, Math.floor(remainingTime / 1000))
  }
  
  // Remove all expired registrations and return list of expired emails
  removeExpiredRegistrations(): string[] {
    const now = new Date()
    const expiredEmails: string[] = []
    
    // Check all registrations for expiration
    for (const [email, registration] of this.pendingRegistrations.entries()) {
      if (now > registration.expiresAt) {
        this.pendingRegistrations.delete(email)
        expiredEmails.push(email)
      }
    }
    
    return expiredEmails
  }
}

const tempRegisterService = new TempRegisterService()
export default tempRegisterService
