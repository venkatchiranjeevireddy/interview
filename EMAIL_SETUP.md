# Email Configuration Guide

## Required Environment Variables

To enable password reset emails and OTP emails, you need to set up Gmail credentials in your `.env` file.

### Step 1: Set up Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Enable "2-Step Verification" if not already enabled
4. Search for "App passwords" 
5. Select "Mail" and "Windows Computer" (or your device)
6. Google will generate a 16-character password
7. Copy this password

### Step 2: Add to .env file

Add these lines to your `server/.env` file:

```
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
OTP_EXPIRY=10
```

### Step 3: Verify it works

The system will now:
- Send OTP emails during signup verification
- Send password reset codes when user clicks "Forgot Password"
- Send confirmation emails after password is reset

### Example .env (server)

```
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=resumes
GROQ_API_KEY=your-groq-api-key
GOOGLE_API_KEY=your-google-api-key

# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
OTP_EXPIRY=10
```

### Troubleshooting

If emails aren't sending:
1. Check that 2FA is enabled on your Google account
2. Verify the 16-character App Password is correct (no spaces)
3. Check server logs for email errors
4. Ensure EMAIL_USER matches the gmail account

### Features Enabled

✅ **Signup OTP** - Verification email sent during registration
✅ **Password Reset** - 6-digit code sent to email
✅ **Reset Confirmation** - Confirmation email after successful password change
