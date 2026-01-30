import { useState } from 'react';
import { authApi } from '../api.js';

export default function Signup({ onSignupSuccess, onGoToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSignup = async (evt) => {
    evt.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await authApi.signup({ email, password, fullName });
      setMessage(result.message || 'OTP sent to your email');
      setOtpSent(true);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (evt) => {
    evt.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await authApi.verifyOtp({ email, otp });
      setMessage(result.message || 'Email verified! Redirecting to login...');
      setTimeout(() => onSignupSuccess(), 1500);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Account</h2>
      {!otpSent ? (
        <form onSubmit={handleSignup}>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <p style={{ color: '#cbd5e1', marginBottom: '15px' }}>
            Enter the OTP sent to <strong>{email}</strong>
          </p>
          <label htmlFor="otp">OTP</label>
          <input
            id="otp"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.slice(0, 6))}
            maxLength="6"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      {message && <div className="status success">{message}</div>}
      {error && <div className="status error">{error}</div>}

      <div className="status">
        Already have an account?{' '}
        <button className="link" type="button" onClick={onGoToLogin}>
          Go to login
        </button>
      </div>
    </div>
  );
}
