// src/utils/sendmail.ts
import { SESClient, SendEmailCommand, VerifyEmailIdentityCommand } from '@aws-sdk/client-ses'
import { config } from 'dotenv'
import { envConfig } from '../constants/config'
import databaseService from '../services/database.services'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '../constants/enums'

config()

// Initialize the SES client with AWS credentials
const sesClient = new SESClient({
  region: envConfig.region,
  credentials: {
    accessKeyId: envConfig.accessKeyId as string,
    secretAccessKey: envConfig.secretAccessKey as string
  }
})

// Check if AWS credentials are configured
if (!envConfig.accessKeyId || !envConfig.secretAccessKey) {
  console.error('❌ AWS credentials not configured. Please add accessKeyId and secretAccessKey to your .env file.')
}

// Create a random 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Basic email sending function using AWS SES
export const sendEmail = async (
  toAddress: string,
  subject: string,
  htmlBody: string,
  textBody: string = ''
): Promise<boolean> => {
  try {
    // If textBody is not provided, strip HTML tags from htmlBody
    const plainTextBody = textBody || htmlBody.replace(/<[^>]*>/g, '')

    // Configure email parameters
    const params = {
      Source: envConfig.fromAddress || 'no-reply@yourdomain.com',
      Destination: {
        ToAddresses: [toAddress]
      },
      Message: {
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

    // Send email
    const command = new SendEmailCommand(params)
    const response = await sesClient.send(command)

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

// Verify SES connection
export const verifySESConnection = async (): Promise<boolean> => {
  try {
    // We'll verify connection by checking if we can verify an email identity
    // This is a common SES operation that doesn't actually send an email
    const command = new VerifyEmailIdentityCommand({
      EmailAddress: envConfig.fromAddress || 'test@example.com'
    })

    await sesClient.send(command)
    console.log('✅ AWS SES connection successful')

    return true
  } catch (error) {
    // Check if error is due to invalid credentials
    if (error instanceof Error && error.name === 'CredentialsProviderError') {
      console.error('❌ Invalid AWS credentials. Please check your accessKeyId and secretAccessKey.')
      return false
    }

    console.error('❌ Error connecting to AWS SES:', error)
    return false
  }
}

// Verify connection when module is imported
verifySESConnection().catch((err) => {
  console.error('❌ Error verifying AWS SES connection:', err)
})
