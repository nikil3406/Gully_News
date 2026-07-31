import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      alert('Registered successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #e7e5e4',
    borderRadius: 11,
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    color: '#0f172a',
    background: '#fafaf9',
    outline: 'none',
    transition: 'all 0.18s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 6,
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = '#0f172a';
    e.target.style.background = '#fff';
    e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.06)';
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = '#e7e5e4';
    e.target.style.background = '#fafaf9';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #fafaf9 0%, #fef9ee 50%, #fafaf9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52,
            background: '#0f172a',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 20px rgba(15,23,42,0.18)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#fbbf24" strokeWidth="1.8"/>
              <path d="M7 9h10M7 12h7M7 15h5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px' }}>
            Gully <span style={{ color: '#d97706' }}>News</span>
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Join your local community
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e7e5e4',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04)',
        }}>
          <h2 style={{
            margin: '0 0 4px',
            fontSize: 20,
            fontWeight: 800,
            color: '#0f172a',
            textAlign: 'center',
            letterSpacing: '-0.4px',
          }}>
            Create account
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            Start reporting local stories today
          </p>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Username */}
            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                placeholder="your_handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', display: 'flex', padding: 2,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p style={{ margin: '5px 0 0', fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                  Use at least 8 characters
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#94a3b8' : '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: 11,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s',
                boxShadow: loading ? 'none' : '0 2px 10px rgba(217,119,6,0.28)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#b45309'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(217,119,6,0.36)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(217,119,6,0.28)'; } }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.75s linear infinite',
                    display: 'inline-block',
                  }} />
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #f5f4f2', marginTop: 22, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  fontWeight: 700, color: '#d97706',
                  textDecoration: 'none',
                  borderBottom: '1.5px solid #fde68a',
                  paddingBottom: 1,
                  transition: 'color 0.18s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#b45309'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#d97706'}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust note */}
        <p style={{
          textAlign: 'center',
          margin: '16px 0 0',
          fontSize: 11,
          color: '#94a3b8',
          fontFamily: 'var(--font-sans)',
        }}>
          Free forever · No spam · Local community only
        </p>
      </div>
    </div>
  );
}

export default Register;