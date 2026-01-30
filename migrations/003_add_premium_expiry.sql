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
