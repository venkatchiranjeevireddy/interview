import { useState } from 'react';
import { passwordResetApi } from '../services/passwordReset.js';

export function PasswordResetModal({ onClose }) {
  const [step, setStep] = useState('email'); // email -> code -> password -> success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const result = await passwordResetApi.forgotPassword(email);
      setMessage(result.message);
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await passwordResetApi.verifyResetCode(email, code);
      setMessage(result.message);
      setStep('password');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await passwordResetApi.resetPassword(email, code, newPassword);
      setMessage(result.message);
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
    setStep('email');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #111827, #0b1224)',
        border: '1px solid #1f2937',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>🔐 Reset Password</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ✕
          </button>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendCode}>
            <label htmlFor="resetEmail">Enter your email</label>
            <input
              id="resetEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
            {error && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</div>}
            {message && <div style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>{message}</div>}
            <button type="submit" disabled={loading} style={{ marginTop: '16px', width: '100%' }}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode}>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>
            <label htmlFor="resetCode">Verification Code</label>
            <input
              id="resetCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              disabled={loading}
              style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '2px' }}
            />
            {error && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</div>}
            {message && <div style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>{message}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              disabled={loading}
            />
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              disabled={loading}
            />
            {error && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</div>}
            {message && <div style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>{message}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#10b981' }}>Password Reset Successful!</h3>
            <p style={{ margin: '0 0 24px 0', color: '#cbd5e1' }}>
              Your password has been updated. You can now login with your new password.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
