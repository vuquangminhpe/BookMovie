/**
 * Test script để kiểm tra cấu hình email Nodemailer
 * 
 * Chạy script: npx ts-node src/utils/test-email.ts
 */

import { 
  sendEmail, 
  sendVerificationCode,
  sendPasswordResetLink,
  sendPaymentSuccessEmail,
  verifyEmailConnection 
} from './sendmail'

async function testEmailConfiguration() {
  console.log('🔍 Testing Email Configuration...\n')

  // Test 1: Verify connection
  console.log('Test 1: Verifying email server connection...')
  const connectionValid = await verifyEmailConnection()
  
  if (!connectionValid) {
    console.error('❌ Email connection failed. Please check your SMTP configuration in .env')
    console.log('\n📝 Required environment variables:')
    console.log('   - SMTP_HOST')
    console.log('   - SMTP_PORT')
    console.log('   - SMTP_SECURE')
    console.log('   - SMTP_USER')
    console.log('   - SMTP_PASS')
    console.log('   - MAIL_FROM')
    console.log('\nSee EMAIL_CONFIGURATION.md for detailed setup instructions.')
    process.exit(1)
  }
  
  console.log('✅ Email server connection verified!\n')

  // Get test email address from command line or use default
  const testEmail = process.argv[2] || process.env.SMTP_USER

  if (!testEmail) {
    console.error('❌ No test email provided.')
    console.log('Usage: npx ts-node src/utils/test-email.ts your-email@example.com')
    process.exit(1)
  }

  console.log(`📧 Sending test emails to: ${testEmail}\n`)

  // Test 2: Simple email
  console.log('Test 2: Sending simple email...')
  const simpleEmailResult = await sendEmail(
    testEmail,
    'Test Email - BookMovie Cinema',
    '<h1>Hello from BookMovie!</h1><p>This is a test email to verify your email configuration.</p>',
    'Hello from BookMovie! This is a test email to verify your email configuration.'
  )
  
  if (simpleEmailResult) {
    console.log('✅ Simple email sent successfully!\n')
  } else {
    console.error('❌ Failed to send simple email\n')
  }

  // Test 3: Verification code email
  console.log('Test 3: Sending verification code email...')
  const verificationResult = await sendVerificationCode(
    testEmail,
    '123456',
    process.env.CLIENT_URL,
    'sample-access-token'
  )
  
  if (verificationResult) {
    console.log('✅ Verification code email sent successfully!\n')
  } else {
    console.error('❌ Failed to send verification code email\n')
  }

  // Test 4: Password reset email
  console.log('Test 4: Sending password reset email...')
  const resetResult = await sendPasswordResetLink(
    testEmail,
    'sample-reset-token-123456'
  )
  
  if (resetResult) {
    console.log('✅ Password reset email sent successfully!\n')
  } else {
    console.error('❌ Failed to send password reset email\n')
  }

  // Test 5: Payment success email
  console.log('Test 5: Sending payment success email...')
  const paymentResult = await sendPaymentSuccessEmail(
    testEmail,
    {
      customerName: 'Test User',
      transactionId: 'TXN-12345678',
      paymentMethod: 'VNPay',
      amount: '250,000',
      paymentDate: new Date().toLocaleString('vi-VN'),
      movieTitle: 'Avengers: Endgame',
      theaterName: 'CGV Vincom Center',
      showDateTime: '20:00, 25/10/2025',
      seats: 'A1, A2, A3',
      ticketCode: 'TICKET-ABC123'
    }
  )
  
  if (paymentResult) {
    console.log('✅ Payment success email sent successfully!\n')
  } else {
    console.error('❌ Failed to send payment success email\n')
  }

  console.log('\n✨ Email testing completed!')
  console.log('📬 Please check your inbox (and spam folder) for the test emails.')
  
  process.exit(0)
}

// Run the test
testEmailConfiguration().catch((error) => {
  console.error('❌ Error during email testing:', error)
  process.exit(1)
})
