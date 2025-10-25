import nodemailer from 'nodemailer'
import { config } from 'dotenv'
import { envConfig } from '../constants/config'
import databaseService from '../services/database.services'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '../constants/enums'

config()

// Tạo transporter cho Nodemailer với cấu hình tối ưu
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,  // TLS
  auth: {
    user: envConfig.smtp_user,
    pass: envConfig.smtp_pass
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
})
// Thêm dòng này để debug
transporter.verify((error) => {
  if (error) {
    console.log('❌ SMTP Error:', error);
  } else {
    console.log('✅ Server is ready to send emails');
  }
});
if (!envConfig.smtp_user || !envConfig.smtp_pass) {
  console.error('❌ Email credentials not configured. Please add SMTP_USER and SMTP_PASS to your .env file.')
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

    // Configure email parameters for Nodemailer
    const mailOptions = {
      from: `"DANGIANVIETNAM" <${envConfig.fromAddress}>`,
      to: toAddress,
      subject: subject,
      text: plainTextBody,
      html: htmlBody
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return false
  }
}

// HTML template for verification code
const verificationCodeTemplate = `<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Xác thực Email</title>
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

      .verify-button {
        text-align: center;
        margin: 30px 0;
      }

      .verify-link {
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

      .verify-link:hover {
        background-color: #3d64d1;
      }

      .timer {
        text-align: center;
        color: #e74c3c;
        font-weight: bold;
        margin: 20px 0;
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
        <div class="logo">DANGIANVIETNAM</div>
        <h2>Xác thực Email</h2>
      </div>

      <div class="content">
        <h3 class="greeting">Xin chào {{name}},</h3>
        <p>Cảm ơn bạn đã đăng ký. Để hoàn tất đăng ký, vui lòng sử dụng mã xác thực bên dưới:</p>

        <div class="verification-code">{{code}}</div>

        <div class="verify-button">
          <a href="{{verifyLink}}" class="verify-link">Xác thực Email</a>
        </div>

        <div class="timer">Mã này sẽ hết hạn sau 2 phút.</div>

        <p>Ngoài ra, bạn có thể sao chép và dán mã xác thực vào ứng dụng thủ công.</p>

        <div class="fallback-link">
          <p>Nếu nút không hoạt động, hãy sao chép và dán liên kết này vào trình duyệt của bạn:</p>
          <p>{{verifyLink}}</p>
        </div>

        <p>Nếu bạn không yêu cầu xác thực này, vui lòng bỏ qua email này.</p>
      </div>

      <div class="footer">
        <p>© 2025 DANGIANVIETNAM. Đã đăng ký bản quyền.</p>
      </div>
    </div>
  </body>
</html>`

// Send verification code to user's email
export const sendVerificationCode = async (
  toAddress: string,
  code: string,
  clientUrl?: string,
  accessToken?: string
): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'Người dùng'
  const subject = 'Mã xác thực của bạn'

  // Tạo verification link với clientUrl và accessToken nếu có
  let verifyLink = '#'
  if (clientUrl && accessToken) {
    verifyLink = `${clientUrl}/verify-email?code=${code}&token=${accessToken}`
  } else if (clientUrl) {
    verifyLink = `${clientUrl}/verify-email?code=${code}`
  }

  const htmlBody = verificationCodeTemplate
    .replace('{{name}}', name)
    .replace('{{code}}', code)
    .replace(/{{verifyLink}}/g, verifyLink)

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
const passwordResetTemplate = `<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Đặt lại mật khẩu</title>
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
        <div class="logo">DANGIANVIETNAM</div>
        <h2>Đặt lại mật khẩu</h2>
      </div>

      <div class="content">
        <h3 class="greeting">Xin chào {{name}},</h3>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
        
        <div class="reset-button">
          <a href="{{resetLink}}" class="reset-link">Đặt lại mật khẩu</a>
        </div>
        
        <div class="timer">Liên kết này sẽ hết hạn sau 15 phút.</div>
        
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ nếu bạn có thắc mắc.</p>
        
        <div class="fallback-link">
          <p>Nếu nút không hoạt động, hãy sao chép và dán liên kết này vào trình duyệt của bạn:</p>
          <p>{{resetLink}}</p>
        </div>
      </div>

      <div class="footer">
        <p>© 2025 DANGIANVIETNAM. Đã đăng ký bản quyền.</p>
      </div>
    </div>
  </body>
</html>`

// Send password reset code
export const sendPasswordResetCode = async (toAddress: string, code: string): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'Người dùng'
  const subject = 'Mã đặt lại mật khẩu'

  const htmlBody = verificationCodeTemplate
    .replace('{{name}}', name)
    .replace('{{code}}', code)
    .replace('Xác thực Email', 'Đặt lại mật khẩu')
    .replace('Để hoàn tất đăng ký', 'Để đặt lại mật khẩu của bạn')

  return await sendEmail(toAddress, subject, htmlBody)
}

// Send password reset link
export const sendPasswordResetLink = async (toAddress: string, resetToken: string): Promise<boolean> => {
  const name = toAddress.split('@')[0]?.split('+')[0] || 'Người dùng'
  const subject = 'Đặt lại mật khẩu của bạn'

  // Tạo link reset password với token
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

  const htmlBody = passwordResetTemplate.replace(/{{name}}/g, name).replace(/{{resetLink}}/g, resetLink)

  return await sendEmail(toAddress, subject, htmlBody)
}

// HTML template for payment success email
const paymentSuccessTemplate = `<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thanh toán thành công</title>
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
        <div class="logo">DANGIANVIETNAM</div>
        <h2>Thanh toán thành công!</h2>
      </div>

      <div class="content">
        <div class="success-icon">✅</div>
        
        <h3 class="greeting">Kính gửi {{customerName}},</h3>
        <p>Thanh toán của bạn đã được xử lý thành công! Vé xem phim của bạn đã được xác nhận.</p>
        
        <div class="payment-details">
          <h4>Chi tiết thanh toán</h4>
          <div class="detail-row">
            <span class="detail-label">Mã giao dịch:</span>
            <span class="detail-value">{{transactionId}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phương thức thanh toán:</span>
            <span class="detail-value">{{paymentMethod}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Số tiền đã thanh toán:</span>
            <span class="detail-value amount">{{amount}} VND</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ngày thanh toán:</span>
            <span class="detail-value">{{paymentDate}}</span>
          </div>
        </div>

        <div class="movie-info">
          <h4>Chi tiết đặt vé</h4>
          <div class="detail-row">
            <span class="detail-label">Phim:</span>
            <span class="detail-value">{{movieTitle}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Rạp:</span>
            <span class="detail-value">{{theaterName}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ngày & Giờ chiếu:</span>
            <span class="detail-value">{{showDateTime}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ghế:</span>
            <span class="detail-value">{{seats}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mã vé:</span>
            <span class="detail-value">{{ticketCode}}</span>
          </div>
        </div>
        
        <p>Vé điện tử của bạn đã được gửi qua email. Vui lòng xuất trình mã vé hoặc mã QR tại rạp chiếu phim.</p>
        <p>Cảm ơn bạn đã chọn DANGIANVIETNAM!</p>
      </div>

      <div class="footer">
        <p>© 2025 DANGIANVIETNAM. Đã đăng ký bản quyền.</p>
      </div>
    </div>
  </body>
</html>`

// HTML template for payment failed email
const paymentFailedTemplate = `<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thanh toán thất bại</title>
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
        <div class="logo">DANGIANVIETNAM</div>
        <h2>Thanh toán thất bại</h2>
      </div>

      <div class="content">
        <div class="failed-icon">❌</div>
        
        <h3 class="greeting">Kính gửi {{customerName}},</h3>
        <p>Rất tiếc, thanh toán của bạn không thể được xử lý. Đặt vé của bạn hiện đang được giữ.</p>
        
        <div class="reason">
          <strong>Lý do:</strong> {{failureReason}}
        </div>

        <div class="payment-details">
          <h4>Chi tiết thanh toán</h4>
          <div class="detail-row">
            <span class="detail-label">Mã giao dịch:</span>
            <span class="detail-value">{{transactionId}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phương thức thanh toán:</span>
            <span class="detail-value">{{paymentMethod}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Số tiền:</span>
            <span class="detail-value amount">{{amount}} VND</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ngày thử thanh toán:</span>
            <span class="detail-value">{{attemptDate}}</span>
          </div>
        </div>

        <div class="retry-button">
          <a href="{{retryLink}}" class="retry-link">Thử thanh toán lại</a>
        </div>
        
        <p><strong>Bạn cần làm gì tiếp theo:</strong></p>
        <ul>
          <li>Kiểm tra thông tin thanh toán và thử lại</li>
          <li>Đảm bảo tài khoản của bạn có đủ số dư</li>
          <li>Liên hệ ngân hàng nếu vấn đề vẫn tiếp diễn</li>
          <li>Liên hệ đội ngũ hỗ trợ của chúng tôi để được trợ giúp</li>
        </ul>
        
        <p>Đặt vé của bạn sẽ được giữ trong 15 phút. Vui lòng hoàn tất thanh toán để xác nhận ghế của bạn.</p>
      </div>

      <div class="footer">
        <p>© 2025 DANGIANVIETNAM. Đã đăng ký bản quyền.</p>
        <p>Cần trợ giúp? Liên hệ đội ngũ hỗ trợ của chúng tôi tại support@bookmovie.com</p>
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
  const subject = 'Thanh toán thành công - Vé xem phim của bạn đã được xác nhận!'

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
  const subject = 'Thanh toán thất bại - Yêu cầu hành động'

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

// Verify Nodemailer connection
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    // Verify connection configuration với timeout
    const verifyPromise = transporter.verify()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection verification timeout')), 8000)
    )
    
    await Promise.race([verifyPromise, timeoutPromise])
    console.log('✅ Email server connection verified successfully')
    return true
  } catch (error) {
    console.error('❌ Error connecting to email server:', error)
    console.log('\n📋 Troubleshooting tips:')
    console.log('   1. Check if SMTP host and port are correct in .env')
    console.log(`      Current: ${envConfig.smtp_host}:${envConfig.smtp_port}`)
    console.log('   2. If using Gmail, make sure you have App Password (not regular password)')
    console.log('   3. Try different ports: 587 (TLS), 465 (SSL), or 2525')
    console.log('   4. Check if your hosting/firewall blocks SMTP ports')
    console.log('   5. For Render/Vercel/Railway, try using port 2525 or alternative SMTP service')
    console.log('\n💡 Alternative SMTP services that work well with cloud hosting:')
    console.log('   - SendGrid (smtp.sendgrid.net:587)')
    console.log('   - Mailgun (smtp.mailgun.org:587)')
    console.log('   - Brevo/Sendinblue (smtp-relay.brevo.com:587)')
    console.log('   - AWS SES (email-smtp.region.amazonaws.com:587)')
    console.log('\n⚠️  Email service is disabled. App will continue without email functionality.\n')
    return false
  }
}

// Verify connection when module is imported - không chặn app startup
verifyEmailConnection().catch((err) => {
  // Silent fail - app vẫn chạy được mà không có email
  console.error('⚠️  Email verification failed - continuing without email service')
})

