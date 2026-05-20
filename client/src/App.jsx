import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPages } from './components/AuthPages';
import { Dashboard } from './components/Dashboard';
import { ProjectBoard } from './components/ProjectBoard';
import { LogOut, Home, User } from 'lucide-react';

const Navigation = ({ onBackToDashboard }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <a 
        href="#" 
        className="nav-brand" 
        onClick={(e) => { e.preventDefault(); onBackToDashboard(); }}
      >
        🚀 CollabHub
      </a>

      <div className="nav-links">
        <button 
          type="button"
          className="btn-text nav-link active" 
          onClick={onBackToDashboard}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none' }}
        >
          <Home size={16} />
          <span>Dashboard</span>
        </button>
      </div>

      <div className="nav-profile">
        <span 
          style={{ 
            fontSize: '0.9rem', 
            color: 'var(--text-main)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem',
            marginRight: '0.5rem' 
          }}
        >
          <User size={15} style={{ color: 'var(--secondary)' }} />
          <strong>{user?.name}</strong>
        </span>
        <button 
          type="button"
          className="btn btn-secondary" 
          onClick={logout} 
          style={{ 
            padding: '0.45rem 0.85rem', 
            fontSize: '0.8rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem' 
          }}
        >
          <LogOut size={13} />
          <span>Log Out</span>
        </button>
      </div>
    </nav>
  );
};

const MainAppContent = () => {
  const { token, loading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', 
          backgroundColor: 'var(--bg-main)', 
          color: 'var(--text-muted)' 
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-header)', fontWeight: 550, marginBottom: '0.5rem' }}>
          Establishing secure link...
        </h2>
        <p style={{ fontSize: '0.85rem' }}>Checking authorization credentials</p>
      </div>
    );
  }

  // Enforce authentication lock
  if (!token) {
    return <AuthPages />;
  }

  return (
    <div className="app-container">
      <Navigation onBackToDashboard={() => setSelectedProjectId(null)} />
      {selectedProjectId ? (
        <ProjectBoard 
          projectId={selectedProjectId} 
          onBack={() => setSelectedProjectId(null)} 
        />
      ) : (
        <Dashboard 
          onSelectProject={(id) => setSelectedProjectId(id)} 
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
