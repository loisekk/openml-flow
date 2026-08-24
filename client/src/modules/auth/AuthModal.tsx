// client/src/modules/auth/AuthModal.tsx
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './authStore';

const FONT = 'JetBrains Mono, monospace';

export default function AuthModal() {
  const { login, register, isModalOpen, closeModal, openModal } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  // If we are on the /login route, force the modal open
  useEffect(() => {
    if (location.pathname === '/login') {
      openModal();
    }
  }, [location.pathname, openModal]);

  // If the modal isn't open, render nothing.
  if (!isModalOpen) return null;

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setSubmitting(true);
    try {
      if (tab === 'login') {
        const err = await login(username, password); // null = success
        if (err === null) {
          closeModal();
          navigate('/dashboard');
        } else {
          setError(err);
        }
      } else {
        const err = await register(username, password); // null = success
        if (err === null) {
          alert('Account created! Please login.');
          switchTab('login');
        } else {
          setError(err);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    closeModal();
    // If they close the modal while on the login page, send them home
    if (location.pathname === '/login') {
      navigate('/');
    }
  };

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5,11,24,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        style={{ background: '#0A1426', border: '1px solid #18253A', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '32px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#65758C', fontSize: '24px', cursor: 'pointer' }}>&times;</button>

        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid #18253A' }}>
          <button onClick={() => switchTab('login')} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: tab === 'login' ? '#FF7A00' : '#65758C', borderBottom: tab === 'login' ? '2px solid #FF7A00' : 'none', cursor: 'pointer', fontFamily: FONT }}>Login</button>
          <button onClick={() => switchTab('register')} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: tab === 'register' ? '#FF7A00' : '#65758C', borderBottom: tab === 'register' ? '2px solid #FF7A00' : 'none', cursor: 'pointer', fontFamily: FONT }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '24px', margin: 0, color: '#F4F7FB' }}>{tab === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '12px 16px', background: '#050B18', border: '1px solid #18253A', color: '#F4F7FB', borderRadius: '6px', fontFamily: FONT, fontSize: '14px', outline: 'none' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px 16px', background: '#050B18', border: '1px solid #18253A', color: '#F4F7FB', borderRadius: '6px', fontFamily: FONT, fontSize: '14px', outline: 'none' }} />
          {error && <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={isSubmitting} style={{ padding: '12px', background: '#FF7A00', color: '#000', fontWeight: 700, border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'default' : 'pointer', fontFamily: FONT, fontSize: '14px', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? (tab === 'login' ? 'Logging in...' : 'Creating...') : tab === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}