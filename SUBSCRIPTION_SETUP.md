# Subscription System - Final Setup Steps

## ✅ Completed
- Backend subscription middleware (limit checks)
- Daily usage tracking system
- Resume/ATS/Interview limit enforcement
- Subscription stats API endpoint
- Upgrade API endpoint with **3-month free trial**
- Dashboard UI with plan badges
- Profile subscription section
- Usage display for Basic users
- Upgrade buttons with trial info
- **Premium expiry tracking and auto-downgrade**
- Premium expiry display in dashboard and profile

## 📋 Required: Database Migrations

**IMPORTANT:** Run these SQL migrations in your Supabase SQL Editor to complete the setup:

### Migration 1: Create daily_usage table

```sql
-- Create daily_usage table for tracking Basic plan limits
CREATE TABLE IF NOT EXISTS public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ats_count INTEGER NOT NULL DEFAULT 0,
  interview_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own usage records
CREATE POLICY "Users can view own daily usage"
  ON public.daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily usage"
  ON public.daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily usage"
  ON public.daily_usage FOR UPDATE
  USING (auth.uid() = user_id);
```

### Migration 2: Add premium expiry tracking

```sql
-- Add expires_at column to subscriptions table for premium expiry tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing PREMIUM subscriptions to expire in 3 months from creation
UPDATE public.subscriptions 
SET expires_at = created_at + INTERVAL '3 months'
WHERE plan = 'PREMIUM' AND expires_at IS NULL AND created_at IS NOT NULL;

-- Create index for efficient expiry checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- Add comment for clarity
COMMENT ON COLUMN public.subscriptions.expires_at IS 'When PREMIUM plan expires, after which user reverts to BASIC. NULL means no expiry (legacy or permanent premium).';
```

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run Migration 1 first (daily_usage table)
4. Then run Migration 2 (add expires_at column)
5. Verify both tables were created/updated in the Table Editor

## 🎯 Plan Features

### BASIC Plan (Default)
- ✅ 3 resume slots
- ✅ 5 ATS scans per day
- ✅ 5 interviews per day
- ✅ Daily limits reset at midnight
- ✅ **Can upgrade anytime**

### PREMIUM Plan (3-Month Free Trial)
- ✅ 10 resume slots
- ✅ Unlimited ATS scans
- ✅ Unlimited interviews
- ✅ No daily limits
- ✅ **Automatically reverts to BASIC after 3 months**

## 🔄 How Premium Trial Works

1. **User clicks "Enable Premium"** → Gets 3 months of full premium access
2. **expires_at is set** → 3 months from upgrade date
3. **Every API call checks expiry** → If past expiry date, auto-downgrades to BASIC
4. **User sees expiry date** → Displays countdown in profile
5. **After 3 months** → Automatically reverts to BASIC, shows upgrade button again

## 🧪 Testing Checklist

### Test Basic Plan Limits:
1. ✅ Upload 4th resume → Should get 403 "Resume limit reached"
2. ✅ Run 6th ATS scan → Should get 403 "Daily ATS limit reached"
3. ✅ Start 6th interview → Should get 403 "Daily interview limit reached"
4. ✅ Check dashboard shows usage (e.g., "3/5 ATS used today")
5. ✅ Verify plan badge shows "BASIC"

### Test Premium Upgrade:
1. ✅ Click "Enable Premium (3 Months Free)" button
2. ✅ Confirm upgrade dialog
3. ✅ Verify plan badge changes to "⭐ PREMIUM"
4. ✅ **Verify "Expires DD/MM/YYYY" tag appears** (yellow)
5. ✅ Verify usage limits display shows "Unlimited ✨"
6. ✅ Try uploading more than 3 resumes (should work up to 10)
7. ✅ Run unlimited ATS scans (no 403 errors)

### Test Premium Auto-Downgrade:
1. ✅ Update database: `UPDATE subscriptions SET expires_at = NOW() - INTERVAL '1 day' WHERE user_id = '<your-user-id>'`
2. ✅ Refresh dashboard
3. ✅ Verify plan badge reverts to "BASIC"
4. ✅ Verify "Enable Premium" button reappears
5. ✅ Verify limits revert to 3 resumes, 5 ATS, 5 interviews

### Test Dashboard Display:
1. ✅ Basic users: See plan badge, usage stats, upgrade button
2. ✅ Premium users: See plan badge, expiry date, benefits message
3. ✅ Profile shows: Plan, member since, expiry date (if premium)
4. ✅ Premium info card in profile with expiry countdown

## 🚀 Ready to Use!

All code is implemented. Just run the two SQL migrations above and test the features!

**Important Notes:**
- Limits are enforced BEFORE operations (middleware checks)
- Usage is incremented AFTER successful operations
- Premium users bypass all limit checks
- Daily usage resets automatically (date-based queries)
- **Premium expiry is checked on every stats API call**
- **Auto-downgrade happens seamlessly in background**
- All backend validation in place to prevent abuse
- Trial period is exactly 3 months (~90 days)

