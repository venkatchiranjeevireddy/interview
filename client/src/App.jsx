import { useEffect, useState } from 'react';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import './styles.css';

export default function App() {
  const initialToken = localStorage.getItem('auth_token') || '';
  const [token, setToken] = useState(initialToken);
  const [page, setPage] = useState(initialToken ? 'dashboard' : 'login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token && page !== 'dashboard') {
      setPage('dashboard');
    }
  }, [token, page]);

  const handleSignupSuccess = () => {
    setPage('login');
  };

  const handleLoginSuccess = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('auth_token', newToken);
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken('');
    setUser(null);
    setPage('login');
  };

  if (page === 'dashboard' && token) {
    return <Dashboard token={token} initialUser={user} onLogout={handleLogout} onUpdateUser={setUser} />;
  }

  return (
    <div className="app-shell">
      <div className="header">
        <h1 className="title">Auth System</h1>
        <div className="tag">Email OTP Verification</div>
      </div>

      <div className="cards">
        {page === 'signup' ? (
          <Signup onSignupSuccess={handleSignupSuccess} onGoToLogin={() => setPage('login')} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} onGoToSignup={() => setPage('signup')} />
        )}
      </div>
    </div>
  );
}
