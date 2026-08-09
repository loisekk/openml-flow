import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../modules/auth/authStore';

export default function TopNav() {
  const { token, username, logout, openModal } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 24px', background: '#111', borderBottom: '1px solid #333', boxSizing: 'border-box', position: 'relative', zIndex: 100 }}>
      
      {/* Logo / Home Button */}
      <div style={{ fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ff8c1a', borderRadius: '50%', marginRight: '10px' }}></span>
        open-mlpipe <span style={{ color: '#666', fontWeight: 400, fontSize: '12px', marginLeft: '8px' }}>LOCAL RUNTIME</span>
      </div>
      
      {/* Main Nav Link */}
      <div style={{ marginLeft: '40px', display: 'flex', gap: '20px' }}>
        <Link to="/dashboard" style={{ color: '#fff', cursor: 'pointer', fontSize: '14px', textDecoration: 'none' }}>Dashboard</Link>
      </div>

      {/* Auth Section */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
        {token && username ? (
          <>
            <span style={{ color: '#888', fontSize: '14px' }}>👋 {username}</span>
            <button 
              onClick={logout} 
              style={{ background: '#161616', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Logout
            </button>
          </>
        ) : (
          <button 
            onClick={openModal} 
            style={{ background: '#ff8c1a', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            Login / Register
          </button>
        )}
      </div>
    </nav>
  );
}