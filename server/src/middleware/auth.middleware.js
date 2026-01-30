import { supabaseAdmin } from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  console.log('🔒 [MIDDLEWARE] Authenticating request...');
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ [MIDDLEWARE] Missing or invalid Authorization header');
      return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      console.error('❌ [MIDDLEWARE] Token missing');
      return res.status(401).json({ message: 'Token missing' });
    }
    console.log('✅ [MIDDLEWARE] Token extracted');

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('❌ [MIDDLEWARE] Invalid or expired token');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.log('✅ [MIDDLEWARE] Token validated, User ID:', userData.user.id);

    const { data: appUser, error: appUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, status, created_at')
      .eq('id', userData.user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('❌ [MIDDLEWARE] User record not found for ID:', userData.user.id);
      return res.status(401).json({ message: 'User record not found. Please complete signup first.' });
    }
    console.log('✅ [MIDDLEWARE] User found in DB:', appUser.email);

    if (appUser.status && appUser.status.toUpperCase() === 'BLOCKED') {
      console.error('❌ [MIDDLEWARE] User is blocked');
      return res.status(403).json({ message: 'User is blocked' });
    }
    console.log('✅ [MIDDLEWARE] User status OK:', appUser.status);

    req.user = {
      id: appUser.id,
      email: appUser.email,
      status: appUser.status,
      createdAt: appUser.created_at,
    };
    console.log('✅ [MIDDLEWARE] Authentication successful');

    return next();
  } catch (err) {
    console.error('❌ [MIDDLEWARE] Authentication error:', err.message);
    return res.status(500).json({ message: 'Authentication failed', error: err.message });
  }
};
