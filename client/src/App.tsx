import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './modules/auth/authStore';
import AuthModal from './modules/auth/AuthModal';
import Dashboard from './modules/dashboard/Dashboard';
import UltimateWorkspace from './modules/workspace/UltimateWorkspace';
import Settings from './modules/settings/Settings';
import Datasets from './modules/datasets/Datasets'; // <-- IMPORT DATASETS

const AppLayout = () => {
  const { token, initAuth } = useAuthStore();
  const location = useLocation();
  
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <div style={{ background: '#050A14', height: '100%' }} />} />
          <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/workspace/:id" element={token ? <UltimateWorkspace /> : <Navigate to="/login" />} />
          <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/datasets" element={token ? <Datasets /> : <Navigate to="/login" />} /> {/* <-- ADD ROUTE */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}