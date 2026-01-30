import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleLogin, handleMe, handleSignUp, handleVerifyOtp, handleUpdateProfile, handleForgotPassword, handleVerifyResetCode, handleResetPassword } from './auth.controller.js';

const router = Router();

router.post('/signup', handleSignUp);
router.post('/verify-otp', handleVerifyOtp);
router.post('/login', handleLogin);
router.post('/forgot-password', handleForgotPassword);
router.post('/verify-reset-code', handleVerifyResetCode);
router.post('/reset-password', handleResetPassword);
router.get('/me', authenticate, handleMe);
router.put('/profile', authenticate, handleUpdateProfile);

export default router;
