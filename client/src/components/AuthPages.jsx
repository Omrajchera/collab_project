import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AuthPages = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
        setSuccess('Registration successful! Welcome to your collaboration dashboard.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {isLogin 
              ? 'Enter credentials to access your collaborative projects' 
              : 'Sign up to create projects, assign tasks, and track statuses'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1.25rem' }} 
            disabled={loading}
          >
            {loading ? (
              <span>Syncing...</span>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Register Account</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {isLogin ? "New to CollabHub? " : 'Already registered? '}
          <button 
            type="button"
            onClick={toggleMode} 
            className="btn-text" 
            style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
          >
            {isLogin ? 'Create an account' : 'Log in here'}
          </button>
        </div>
      </div>
    </div>
  );
};
