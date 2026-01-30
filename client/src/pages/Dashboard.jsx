import { useEffect, useMemo, useState } from 'react';
import { authApi, resumeApi } from '../api.js';
import { Interview } from '../components/interview/Interview.jsx';
import { subscriptionApi } from '../services/subscription.js';
import { historyApi } from '../services/history.js';

const formatDate = (value) => {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString();
};

export default function Dashboard({ token, initialUser, onLogout, onUpdateUser }) {
  const [user, setUser] = useState(initialUser);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [view, setView] = useState('welcome');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [jobError, setJobError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [runningAts, setRunningAts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingResume, setDeletingResume] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [subscriptionStats, setSubscriptionStats] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [upgradingToPremium, setUpgradingToPremium] = useState(false);
  const [atsHistory, setAtsHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedInterviewDetail, setSelectedInterviewDetail] = useState(null);

  const selectedResume = useMemo(
    () => resumes.find((r) => String(r.id) === String(selectedResumeId)),
    [resumes, selectedResumeId],
  );

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await authApi.me(token);
      setUser(res.user);
      onUpdateUser?.(res.user);
    } catch (err) {
      setError(err.message || 'Session expired. Please log in again.');
      onLogout();
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadResumes = async () => {
    setLoadingResumes(true);
    try {
      const res = await resumeApi.list(token);
      const list = res.resumes || [];
      setResumes(list);
      if (list.length && !selectedResumeId) {
        setSelectedResumeId(String(list[0].id));
      }
    } catch (err) {
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  const loadSubscriptionStats = async () => {
    setLoadingSubscription(true);
    try {
      const stats = await subscriptionApi.getStats(token);
      setSubscriptionStats(stats);
    } catch (err) {
      console.error('Failed to load subscription stats:', err);
      // Don't show error to user, default to BASIC plan
      setSubscriptionStats({ plan: 'BASIC', limits: { resumes: { current: 0, max: 3 }, ats: { used: 0, max: 5 }, interviews: { used: 0, max: 5 } } });
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    if (confirm('Upgrade to Premium plan? This will unlock unlimited ATS scans, interviews, and 10 resume slots.')) {
      setUpgradingToPremium(true);
      try {
        await subscriptionApi.upgradeToPremium(token);
        setMessage('Successfully upgraded to Premium!');
        await loadSubscriptionStats();
      } catch (err) {
        setError(err.message || 'Upgrade failed');
      } finally {
        setUpgradingToPremium(false);
      }
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const [atsRes, interviewRes] = await Promise.all([
        historyApi.getAtsHistory(token),
        historyApi.getInterviewHistory(token)
      ]);
      setAtsHistory(atsRes.history || []);
      setInterviewHistory(interviewRes.interviews || []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadProfile();
    loadResumes();
    loadSubscriptionStats();
  }, [token]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.view) {
        setView(e.state.view);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView) => {
    setView(newView);
    window.history.pushState({ view: newView }, '', `#${newView}`);
  };

  const handleUpload = async (evt) => {
    evt.preventDefault();
    setMessage('');
    setError('');
    if (!file) {
      setError('Choose a PDF or DOCX file');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await resumeApi.upload(token, file);
      setResumes((prev) => [uploaded, ...prev]);
      setSelectedResumeId(String(uploaded.id));
      setFile(null);
      setMessage('Resume uploaded successfully');
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRunAts = async () => {
    setMessage('');
    setError('');
    setJobError('');
    if (!selectedResumeId) {
      setJobError('Pick a resume to evaluate');
      return;
    }
    if (!jobDescription.trim()) {
      setJobError('Enter a job description');
      return;
    }
    setRunningAts(true);
    try {
      const result = await resumeApi.runAts(token, selectedResumeId, jobDescription);
      setAtsResult(result);
      setMessage('ATS score ready');
      setView('result');
    } catch (err) {
      setError(err.message || 'ATS run failed');
    } finally {
      setRunningAts(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([loadProfile(), loadResumes(), loadSubscriptionStats()]);
    setRefreshing(false);
  };

  const resetToBuilder = () => navigateTo('builder');
  const goToWelcome = () => navigateTo('welcome');
  const goToProfile = () => {
    setEditingProfile(false);
    setShowProfileMenu(false);
    navigateTo('profile');
  };
  const goToBuilder = () => navigateTo('builder');
  const goToHistory = () => {
    loadHistory();
    navigateTo('history');
  };

  const handleDeleteResume = async (resumeId) => {
    if (!confirm('Delete this resume?')) return;
    setDeletingResume(resumeId);
    try {
      await resumeApi.deleteResume(token, resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      if (String(selectedResumeId) === String(resumeId)) {
        setSelectedResumeId('');
      }
      setMessage('Resume deleted');
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeletingResume(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      await resumeApi.updateProfile(token, { fullName: editName });
      setUser((prev) => ({ ...prev, fullName: editName }));
      onUpdateUser?.({ ...user, fullName: editName });
      setEditingProfile(false);
      setMessage('Profile updated');
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };
  const AppLogo = () => (
    <button type="button" className="app-logo" onClick={goToWelcome}>
      <div className="logo-icon">📊</div>
      <div className="logo-text">
        <div className="logo-name">ResumeATS</div>
        <div className="logo-sub">Career Tool</div>
      </div>
    </button>
  );
  const ProfileAvatar = () => (
    <div className="profile-avatar-wrapper">
      <button
        type="button"
        className="profile-avatar"
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        title={user?.email || 'Profile'}
      >
        {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
      </button>
      {showProfileMenu && (
        <div className="profile-menu">
          <div className="profile-menu-email">{user?.email || 'No email'}</div>
          <button type="button" className="profile-menu-item" onClick={goToProfile}>
            View Profile
          </button>
          <button type="button" className="profile-menu-item danger" onClick={onLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );

  if (view === 'welcome') {
    return (
      <div className="app-shell full">
        <div className="header">
          <AppLogo />
          <div style={{ flex: 1 }}>
            <h1 className="title">Welcome Back, {user?.fullName || user?.email?.split('@')[0] || 'User'}!</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div className="tag">Logged in</div>
              {subscriptionStats && (
                <div className={subscriptionStats.plan === 'PREMIUM' ? 'tag tag-premium' : 'tag tag-basic'}>
                  {subscriptionStats.plan === 'PREMIUM' ? '⭐ PREMIUM' : 'BASIC'}
                </div>
              )}
              {subscriptionStats?.plan === 'PREMIUM' && subscriptionStats.subscription?.expires_at && (
                <div className="tag" style={{ background: '#fbbf24', color: '#1f2937', fontWeight: 600 }}>
                  ⏳ Expires {new Date(subscriptionStats.subscription.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {subscriptionStats?.plan === 'BASIC' && (
              <button type="button" onClick={handleUpgradeToPremium} disabled={upgradingToPremium} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                {upgradingToPremium ? 'Upgrading...' : '⭐ Upgrade to Premium'}
              </button>
            )}
            <ProfileAvatar />
          </div>
        </div>

        <div className="hero">
          <div>
            <h2 className="hero-title">What would you like to do today?</h2>
            <p className="muted">Choose from the options below to get started.</p>
          </div>
        </div>

        {message && <div className="status success">{message}</div>}
        {error && <div className="status error">{error}</div>}

        {subscriptionStats?.plan === 'BASIC' && (
          <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Your Usage Today</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>ATS Scans:</span> {subscriptionStats.limits.ats.used}/{subscriptionStats.limits.ats.max}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Interviews:</span> {subscriptionStats.limits.interviews.used}/{subscriptionStats.limits.interviews.max}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Resumes:</span> {subscriptionStats.limits.resumes.current}/{subscriptionStats.limits.resumes.max}
                  </div>
                </div>
              </div>
              <button type="button" onClick={handleUpgradeToPremium} disabled={upgradingToPremium} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {upgradingToPremium ? 'Upgrading...' : '⭐ Get Unlimited Access (3 Months Free)'}
              </button>
            </div>
          </div>
        )}

        {subscriptionStats?.plan === 'PREMIUM' && subscriptionStats.subscription?.expires_at && (
          <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#86efac' }}>✨ Premium Active!</h3>
                <p style={{ margin: 0, color: '#cbd5e1' }}>
                  Unlimited ATS scans, interviews & storage. Enjoy until <strong>{new Date(subscriptionStats.subscription.expires_at).toLocaleDateString()}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="welcome-cards">
          <button type="button" className="welcome-card" onClick={goToBuilder}>
            <div className="welcome-icon">📊</div>
            <h3>Get ATS Score</h3>
            <p className="muted">Upload your resume and compare it against a job description to get an ATS match score.</p>
          </button>

          <button type="button" className="welcome-card" onClick={() => navigateTo('interview')}>
            <div className="welcome-icon">🎤</div>
            <h3>Interview Prep</h3>
            <p className="muted">Practice with AI-powered mock interviews tailored to your resume.</p>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div className="app-shell full">
        <div className="header">
          <AppLogo />
          <div style={{ flex: 1 }}>
            <h1 className="title">Profile</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="tag">Manage your account</div>
              {subscriptionStats && (
                <div className={subscriptionStats.plan === 'PREMIUM' ? 'tag tag-premium' : 'tag tag-basic'}>
                  {subscriptionStats.plan === 'PREMIUM' ? '⭐ PREMIUM' : 'BASIC'}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ProfileAvatar />
          </div>
        </div>

        {message && <div className="status success">{message}</div>}
        {error && <div className="status error">{error}</div>}

        <div className="cards two" style={{ marginTop: 16 }}>
          <div className="card">
            <h2>Your Info</h2>
            {loadingProfile ? (
              <div className="status">Loading...</div>
            ) : (
              <div>
                <div className="user-block">
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Name</span>
                    <span className="info-value">{user?.fullName || 'Not set'}</span>
                  </div>
                </div>
                {editingProfile ? (
                  <div style={{ marginTop: 12 }}>
                    <label htmlFor="editName">Full Name</label>
                    <input
                      id="editName"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button type="button" onClick={handleSaveProfile} disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditName(user?.fullName || '');
                        setEditingProfile(true);
                      }}
                    >
                      Edit Name
                    </button>
                    <button type="button" className="btn-danger" onClick={onLogout}>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Subscription</h2>
            {loadingSubscription ? (
              <div className="status">Loading...</div>
            ) : subscriptionStats ? (
              <div>
                <div className="user-block">
                  <div className="info-row">
                    <span className="info-label">Plan</span>
                    <span className="info-value">
                      <span className={subscriptionStats.plan === 'PREMIUM' ? 'tag tag-premium' : 'tag tag-basic'} style={{ fontSize: '14px' }}>
                        {subscriptionStats.plan === 'PREMIUM' ? '⭐ PREMIUM' : 'BASIC'}
                      </span>
                    </span>
                  </div>
                  {subscriptionStats.subscription?.created_at && (
                    <div className="info-row">
                      <span className="info-label">Member Since</span>
                      <span className="info-value">{formatDate(subscriptionStats.subscription.created_at)}</span>
                    </div>
                  )}
                  {subscriptionStats.plan === 'PREMIUM' && subscriptionStats.subscription?.expires_at && (
                    <div className="info-row">
                      <span className="info-label">Premium Expires</span>
                      <span className="info-value" style={{ color: '#fbbf24' }}>
                        {formatDate(subscriptionStats.subscription.expires_at)}
                      </span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Resume Slots</span>
                    <span className="info-value">
                      {subscriptionStats.limits.resumes.current}/{subscriptionStats.limits.resumes.unlimited ? '∞' : subscriptionStats.limits.resumes.max}
                    </span>
                  </div>
                  {subscriptionStats.plan === 'BASIC' && (
                    <>
                      <div className="info-row">
                        <span className="info-label">ATS Today</span>
                        <span className="info-value">{subscriptionStats.limits.ats.used}/{subscriptionStats.limits.ats.max}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Interviews Today</span>
                        <span className="info-value">{subscriptionStats.limits.interviews.used}/{subscriptionStats.limits.interviews.max}</span>
                      </div>
                    </>
                  )}
                  {subscriptionStats.plan === 'PREMIUM' && (
                    <div className="info-row">
                      <span className="info-label">Daily Limits</span>
                      <span className="info-value">Unlimited ✨</span>
                    </div>
                  )}
                </div>
                {subscriptionStats.plan === 'BASIC' && (
                  <div style={{ marginTop: 16, padding: '16px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: '8px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Upgrade to Premium</h3>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                      <li>Unlimited ATS scans per day</li>
                      <li>Unlimited interviews per day</li>
                      <li>10 resume slots (vs 3 on Basic)</li>
                      <li>✨ 3 months free trial!</li>
                    </ul>
                    <button type="button" onClick={handleUpgradeToPremium} disabled={upgradingToPremium} style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                      {upgradingToPremium ? 'Upgrading...' : '⭐ Enable Premium (3 Months Free)'}
                    </button>
                  </div>
                )}
                {subscriptionStats.plan === 'PREMIUM' && (
                  <div style={{ marginTop: 16, padding: '16px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#86efac' }}>✨ You're Premium!</h3>
                    <p style={{ margin: '8px 0', fontSize: '14px', color: '#cbd5e1' }}>
                      Enjoy unlimited access. Premium benefits will expire on <strong>{formatDate(subscriptionStats.subscription.expires_at)}</strong>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="status error">Failed to load subscription</div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2>Your Resumes</h2>
          {loadingResumes ? (
            <div className="status">Loading...</div>
          ) : resumes.length === 0 ? (
            <div className="status">No resumes yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resumes.map((r) => (
                <div key={r.id} className="profile-resume-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>Resume #{r.id}</div>
                    <div className="muted">{formatDate(r.created_at)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDeleteResume(r.id)}
                    disabled={deletingResume === r.id}
                  >
                    {deletingResume === r.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'result' && atsResult) {
    return (
      <div className="app-shell full">
        <div className="header">
          <AppLogo />
          <div style={{ flex: 1 }}>
            <h1 className="title">ATS Result</h1>
            <div className="tag">Resume #{selectedResumeId}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="btn-secondary" onClick={resetToBuilder}>
              Back
            </button>
            <ProfileAvatar />
          </div>
        </div>

        <div className="result-hero">
          <div>
            <div className="pill">Match Score</div>
            <div className="score-display">{atsResult.score}%</div>
            <div className="muted">Generated for your selected resume</div>
          </div>
          <div className="result-meta">
            {selectedResume && (
              <div className="meta-block">
                <div className="label">Resume</div>
                <div className="value">#{selectedResume.id}</div>
                <div className="muted">Uploaded {formatDate(selectedResume.created_at)}</div>
              </div>
            )}
            <div className="meta-block">
              <div className="label">Status</div>
              <div className="value">Complete</div>
              {atsResult.created_at && <div className="muted">Saved {formatDate(atsResult.created_at)}</div>}
            </div>
          </div>
        </div>

        <div className="cards two">
          <div className="card">
            <h2>Missing Keywords</h2>
            {atsResult.missing_keywords?.length ? (
              <div className="pill-wrap">
                {atsResult.missing_keywords.map((kw) => (
                  <span key={kw} className="pill pill-ghost">{kw}</span>
                ))}
              </div>
            ) : (
              <div className="status success">Great coverage. No missing keywords.</div>
            )}
          </div>

          <div className="card">
            <h2>Suggestions</h2>
            {atsResult.suggestions?.length ? (
              <ul className="list">
                {atsResult.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            ) : (
              <div className="status">No suggestions returned.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'interview') {
    return (
      <div className="app-shell full">
        <div className="header">
          <AppLogo />
          <div style={{ flex: 1 }}>
            <h1 className="title">Interview Prep</h1>
            <div className="tag">AI-Powered Mock Interview</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ProfileAvatar />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Interview
            resumeId={selectedResumeId}
            resume={selectedResume?.file_content || ''}
            jd={jobDescription}
            token={token}
            onBack={() => navigateTo('welcome')}
          />
        </div>
      </div>
    );
  }

  if (view === 'result' && atsResult) {
    return (
      <div className="app-shell full">
        <div className="header">
          <AppLogo />
          <div style={{ flex: 1 }}>
            <h1 className="title">ATS Result</h1>
            <div className="tag">Resume #{selectedResumeId}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="btn-secondary" onClick={resetToBuilder}>
              Back
            </button>
            <ProfileAvatar />
          </div>
        </div>

        <div className="result-hero">
          <div>
            <div className="pill">Match Score</div>
            <div className="score-display">{atsResult.score}%</div>
            <div className="muted">Generated for your selected resume</div>
          </div>
          <div className="result-meta">
            {selectedResume && (
              <div className="meta-block">
                <div className="label">Resume</div>
                <div className="value">#{selectedResume.id}</div>
                <div className="muted">Uploaded {formatDate(selectedResume.created_at)}</div>
              </div>
            )}
            <div className="meta-block">
              <div className="label">Status</div>
              <div className="value">Complete</div>
              {atsResult.created_at && <div className="muted">Saved {formatDate(atsResult.created_at)}</div>}
            </div>
          </div>
        </div>

        <div className="cards two">
          <div className="card">
            <h2>Missing Keywords</h2>
            {atsResult.missing_keywords?.length ? (
              <div className="pill-wrap">
                {atsResult.missing_keywords.map((kw) => (
                  <span key={kw} className="pill pill-ghost">{kw}</span>
                ))}
              </div>
            ) : (
              <div className="status success">Great coverage. No missing keywords.</div>
            )}
          </div>

          <div className="card">
            <h2>Suggestions</h2>
            {atsResult.suggestions?.length ? (
              <ul className="list">
                {atsResult.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            ) : (
              <div className="status">No suggestions returned.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="app-shell full">
        <div className="header">
          <AppLogo />
          <div style={{ flex: 1 }}>
            <h1 className="title">History</h1>
            <div className="tag">Review your past results</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="btn-secondary" onClick={goToWelcome}>
              Back
            </button>
            <ProfileAvatar />
          </div>
        </div>

        {error && <div className="status error">{error}</div>}

        <div className="cards two" style={{ marginTop: 16 }}>
          <div className="card">
            <h2>📊 ATS Score History</h2>
            {loadingHistory ? (
              <div className="status">Loading history...</div>
            ) : atsHistory.length === 0 ? (
              <div className="status">No ATS scores yet. Start by analyzing a resume!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {atsHistory.map((ats) => (
                  <div key={ats.id} style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1f2a3d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>{ats.resumeName}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: ats.score >= 70 ? '#10b981' : ats.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {ats.score}%
                      </div>
                    </div>
                    <div className="muted" style={{ fontSize: '12px', marginBottom: '8px' }}>
                      {formatDate(ats.createdAt)}
                    </div>
                    {ats.jobDescription && (
                      <div style={{ fontSize: '13px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>JD Preview:</strong> {ats.jobDescription.substring(0, 80)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2>🎤 Interview History</h2>
            {loadingHistory ? (
              <div className="status">Loading history...</div>
            ) : interviewHistory.length === 0 ? (
              <div className="status">No interviews yet. Start practicing!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {interviewHistory.map((interview) => (
                  <div key={interview.id} style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1f2a3d', cursor: 'pointer' }} onClick={() => setSelectedInterviewDetail(interview)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>Level: {interview.level}</div>
                      {interview.score && (
                        <div style={{ fontSize: '24px', fontWeight: 700, color: interview.score >= 70 ? '#10b981' : interview.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {Math.round(interview.score)}%
                        </div>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {formatDate(interview.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedInterviewDetail && (
          <div className="card" style={{ marginTop: 16, background: '#0b1324', border: '2px solid #667eea' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>📝 Interview Details</h2>
              <button type="button" className="btn-secondary" onClick={() => setSelectedInterviewDetail(null)}>
                Close
              </button>
            </div>
            <div className="user-block">
              <div className="info-row">
                <span className="info-label">Level</span>
                <span className="info-value">{selectedInterviewDetail.level}</span>
              </div>
              {selectedInterviewDetail.score && (
                <div className="info-row">
                  <span className="info-label">Score</span>
                  <span className="info-value">{Math.round(selectedInterviewDetail.score)}%</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Date</span>
                <span className="info-value">{formatDate(selectedInterviewDetail.created_at)}</span>
              </div>
            </div>
            {selectedInterviewDetail.feedback && (
              <div style={{ marginTop: 16, padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1f2a3d' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>📋 Feedback</h3>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6 }}>{selectedInterviewDetail.feedback}</p>
              </div>
            )}
            {selectedInterviewDetail.suggestions && selectedInterviewDetail.suggestions.length > 0 && (
              <div style={{ marginTop: 12, padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1f2a3d' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>💡 Suggestions</h3>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#cbd5e1' }}>
                  {selectedInterviewDetail.suggestions.map((s, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell full">
      <div className="header">
        <AppLogo />
        <div style={{ flex: 1 }}>
          <h1 className="title">Resume ATS</h1>
          <div className="tag">Build your score</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ProfileAvatar />
        </div>
      </div>

      <div className="hero">
        <div>
          <div className="pill">Step 1</div>
          <h2 className="hero-title">Upload, pick resume, paste JD</h2>
          <p className="muted">Choose a resume, add the job description, and get a focused ATS score on the next screen.</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="btn-secondary" onClick={goToHistory} disabled={refreshing}>
            📚 View History
          </button>
          <button type="button" className="btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Syncing...' : 'Sync data'}
          </button>
        </div>
      </div>

      {message && <div className="status success">{message}</div>}
      {error && <div className="status error">{error}</div>}

      <div className="cards two">
        <div className="card">
          <h2>Profile</h2>
          {loadingProfile ? (
            <div className="status">Loading profile...</div>
          ) : user ? (
            <div className="user-block">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Status:</strong> {user.status || 'ACTIVE'}</div>
              <div><strong>Joined:</strong> {formatDate(user.createdAt)}</div>
            </div>
          ) : (
            <div className="status error">No user info</div>
          )}
        </div>

        <div className="card">
          <h2>Upload Resume</h2>
          <form onSubmit={handleUpload}>
            <label htmlFor="resumeFile">PDF or DOCX</label>
            <input
              id="resumeFile"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </form>
        </div>
      </div>

      <div className="cards two" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Your Resumes</h2>
          {loadingResumes ? (
            <div className="status">Loading resumes...</div>
          ) : resumes.length === 0 ? (
            <div className="status">No resumes uploaded yet.</div>
          ) : (
            <div className="resume-list">
              {resumes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`resume-tile ${String(selectedResumeId) === String(r.id) ? 'active' : ''}`}
                  onClick={() => setSelectedResumeId(String(r.id))}
                >
                  <div className="tile-top">
                    <span className="pill pill-ghost">Resume #{r.id}</span>
                    <span className="muted">{formatDate(r.created_at)}</span>
                  </div>
                  <div className="tile-title">Selected file</div>
                  <div className="muted">Tap to use this resume</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Run ATS</h2>
          <label htmlFor="jobDescription">Job Description</label>
          <textarea
            id="jobDescription"
            rows="12"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the JD here"
            className="textarea"
          />
          {jobError && <div className="status error">{jobError}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={handleRunAts} disabled={runningAts}>
              {runningAts ? 'Scoring...' : 'Get ATS Score'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigateTo('interview')} disabled={!selectedResumeId || !jobDescription}>
              Interview Prep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
