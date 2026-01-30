import { useState } from 'react';
import { authApi } from '../api.js';
import { PasswordResetModal } from '../components/PasswordResetModal.jsx';

export default function Login({ onLoginSuccess, onGoToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const handleLogin = async (evt) => {
    evt.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await authApi.login({ email, password });
      if (result?.token) {
        localStorage.setItem('auth_token', result.token);
        setMessage('Logged in successfully!');
        setTimeout(() => onLoginSuccess(result.token, result.user), 1000);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>Log In</h2>
        <form onSubmit={handleLogin}>
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
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="status">
          Don't have an account?{' '}
          <button className="link" type="button" onClick={onGoToSignup}>
            Sign up here
          </button>
        </div>

        <div className="status" style={{ marginTop: '12px' }}>
          Forgot your password?{' '}
          <button className="link" type="button" onClick={() => setShowResetModal(true)}>
            Reset here
          </button>
        </div>

        {message && <div className="status success">{message}</div>}
        {error && <div className="status error">{error}</div>}
      </div>

      {showResetModal && <PasswordResetModal onClose={() => setShowResetModal(false)} />}
    </>
  );
}
