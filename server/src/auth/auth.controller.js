import { getProfile, login, signUp, verifySignupOtp, forgotPassword, verifyResetCode, resetPassword } from './auth.service.js';
import { supabaseAdmin } from '../config/supabase.js';

export const handleSignUp = async (req, res) => {
  console.log('📝 [CONTROLLER] Signup request received');
  const { email, password, fullName } = req.body || {};
  if (!email || !password || !fullName) {
    console.error('❌ [CONTROLLER] Missing required fields');
    return res.status(400).json({ message: 'Email, password, and full name are required' });
  }

  try {
    const result = await signUp({ email, password, fullName });
    console.log('✅ [CONTROLLER] Signup successful');
    return res.status(201).json(result);
  } catch (err) {
    console.error('❌ [CONTROLLER] Signup error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleVerifyOtp = async (req, res) => {
  console.log('🔐 [CONTROLLER] Verify OTP request received');
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    console.error('❌ [CONTROLLER] Missing email or OTP');
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const result = await verifySignupOtp({ email, otp });
    console.log('✅ [CONTROLLER] OTP verification successful');
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ [CONTROLLER] OTP verification error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleLogin = async (req, res) => {
  console.log('🔓 [CONTROLLER] Login request received');
  const { email, password } = req.body || {};
  if (!email || !password) {
    console.error('❌ [CONTROLLER] Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await login({ email, password });
    console.log('✅ [CONTROLLER] Login successful');
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ [CONTROLLER] Login error:', err.message);
    return res.status(401).json({ message: err.message });
  }
};

export const handleMe = async (req, res) => {
  console.log('👤 [CONTROLLER] Get profile request received');
  try {
    const profile = await getProfile(req.user.id);
    console.log('✅ [CONTROLLER] Profile retrieved');
    return res.status(200).json({ user: profile });
  } catch (err) {
    console.error('❌ [CONTROLLER] Profile error:', err.message);
    return res.status(404).json({ message: err.message });
  }
};

export const handleUpdateProfile = async (req, res) => {
  console.log('✏️ [CONTROLLER] Update profile request received');
  const { fullName } = req.body || {};
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ message: 'Full name is required' });
  }
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 'Full name': fullName })
      .eq('id', req.user.id);
    if (error) throw new Error(error.message);
    console.log('✅ [CONTROLLER] Profile updated');
    return res.status(200).json({ message: 'Profile updated', fullName });
  } catch (err) {
    console.error('❌ [CONTROLLER] Update error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleForgotPassword = async (req, res) => {
  console.log('🔐 [CONTROLLER] Forgot password request received');
  const { email } = req.body || {};
  if (!email) {
    console.error('❌ [CONTROLLER] Missing email');
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const result = await forgotPassword({ email });
    console.log('✅ [CONTROLLER] Reset code sent');
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ [CONTROLLER] Forgot password error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleVerifyResetCode = async (req, res) => {
  console.log('🔐 [CONTROLLER] Verify reset code request received');
  const { email, code } = req.body || {};
  if (!email || !code) {
    console.error('❌ [CONTROLLER] Missing email or code');
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    const result = await verifyResetCode({ email, code });
    console.log('✅ [CONTROLLER] Reset code verified');
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ [CONTROLLER] Verify code error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};

export const handleResetPassword = async (req, res) => {
  console.log('🔐 [CONTROLLER] Reset password request received');
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    console.error('❌ [CONTROLLER] Missing required fields');
    return res.status(400).json({ message: 'Email, code, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const result = await resetPassword({ email, code, newPassword });
    console.log('✅ [CONTROLLER] Password reset successful');
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ [CONTROLLER] Reset password error:', err.message);
    return res.status(400).json({ message: err.message });
  }
};
