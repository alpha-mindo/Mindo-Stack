# Resend Email Setup Guide

## Quick Start

### 1. Get Your Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `re_`)

### 2. Update Environment Variables

Open `server/.env` and replace the placeholder with your actual API key:

```env
RESEND_API_KEY=re_your_actual_api_key_here
```

### 3. Email Domain Configuration

**For Development/Testing (Using Resend's Default Domain):**

The code currently uses `onboarding@resend.dev` which works out of the box for testing. Resend allows you to send emails from this domain during development.

**For Production (Using Your Own Domain):**

1. Add your domain in Resend dashboard
2. Add the DNS records Resend provides to your domain
3. Verify the domain
4. Update the email sender in `server/routes/auth.js`:

```javascript
from: 'Mindo-Stack <noreply@yourdomain.com>',
```

## How Password Reset Works

### Flow:

1. **User requests password reset:**
   - User enters email on `/forgot-password` page
   - Backend generates a secure random token
   - Token is hashed and stored in database with 1-hour expiration
   - Email sent via Resend with reset link

2. **User clicks email link:**
   - Link contains unhashed token: `/reset-password/:resetToken`
   - User enters new password
   - Backend verifies token and expiration
   - Password updated and user auto-logged in

3. **Security features:**
   - Token hashed in database (SHA-256)
   - 1-hour expiration
   - Token deleted after successful reset
   - Token deleted if email fails to send
   - Password must be 6+ characters

## Email Template

The password reset email includes:
- Professional HTML styling matching your Parsec theme
- Clickable reset button
- Plain text link as backup
- 1-hour expiration notice
- Branding and footer

## Testing Password Reset

### 1. Start your application:
```bash
npm run dev
```

### 2. Test the flow:
1. Go to http://localhost:3000
2. Click "Forgot password?"
3. Enter your email
4. Check your inbox for the reset email
5. Click the reset link
6. Enter new password
7. You'll be auto-logged in

### 3. Verify email delivery:
- Check Resend dashboard for email logs
- Look at delivery status and any errors

## Troubleshooting

### Email not sending?
- Check your API key is correct in `.env`
- Restart the server after updating `.env`
- Check Resend dashboard for errors
- Verify your account has remaining email quota

### Token expired?
- Tokens expire after 1 hour
- Request a new password reset email

### Email going to spam?
- For development, this is normal with `onboarding@resend.dev`
- For production, use your own verified domain

## Resend Free Tier Limits

- **100 emails/day** for testing domain (`onboarding@resend.dev`)
- **3,000 emails/month** for verified custom domains
- Perfect for development and small applications

## Next Steps

Once you're ready for production:
1. Add your custom domain to Resend
2. Verify DNS records
3. Update the `from` email address in the code
4. Test with your domain
5. Consider upgrading Resend plan if needed

## Support

- Resend Documentation: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference

---

**Note:** Never commit your `.env` file with real API keys to version control!
