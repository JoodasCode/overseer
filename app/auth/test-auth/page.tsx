'use client';

import { useAuth } from '@/lib/auth/supabase-auth-provider';
import { useState } from 'react';

export default function TestAuthPage() {
  const { user, session, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    setMessage('Signing up...');
    const { error } = await signUp(email, password);
    if (error) {
      setMessage(`Sign up error: ${error.message}`);
    } else {
      setMessage('Sign up successful! Check your email for confirmation.');
    }
  };

  const handleSignIn = async () => {
    setMessage('Signing in...');
    const { error } = await signIn(email, password);
    if (error) {
      setMessage(`Sign in error: ${error.message}`);
    } else {
      setMessage('Sign in successful!');
    }
  };

  const handleSignOut = async () => {
    setMessage('Signing out...');
    await signOut();
    setMessage('Signed out successfully!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Authentication Test Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>Auth State</h3>
        <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
        <p><strong>User:</strong> {user ? user.email : 'null'}</p>
        <p><strong>Session:</strong> {session ? 'exists' : 'null'}</p>
        <p><strong>Token:</strong> {session?.access_token ? 'present' : 'none'}</p>
      </div>

      {!user && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Test Authentication</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
          <div>
            <button onClick={handleSignUp} style={{ marginRight: '10px', padding: '10px' }}>
              Sign Up
            </button>
            <button onClick={handleSignIn} style={{ padding: '10px' }}>
              Sign In
            </button>
          </div>
        </div>
      )}

      {user && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Welcome, {user.email}!</h3>
          <button onClick={handleSignOut} style={{ padding: '10px' }}>
            Sign Out
          </button>
        </div>
      )}

      {message && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: message.includes('error') ? '#ffebee' : '#e8f5e8',
          color: message.includes('error') ? '#c62828' : '#2e7d32',
          marginTop: '20px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <h4>Debug Info</h4>
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
        <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
      </div>
    </div>
  );
} 