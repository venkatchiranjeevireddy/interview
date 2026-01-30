import { supabaseAdmin as supabase } from '../config/supabase.js';

export const checkSubscriptionLimits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();

    const plan = subscription?.plan || 'BASIC';
    req.userPlan = plan;

    // Premium users have unlimited access
    if (plan === 'PREMIUM') {
      req.hasAccess = true;
      return next();
    }

    // Basic plan limits: 5 ATS per day, 5 interviews per day
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (!usage) {
      // Create today's usage record
      await supabase.from('daily_usage').insert({
        user_id: userId,
        date: today,
        ats_count: 0,
        interview_count: 0
      });
      req.dailyUsage = { ats_count: 0, interview_count: 0 };
    } else {
      req.dailyUsage = usage;
    }

    req.hasAccess = true;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    req.hasAccess = true; // Allow access on error
    next();
  }
};

export const checkResumeUploadLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();

    const plan = subscription?.plan || 'BASIC';

    // Count user's resumes
    const { count } = await supabase
      .from('resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const resumeCount = count || 0;

    // Basic: 3 resumes, Premium: 10 resumes
    const limit = plan === 'PREMIUM' ? 10 : 3;

    if (resumeCount >= limit) {
      return res.status(403).json({
        error: 'Resume upload limit reached',
        message: plan === 'BASIC' 
          ? `Free plan allows only ${limit} resumes. Upgrade to Premium for up to 10 resumes!`
          : `You have reached the maximum of ${limit} resumes.`,
        plan,
        limit,
        current: resumeCount
      });
    }

    next();
  } catch (error) {
    console.error('Resume limit check error:', error);
    next();
  }
};

export const trackAtsUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const plan = req.userPlan || 'BASIC';
    const today = new Date().toISOString().split('T')[0];

    if (plan === 'BASIC') {
      const usage = req.dailyUsage;
      if (usage.ats_count >= 5) {
        return res.status(403).json({
          error: 'Daily ATS limit reached',
          message: 'You have used all 5 free ATS scans for today. Upgrade to Premium for unlimited access!',
          plan: 'BASIC',
          limit: 5,
          used: usage.ats_count
        });
      }

      // Increment ATS count
      await supabase
        .from('daily_usage')
        .update({ ats_count: usage.ats_count + 1 })
        .eq('user_id', userId)
        .eq('date', today);
    }

    next();
  } catch (error) {
    console.error('ATS tracking error:', error);
    next();
  }
};

export const trackInterviewUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const plan = req.userPlan || 'BASIC';
    const today = new Date().toISOString().split('T')[0];

    if (plan === 'BASIC') {
      const usage = req.dailyUsage;
      if (usage.interview_count >= 5) {
        return res.status(403).json({
          error: 'Daily interview limit reached',
          message: 'You have used all 5 free interviews for today. Upgrade to Premium for unlimited access!',
          plan: 'BASIC',
          limit: 5,
          used: usage.interview_count
        });
      }

      // Increment interview count
      await supabase
        .from('daily_usage')
        .update({ interview_count: usage.interview_count + 1 })
        .eq('user_id', userId)
        .eq('date', today);
    }

    next();
  } catch (error) {
    console.error('Interview tracking error:', error);
    next();
  }
};
