# Hướng dẫn cấu hình Email với Nodemailer

## Các biến môi trường cần thiết

Thêm các biến sau vào file `.env` của bạn:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=noreply@bookmovie.com
```

## Hướng dẫn cấu hình theo từng nhà cung cấp

### 1. Gmail (Khuyên dùng cho testing)

#### Bước 1: Bật xác thực 2 bước
1. Truy cập https://myaccount.google.com/security
2. Bật "2-Step Verification"

#### Bước 2: Tạo App Password
1. Truy cập https://myaccount.google.com/apppasswords
2. Chọn "Mail" và "Other" (đặt tên: BookMovie)
3. Nhấn "Generate"
4. Copy mật khẩu 16 ký tự

#### Bước 3: Cấu hình .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM=your-gmail@gmail.com
```

### 2. Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
MAIL_FROM=your-email@outlook.com
```

### 3. Yahoo Mail

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@yahoo.com
```

### 4. SendGrid (Khuyên dùng cho production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
MAIL_FROM=verified-sender@yourdomain.com
```

### 5. Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
MAIL_FROM=noreply@yourdomain.com
```

### 6. SMTP.com

```env
SMTP_HOST=smtp.smtp.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
MAIL_FROM=noreply@yourdomain.com
```

### 7. Elastic Email

```env
SMTP_HOST=smtp.elasticemail.com
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-api-key
MAIL_FROM=noreply@yourdomain.com
```

## Lưu ý quan trọng

### Port và Secure
- **Port 587**: Dùng STARTTLS → `SMTP_SECURE=false`
- **Port 465**: Dùng SSL/TLS trực tiếp → `SMTP_SECURE=true`
- **Port 25**: Port cũ, không khuyên dùng

### Gmail - Lưu ý đặc biệt
1. **Không dùng mật khẩu thường** - Gmail sẽ chặn
2. **Phải dùng App Password** (xem hướng dẫn trên)
3. **Giới hạn**: 500 email/ngày cho tài khoản free
4. **Không khuyên dùng cho production** - Dùng SendGrid, Mailgun thay thế

### Testing
Sau khi cấu hình, chạy code để test:
```bash
npm run dev
```



## Troubleshooting

### Lỗi: "Invalid login"
- Kiểm tra username/password
- Gmail: Phải dùng App Password
- Outlook: Có thể cần bật "Less secure app access"

### Lỗi: "Connection timeout"
- Kiểm tra SMTP_HOST và SMTP_PORT
- Firewall có thể đang chặn port 587/465

### Lỗi: "Self signed certificate"
- Thêm option: `tls: { rejectUnauthorized: false }` (chỉ dùng cho dev)

### Lỗi: "Greeting never received"
- Thử đổi port (587 → 465 hoặc ngược lại)
- Đổi SMTP_SECURE (true ↔ false)

## Khuyến nghị cho Production

1. **Không dùng Gmail** - Giới hạn 500 email/ngày
2. **Dùng dịch vụ chuyên nghiệp**:
   - **SendGrid**: 100 email/ngày miễn phí
   - **Mailgun**: 5,000 email/tháng miễn phí (3 tháng đầu)
   - **Amazon SES**: Rất rẻ, $0.10/1000 email
3. **Verify domain** để tránh email vào spam
4. **Setup SPF, DKIM, DMARC records**

## Code Example - Test gửi email

```typescript
import { sendEmail } from './utils/sendmail'

// Test gửi email đơn giản
await sendEmail(
  'recipient@example.com',
  'Test Email',
  '<h1>Hello from BookMovie!</h1><p>This is a test email.</p>',
  'Hello from BookMovie! This is a test email.'
)
```

## Các chức năng có sẵn

1. **sendEmail()** - Gửi email tùy chỉnh
2. **sendVerificationCode()** - Gửi mã xác thực đăng ký
3. **sendPasswordResetLink()** - Gửi link reset mật khẩu
4. **sendPaymentSuccessEmail()** - Gửi email xác nhận thanh toán
5. **sendPaymentFailedEmail()** - Gửi email thất bại thanh toán
6. **verifyEmailConnection()** - Kiểm tra kết nối email server

## Support

Nếu gặp vấn đề, hãy kiểm tra:
1. Console logs khi start server
2. File .env có đúng format không
3. Thử gửi email test
4. Kiểm tra spam folder của người nhận
