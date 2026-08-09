// client/src/modules/auth/AuthModal.tsx
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './authStore';

export default function AuthModal() {
  const { login, register, isModalOpen, closeModal, openModal } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If we are on the /login route, force the modal open
  useEffect(() => {
    if (location.pathname === '/login') {
      openModal();
    }
  }, [location.pathname, openModal]);

  // If the modal isn't open, render nothing.
  if (!isModalOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'login') {
      const success = await login(username, password);
      if (success) {
        closeModal();
        navigate('/dashboard');
      } else {
        setError('Invalid username or password.');
      }
    } else {
      const success = await register(username, password);
      if (success) {
        alert('Account created! Please login.');
        setTab('login');
      } else {
        setError('Username already exists.');
      }
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }} onClick={handleClose}>
      <div style={{ background: '#161616', border: '1px solid #333', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '32px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid #333' }}>
          <button onClick={() => setTab('login')} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: tab === 'login' ? '#ff8c1a' : '#666', borderBottom: tab === 'login' ? '2px solid #ff8c1a' : 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>Login</button>
          <button onClick={() => setTab('register')} style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: tab === 'register' ? '#ff8c1a' : '#666', borderBottom: tab === 'register' ? '2px solid #ff8c1a' : 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '24px', margin: 0 }}>{tab === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '12px 16px', background: '#0d0d0d', border: '1px solid #333', color: '#fff', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px 16px', background: '#0d0d0d', border: '1px solid #333', color: '#fff', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }} />
          {error && <p style={{ color: '#ff5050', fontSize: '12px', margin: 0 }}>{error}</p>}
          <button type="submit" style={{ padding: '12px', background: '#ff8c1a', color: '#000', fontWeight: 700, border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>{tab === 'login' ? 'Login' : 'Register'}</button>
        </form>
      </div>
    </div>
  );
}