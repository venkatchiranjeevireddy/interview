import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { supabaseAdmin as supabase } from '../config/supabase.js';

const router = Router();

// Get user's subscription and usage stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    let plan = subscription?.plan || 'BASIC';

    // Check if premium has expired and downgrade if needed
    if (subscription && plan === 'PREMIUM' && subscription.expires_at) {
      const now = new Date();
      const expiresAt = new Date(subscription.expires_at);
      
      if (now > expiresAt) {
        // Premium expired, downgrade to BASIC
        console.log(`[SUBSCRIPTION] Premium expired for user ${userId}, downgrading to BASIC`);
        const { error } = await supabase
          .from('subscriptions')
          .update({ plan: 'BASIC', expires_at: null })
          .eq('user_id', userId);
        
        if (!error) {
          plan = 'BASIC';
        }
      }
    }

    // Get resume count
    const { count: resumeCount } = await supabase
      .from('resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get today's usage
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const stats = {
      plan,
      subscription: {
        ...subscription,
        plan // Use current plan (after potential downgrade)
      },
      limits: {
        resumes: {
          current: resumeCount || 0,
          max: plan === 'PREMIUM' ? 10 : 3,
          unlimited: false
        },
        ats: {
          used: plan === 'BASIC' ? (usage?.ats_count || 0) : 0,
          max: plan === 'PREMIUM' ? null : 5,
          unlimited: plan === 'PREMIUM'
        },
        interviews: {
          used: plan === 'BASIC' ? (usage?.interview_count || 0) : 0,
          max: plan === 'PREMIUM' ? null : 5,
          unlimited: plan === 'PREMIUM'
        }
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Upgrade to premium (3 month free trial)
router.post('/upgrade', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // ~3 months from now

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log(`[UPGRADE] User ${userId} upgrading to PREMIUM (expires: ${expiresAt.toISOString()})`);

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          plan: 'PREMIUM', 
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      console.log(`[UPGRADE] Successfully upgraded user ${userId}`);
      res.json({ 
        success: true, 
        subscription: data,
        message: 'Welcome to Premium! You have 3 months of free access.'
      });
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{ 
          user_id: userId, 
          plan: 'PREMIUM',
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      console.log(`[UPGRADE] Created new PREMIUM subscription for user ${userId}`);
      res.json({ 
        success: true, 
        subscription: data,
        message: 'Welcome to Premium! You have 3 months of free access.'
      });
    }
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

export default router;
