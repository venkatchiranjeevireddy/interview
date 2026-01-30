// Password reset API service
import { API_BASE_URL } from '../api.js';

const AUTH_API = `${API_BASE_URL}/api/v1/auth`;

export const passwordResetApi = {
  forgotPassword: async (email) => {
    const res = await fetch(`${AUTH_API}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send reset code');
    }
    return res.json();
  },

  verifyResetCode: async (email, code) => {
    const res = await fetch(`${AUTH_API}/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Invalid verification code');
    }
    return res.json();
  },

  resetPassword: async (email, code, newPassword) => {
    const res = await fetch(`${AUTH_API}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to reset password');
    }
    return res.json();
  }
};
