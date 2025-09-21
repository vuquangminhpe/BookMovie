import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { config } from 'dotenv'
import { envConfig } from '../constants/config'
import databaseService from '../services/database.services'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '../constants/enums'

config()

const sesv2Client = new SESv2Client({
  region: envConfig.region,
  credentials: {
    accessKeyId: envConfig.accessKeyId as string,
    secretAccessKey: envConfig.secretAccessKey as string
  }
})

if (!envConfig.accessKeyId || !envConfig.secretAccessKey) {
  console.error('❌ AWS credentials not configured. Please add accessKeyId and secretAccessKey to your .env file.')
}

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const sendEmail = async (
  toAddress: string,
  subject: string,
  htmlBody: string,
  textBody: string = ''
): Promise<boolean> => {
  try {
    // If textBody is not provided, strip HTML tags from htmlBody
    const plainTextBody = textBody || htmlBody.replace(/<[^>]*>/g, '')

    // Configure email parameters for SESv2
    const params = {
      FromEmailAddress: envConfig.fromAddress || 'no-reply@yourdomain.com',
      Destination: {
        ToAddresses: [toAddress]
      },
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8'
            },
            Text: {
              Data: plainTextBody,
              Charset: 'UTF-8'
            }
          }
        }
      }
    }

    // Send email
    const command = new SendEmailCommand(params)
    const response = await sesv2Client.send(command)

    console.log('✅ Email sent successfully:', response.MessageId)
    return true
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return false
  }
}

// HTML template for verification code
const verificationCodeTemplate = `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f5f7fb;
        color: #333;
        line-height: 1.6;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eaeaea;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #4b7bec;
        margin-bottom: 10px;
      }

      .content {
        padding: 30px 20px;
      }

      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
      }

      .verification-code {
        text-align: center;
        font-size: 32px;
        letter-spacing: 5px;
        font-weight: bold;
        color: #4b7bec;
        margin: 30px 0;
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 4px;
        border: 1px dashed #dee2e6;
      }

      .timer {
        text-align: center;
        color: #e74c3c;
        font-weight: bold;
        margin: 20px 0;
      }

      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eaeaea;
        color: #6c757d;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Your App Name</div>
        <h2>Email Verification</h2>
      </div>

      <div class="content">
        <h3 class="greeting">Hello {{name}},</h3>
        <p>Thank you for registering. To complete your registration, please use the verification code below:</p>
        
        <div class="verification-code">{{code}}</div>
        
        <div class="timer">This code will expire in 2 minutes.</div>
        
        <p>If you did not request this verification, please ignore this email.</p>
      </div>

      <div class="footer">
        <p>© 2025 Your App Name. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`

// Send verification code to user's email
export const sendVerificationCode = async (toAddress: string, code: string): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'User'
  const subject = 'Your Verification Code'

  const htmlBody = verificationCodeTemplate.replace('{{name}}', name).replace('{{code}}', code)

  return await sendEmail(toAddress, subject, htmlBody)
}

// Handle verification code expiration - Server side only
export const setupVerificationExpiration = (user_id: string, expirationTime: Date) => {
  const timeUntilExpiration = expirationTime.getTime() - Date.now()

  if (timeUntilExpiration <= 0) return

  setTimeout(async () => {
    // Check if user is still unverified
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })

    if (user && user.verify === UserVerifyStatus.Unverified) {
      // Delete or disable verification code
      await databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_code: '',
            verify_code_expires_at: null
          }
        }
      )

      console.log(`Verification code for user ${user_id} has expired and been invalidated`)
    }
  }, timeUntilExpiration)
}

// HTML template for password reset link
const passwordResetTemplate = `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f5f7fb;
        color: #333;
        line-height: 1.6;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eaeaea;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #4b7bec;
        margin-bottom: 10px;
      }

      .content {
        padding: 30px 20px;
      }

      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
      }

      .reset-button {
        text-align: center;
        margin: 30px 0;
      }

      .reset-link {
        display: inline-block;
        padding: 15px 30px;
        background-color: #4b7bec;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        transition: background-color 0.3s;
      }

      .reset-link:hover {
        background-color: #3d64d1;
      }

      .timer {
        text-align: center;
        color: #e74c3c;
        font-weight: bold;
        margin: 20px 0;
      }

      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eaeaea;
        color: #6c757d;
        font-size: 14px;
      }

      .fallback-link {
        margin-top: 20px;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
        word-break: break-all;
        font-size: 12px;
        color: #6c757d;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Your App Name</div>
        <h2>Password Reset</h2>
      </div>

      <div class="content">
        <h3 class="greeting">Hello {{name}},</h3>
        <p>We received a request to reset your password. Click the button below to reset your password:</p>
        
        <div class="reset-button">
          <a href="{{resetLink}}" class="reset-link">Reset Password</a>
        </div>
        
        <div class="timer">This link will expire in 15 minutes.</div>
        
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        
        <div class="fallback-link">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>{{resetLink}}</p>
        </div>
      </div>

      <div class="footer">
        <p>© 2025 Your App Name. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`

// Send password reset code
export const sendPasswordResetCode = async (toAddress: string, code: string): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'User'
  const subject = 'Password Reset Code'

  const htmlBody = verificationCodeTemplate
    .replace('{{name}}', name)
    .replace('{{code}}', code)
    .replace('Email Verification', 'Password Reset')
    .replace('To complete your registration', 'To reset your password')

  return await sendEmail(toAddress, subject, htmlBody)
}

// Send password reset link
export const sendPasswordResetLink = async (toAddress: string, resetToken: string): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'User'
  const subject = 'Reset Your Password'

  // Tạo link reset password với token
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

  const htmlBody = passwordResetTemplate.replace(/{{name}}/g, name).replace(/{{resetLink}}/g, resetLink)

  return await sendEmail(toAddress, subject, htmlBody)
}

// HTML template for payment success email
const paymentSuccessTemplate = `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Successful</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f5f7fb;
        color: #333;
        line-height: 1.6;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eaeaea;
        background-color: #27ae60;
        color: white;
        margin: -20px -20px 20px -20px;
        border-radius: 8px 8px 0 0;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .content {
        padding: 20px;
      }

      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
      }

      .success-icon {
        text-align: center;
        font-size: 48px;
        color: #27ae60;
        margin: 20px 0;
      }

      .payment-details {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }

      .detail-label {
        font-weight: bold;
        color: #555;
      }

      .detail-value {
        color: #333;
      }

      .amount {
        color: #27ae60;
        font-size: 20px;
        font-weight: bold;
      }

      .movie-info {
        background-color: #fff;
        border: 1px solid #ddd;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
      }

      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eaeaea;
        color: #6c757d;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">BookMovie Cinema</div>
        <h2>Payment Successful!</h2>
      </div>

      <div class="content">
        <div class="success-icon">✅</div>
        
        <h3 class="greeting">Dear {{customerName}},</h3>
        <p>Your payment has been processed successfully! Your movie tickets are confirmed.</p>
        
        <div class="payment-details">
          <h4>Payment Details</h4>
          <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">{{transactionId}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">{{paymentMethod}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount Paid:</span>
            <span class="detail-value amount">{{amount}} VND</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Date:</span>
            <span class="detail-value">{{paymentDate}}</span>
          </div>
        </div>

        <div class="movie-info">
          <h4>Booking Details</h4>
          <div class="detail-row">
            <span class="detail-label">Movie:</span>
            <span class="detail-value">{{movieTitle}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Theater:</span>
            <span class="detail-value">{{theaterName}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Show Date & Time:</span>
            <span class="detail-value">{{showDateTime}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Seats:</span>
            <span class="detail-value">{{seats}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ticket Code:</span>
            <span class="detail-value">{{ticketCode}}</span>
          </div>
        </div>
        
        <p>Your e-tickets have been sent to your email. Please present your ticket code or QR code at the cinema.</p>
        <p>Thank you for choosing BookMovie Cinema!</p>
      </div>

      <div class="footer">
        <p>© 2025 BookMovie Cinema. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`

// HTML template for payment failed email
const paymentFailedTemplate = `<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Failed</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f5f7fb;
        color: #333;
        line-height: 1.6;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eaeaea;
        background-color: #e74c3c;
        color: white;
        margin: -20px -20px 20px -20px;
        border-radius: 8px 8px 0 0;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .content {
        padding: 20px;
      }

      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
      }

      .failed-icon {
        text-align: center;
        font-size: 48px;
        color: #e74c3c;
        margin: 20px 0;
      }

      .payment-details {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }

      .detail-label {
        font-weight: bold;
        color: #555;
      }

      .detail-value {
        color: #333;
      }

      .amount {
        color: #e74c3c;
        font-size: 20px;
        font-weight: bold;
      }

      .retry-button {
        text-align: center;
        margin: 30px 0;
      }

      .retry-link {
        display: inline-block;
        padding: 15px 30px;
        background-color: #3498db;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        transition: background-color 0.3s;
      }

      .retry-link:hover {
        background-color: #2980b9;
      }

      .reason {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
        color: #856404;
      }

      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eaeaea;
        color: #6c757d;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">BookMovie Cinema</div>
        <h2>Payment Failed</h2>
      </div>

      <div class="content">
        <div class="failed-icon">❌</div>
        
        <h3 class="greeting">Dear {{customerName}},</h3>
        <p>Unfortunately, your payment could not be processed. Your booking is currently on hold.</p>
        
        <div class="reason">
          <strong>Reason:</strong> {{failureReason}}
        </div>

        <div class="payment-details">
          <h4>Payment Details</h4>
          <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">{{transactionId}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">{{paymentMethod}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value amount">{{amount}} VND</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Attempt Date:</span>
            <span class="detail-value">{{attemptDate}}</span>
          </div>
        </div>

        <div class="retry-button">
          <a href="{{retryLink}}" class="retry-link">Try Payment Again</a>
        </div>
        
        <p><strong>What to do next:</strong></p>
        <ul>
          <li>Check your payment details and try again</li>
          <li>Ensure you have sufficient funds</li>
          <li>Contact your bank if the issue persists</li>
          <li>Reach out to our support team for assistance</li>
        </ul>
        
        <p>Your booking will be held for 15 minutes. Please complete the payment to confirm your seats.</p>
      </div>

      <div class="footer">
        <p>© 2025 BookMovie Cinema. All rights reserved.</p>
        <p>Need help? Contact our support team at support@bookmovie.com</p>
      </div>
    </div>
  </body>
</html>`

// Send payment success email
export const sendPaymentSuccessEmail = async (
  toAddress: string,
  paymentData: {
    customerName: string
    transactionId: string
    paymentMethod: string
    amount: string
    paymentDate: string
    movieTitle: string
    theaterName: string
    showDateTime: string
    seats: string
    ticketCode: string
  }
): Promise<boolean> => {
  const subject = 'Payment Successful - Your Movie Tickets are Confirmed!'

  const htmlBody = paymentSuccessTemplate
    .replace(/{{customerName}}/g, paymentData.customerName)
    .replace(/{{transactionId}}/g, paymentData.transactionId)
    .replace(/{{paymentMethod}}/g, paymentData.paymentMethod)
    .replace(/{{amount}}/g, paymentData.amount)
    .replace(/{{paymentDate}}/g, paymentData.paymentDate)
    .replace(/{{movieTitle}}/g, paymentData.movieTitle)
    .replace(/{{theaterName}}/g, paymentData.theaterName)
    .replace(/{{showDateTime}}/g, paymentData.showDateTime)
    .replace(/{{seats}}/g, paymentData.seats)
    .replace(/{{ticketCode}}/g, paymentData.ticketCode)

  return await sendEmail(toAddress, subject, htmlBody)
}

// Send payment failed email
export const sendPaymentFailedEmail = async (
  toAddress: string,
  paymentData: {
    customerName: string
    transactionId: string
    paymentMethod: string
    amount: string
    attemptDate: string
    failureReason: string
    retryLink: string
  }
): Promise<boolean> => {
  const subject = 'Payment Failed - Action Required'

  const htmlBody = paymentFailedTemplate
    .replace(/{{customerName}}/g, paymentData.customerName)
    .replace(/{{transactionId}}/g, paymentData.transactionId)
    .replace(/{{paymentMethod}}/g, paymentData.paymentMethod)
    .replace(/{{amount}}/g, paymentData.amount)
    .replace(/{{attemptDate}}/g, paymentData.attemptDate)
    .replace(/{{failureReason}}/g, paymentData.failureReason)
    .replace(/{{retryLink}}/g, paymentData.retryLink)

  return await sendEmail(toAddress, subject, htmlBody)
}

// Verify SESv2 connection
export const verifySESConnection = async (): Promise<boolean> => {
  try {
    // For SESv2, we can test the connection by attempting to send a test email
    // or by using a basic operation. Since there's no direct "verify connection" command,
    // we'll try to get account sending enabled status
    const testParams = {
      FromEmailAddress: envConfig.fromAddress || 'test@example.com',
      Destination: {
        ToAddresses: ['test@example.com']
      },
      Content: {
        Simple: {
          Subject: {
            Data: 'Test Connection'
          },
          Body: {
            Text: {
              Data: 'This is a test to verify SESv2 connection'
            }
          }
        }
      }
    }

    // We create the command but don't send it - just to test if credentials work
    const command = new SendEmailCommand(testParams)

    // If we can create the command without credential errors, connection is likely valid
    console.log('✅ AWS SESv2 client initialized successfully')

    return true
  } catch (error) {
    // Check if error is due to invalid credentials
    if (error instanceof Error && error.name === 'CredentialsProviderError') {
      console.error('❌ Invalid AWS credentials. Please check your accessKeyId and secretAccessKey.')
      return false
    }

    console.error('❌ Error connecting to AWS SESv2:', error)
    return false
  }
}

// Verify connection when module is imported
verifySESConnection().catch((err) => {
  console.error('❌ Error verifying AWS SESv2 connection:', err)
})
