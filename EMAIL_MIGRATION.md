# Email System Migration: AWS SES → Nodemailer

## 📋 Tổng quan thay đổi

Code đã được chuyển đổi từ **AWS SES v2** sang **Nodemailer** để:
- ✅ Dễ dàng cấu hình và sử dụng hơn
- ✅ Hỗ trợ nhiều nhà cung cấp email (Gmail, Outlook, SendGrid, Mailgun, etc.)
- ✅ Không cần AWS account
- ✅ Miễn phí cho testing (Gmail)
- ✅ Chi phí thấp hơn cho production

## 📝 Files đã thay đổi

### 1. `/src/utils/sendmail.ts`
- ❌ Xóa: AWS SES v2 client và các import
- ✅ Thêm: Nodemailer transporter
- ✅ Cập nhật: Tất cả các hàm gửi email
- ✅ Thay đổi: `verifySESConnection()` → `verifyEmailConnection()`

### 2. Files mới tạo

#### `/EMAIL_CONFIGURATION.md`
Hướng dẫn chi tiết:
- Cấu hình từng nhà cung cấp email
- Troubleshooting
- Best practices cho production

#### `/.env.example`
Template file cấu hình môi trường với:
- Tất cả biến cần thiết
- Ví dụ cho nhiều nhà cung cấp email
- Comments hướng dẫn

#### `/src/utils/test-email.ts`
Script test gửi email:
- Kiểm tra kết nối
- Test 5 loại email khác nhau
- Dễ dàng debug

## 🚀 Hướng dẫn sử dụng nhanh

### Bước 1: Cấu hình biến môi trường

Thêm vào file `.env`:

```env
# Cho Gmail (Testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=noreply@bookmovie.com
```

**⚠️ Quan trọng với Gmail:**
1. Bật "2-Step Verification" tại https://myaccount.google.com/security
2. Tạo "App Password" tại https://myaccount.google.com/apppasswords
3. Dùng App Password (16 ký tự) cho `SMTP_PASS`

### Bước 2: Test cấu hình

```bash
npx ts-node src/utils/test-email.ts your-email@example.com
```

### Bước 3: Sử dụng trong code

Tất cả các hàm hiện có vẫn hoạt động như cũ:

```typescript
import { sendEmail, sendVerificationCode } from './utils/sendmail'

// Gửi email tùy chỉnh
await sendEmail(
  'user@example.com',
  'Welcome!',
  '<h1>Welcome to BookMovie</h1>'
)

// Gửi mã xác thực
await sendVerificationCode('user@example.com', '123456')
```

## 📊 So sánh AWS SES vs Nodemailer

| Tiêu chí | AWS SES | Nodemailer |
|----------|---------|------------|
| Setup | Phức tạp (AWS account, IAM, verification) | Đơn giản (chỉ cần SMTP) |
| Cost | $0.10/1000 emails | Free (Gmail) / Rẻ (SendGrid) |
| Testing | Khó (cần AWS sandbox) | Dễ (dùng Gmail ngay) |
| Providers | Chỉ AWS | Gmail, Outlook, SendGrid, Mailgun, etc. |
| Flexibility | Thấp | Cao |

## 🎯 Khuyến nghị cho Production

### Option 1: SendGrid (Khuyên dùng)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```
- ✅ 100 emails/day miễn phí
- ✅ Deliverability cao
- ✅ Analytics dashboard
- ✅ Easy setup

### Option 2: Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```
- ✅ 5,000 emails/month miễn phí (3 tháng)
- ✅ Good deliverability
- ✅ REST API available

### Option 3: AWS SES (qua Nodemailer)
```env
SMTP_HOST=email-smtp.ap-southeast-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```
- ✅ Rất rẻ ($0.10/1000)
- ✅ Scalable
- ⚠️ Cần verify domain

## 🔧 Troubleshooting

### ❌ "Invalid login"
- Gmail: Phải dùng App Password, không dùng mật khẩu thường
- Outlook: Bật "Allow less secure apps"

### ❌ "Connection timeout"
- Kiểm tra firewall/antivirus
- Thử port khác (587 → 465)

### ❌ Email vào spam
- Setup SPF, DKIM records
- Verify domain với email provider
- Dùng reputable SMTP service

### ❌ "Greeting never received"
- Đổi `SMTP_SECURE=true` (nếu dùng port 465)
- Hoặc đổi `SMTP_SECURE=false` (nếu dùng port 587)

## 📚 Tài liệu tham khảo

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Password Guide](https://support.google.com/accounts/answer/185833)
- [SendGrid SMTP Integration](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [EMAIL_CONFIGURATION.md](./EMAIL_CONFIGURATION.md) - Chi tiết đầy đủ

## ✅ Testing Checklist

- [ ] Cấu hình biến môi trường trong `.env`
- [ ] Chạy test script: `npx ts-node src/utils/test-email.ts`
- [ ] Kiểm tra console log khi start server
- [ ] Gửi email test từ ứng dụng
- [ ] Kiểm tra inbox (và spam folder)
- [ ] Test tất cả loại email (verification, reset password, payment)

## 🆘 Support

Nếu gặp vấn đề:
1. Xem [EMAIL_CONFIGURATION.md](./EMAIL_CONFIGURATION.md)
2. Chạy test script để debug
3. Kiểm tra console logs
4. Verify credentials ở email provider dashboard

---

**Migration Date**: October 25, 2025  
**Status**: ✅ Complete & Tested
