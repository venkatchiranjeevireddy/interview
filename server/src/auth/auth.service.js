import { supabaseAdmin, supabasePublic } from '../config/supabase.js';
import { generateOtp, sendOtpEmail, storeOtp, verifyOtp } from '../services/otp.service.js';
import { sendPasswordResetEmail, sendPasswordChangeConfirmation } from '../services/email.service.js';
import bcrypt from 'bcryptjs';

export const signUp = async ({ email, password, fullName }) => {
  console.log('🔐 [SIGNUP] Request - Email:', email);

  // Hash password with bcrypt (10 salt rounds)
  const passwordHash = await bcrypt.hash(password, 10);
  console.log(' [SIGNUP] Password hashed with bcrypt');

  const { data, error } = await supabasePublic.auth.signUp({ email, password });
  if (error) {
    console.error(' [SIGNUP] Supabase auth error:', error.message);
    throw new Error(error.message);
  }

  const user = data?.user;
  if (!user?.id) {
    console.error(' [SIGNUP] No user ID returned from Supabase');
    throw new Error('User not returned from Supabase');
  }
  console.log('✅ [SIGNUP] User created in Supabase auth, ID:', user.id);

  // Generate OTP and send email
  const otp = generateOtp();
  storeOtp(email, otp);
  console.log('✅ [SIGNUP] OTP generated and stored:', otp);
  
  await sendOtpEmail(email, otp);
  console.log('📧 [SIGNUP] OTP email sent to:', email);

  // Store user with hashed password and status ACTIVE
  const { error: dbError } = await supabaseAdmin.from('users').insert({
    id: user.id,
    email,
    password_hash: passwordHash,
    status: 'ACTIVE',
    'Full name': fullName,
  });

  if (dbError) {
    console.error('❌ [SIGNUP] DB insert error:', dbError.message);
    throw new Error(`Failed to create user: ${dbError.message}`);
  }
  console.log('✅ [SIGNUP] User stored in DB:', email);

  return {
    message: 'OTP sent to your email. Verify to complete signup.',
    userId: user.id,
    email,
  };
};

export const verifySignupOtp = async ({ email, otp }) => {
  console.log('🔐 [VERIFY OTP] Request - Email:', email, 'OTP:', otp);
  
  const result = verifyOtp(email, otp);
  if (!result.valid) {
    console.error('❌ [VERIFY OTP] Invalid OTP:', result.message);
    throw new Error(result.message);
  }
  console.log('✅ [VERIFY OTP] OTP verified successfully');

  // Confirm email in Supabase auth so password login works
  const { data: userRow, error: userLookupError } = await supabaseAdmin
    .from('users')
    .select('id, email, status, created_at')
    .eq('email', email)
    .single();

  if (userLookupError || !userRow) {
    console.error('❌ [VERIFY OTP] User lookup error:', userLookupError?.message);
    throw new Error('Failed to verify user');
  }

  try {
    const now = new Date().toISOString();
    await supabaseAdmin.auth.admin.updateUserById(userRow.id, {
      email_confirm: true,
      email_confirmed_at: now,
    });
    console.log('✅ [VERIFY OTP] Supabase auth email marked confirmed at', now);
  } catch (updateErr) {
    console.error('⚠️ [VERIFY OTP] Failed to mark email confirmed in Supabase auth:', updateErr.message);
  }

  console.log('✅ [VERIFY OTP] User verified and ready to login:', email);

  // User can now login - return success
  return {
    message: 'Email verified successfully! You can now login.',
    email,
  };
};

export const login = async ({ email, password }) => {
  console.log('🔓 [LOGIN] Request - Email:', email);
  
  const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('❌ [LOGIN] Auth error:', error.message);
    throw new Error(error.message);
  }

  const accessToken = data?.session?.access_token;
  const userId = data?.user?.id;

  if (!accessToken || !userId) {
    console.error('❌ [LOGIN] No token or user ID returned');
    throw new Error('Invalid credentials or no active session');
  }
  console.log('✅ [LOGIN] User logged in successfully:', email);

  return {
    token: accessToken,
    user: {
      id: userId,
      email,
    },
  };
};

export const getProfile = async (userId) => {
  console.log('👤 [PROFILE] Request - User ID:', userId);
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, status, created_at, "Full name"')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ [PROFILE] User lookup error:', error.message);
    throw new Error('User profile not found');
  }
  console.log('✅ [PROFILE] Profile retrieved:', data.email);

  return {
    id: data.id,
    email: data.email,
    fullName: data['Full name'] || '',
    status: data.status,
    createdAt: data.created_at,
  };
};

// In-memory store for reset codes (in production, use Redis or DB)
const resetCodes = new Map();

export const forgotPassword = async ({ email }) => {
  console.log('🔐 [FORGOT PASSWORD] Request - Email:', email);
  
  // Check if user exists
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (error || !user) {
    console.error('❌ [FORGOT PASSWORD] User not found:', email);
    throw new Error('User does not exist in our database. Please sign up.');
  }

  console.log('✅ [FORGOT PASSWORD] User found:', email);

  // Generate reset code (6-digit number)
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store code with expiry (15 minutes)
  resetCodes.set(email, {
    code: resetCode,
    userId: user.id,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  console.log('✅ [FORGOT PASSWORD] Reset code generated for:', email);
  
  // Send code to email
  await sendPasswordResetEmail(email, resetCode);

  return {
    message: 'Reset code sent to your email. Code expires in 15 minutes.',
    email,
  };
};

export const verifyResetCode = async ({ email, code }) => {
  console.log('🔐 [VERIFY RESET CODE] Request - Email:', email);

  const storedData = resetCodes.get(email);

  if (!storedData) {
    console.error('❌ [VERIFY RESET CODE] No reset code found for:', email);
    throw new Error('No reset request found. Please request a new reset code.');
  }

  if (Date.now() > storedData.expiresAt) {
    console.error('❌ [VERIFY RESET CODE] Reset code expired for:', email);
    resetCodes.delete(email);
    throw new Error('Reset code expired. Please request a new one.');
  }

  if (storedData.code !== code) {
    console.error('❌ [VERIFY RESET CODE] Invalid code for:', email);
    throw new Error('Invalid reset code. Please try again.');
  }

  console.log('✅ [VERIFY RESET CODE] Code verified for:', email);

  return {
    message: 'Code verified. You can now reset your password.',
    email,
  };
};

export const resetPassword = async ({ email, code, newPassword }) => {
  console.log('🔐 [RESET PASSWORD] Request - Email:', email);

  const storedData = resetCodes.get(email);

  if (!storedData) {
    console.error('❌ [RESET PASSWORD] No reset code found for:', email);
    throw new Error('No reset request found. Please request a new reset code.');
  }

  if (Date.now() > storedData.expiresAt) {
    console.error('❌ [RESET PASSWORD] Reset code expired for:', email);
    resetCodes.delete(email);
    throw new Error('Reset code expired. Please request a new one.');
  }

  if (storedData.code !== code) {
    console.error('❌ [RESET PASSWORD] Invalid code for:', email);
    throw new Error('Invalid reset code.');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password in DB
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('email', email);

  if (dbError) {
    console.error('❌ [RESET PASSWORD] DB update error:', dbError.message);
    throw new Error('Failed to update password');
  }

  // Try to update Supabase auth password
  try {
    await supabaseAdmin.auth.admin.updateUserById(storedData.userId, {
      password: newPassword,
    });
    console.log('✅ [RESET PASSWORD] Supabase auth password updated');
  } catch (updateErr) {
    console.warn('⚠️ [RESET PASSWORD] Failed to update Supabase auth password:', updateErr.message);
  }

  // Clear reset code
  resetCodes.delete(email);

  // Send confirmation email
  await sendPasswordChangeConfirmation(email);

  console.log('✅ [RESET PASSWORD] Password reset successful for:', email);

  return {
    message: 'Password reset successfully! You can now login with your new password.',
    email,
  };
};
