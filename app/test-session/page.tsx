'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export default function TestSessionPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    async function testSession() {
      try {
        console.log('🔍 Testing session retrieval...');
        
        // Get cookies
        const cookieString = document.cookie;
        setCookies(cookieString);
        console.log('🍪 Document cookies length:', cookieString.length);
        console.log('🍪 Cookie preview:', cookieString.substring(0, 500) + '...');
        
        // Test chunked cookie parsing
        const authTokenCookies = document.cookie
          .split('; ')
          .filter(cookie => cookie.startsWith('sb-rxchyyxsipdopwpwnxku-auth-token'));
        
        console.log('🔧 Auth token cookies found:', authTokenCookies.length);
        authTokenCookies.forEach((cookie, index) => {
          const [name] = cookie.split('=');
          console.log(`  ${index}: ${name}`);
        });
        
        // Test session retrieval
        console.log('📡 Calling supabase.auth.getSession()...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('📋 Session result:', {
          hasSession: !!session,
          sessionError: sessionError?.message,
          userId: session?.user?.id,
          accessToken: session?.access_token ? `${session.access_token.substring(0, 20)}...` : null,
          tokenLength: session?.access_token?.length,
          expiresAt: session?.expires_at
        });
        
        if (sessionError) {
          setError(sessionError.message);
        } else {
          setSession(session);
          setUser(session?.user || null);
        }
        
        // Test user retrieval
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        console.log('👤 User result:', {
          hasUser: !!currentUser,
          userError: userError?.message,
          userId: currentUser?.id,
          email: currentUser?.email
        });
        
      } catch (err) {
        console.error('❌ Session test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    testSession();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Session Test</h1>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Test Results</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Session Status</h2>
          <p>Has Session: {session ? '✅ Yes' : '❌ No'}</p>
          {session && (
            <div className="ml-4 mt-2">
              <p>User ID: {session.user?.id}</p>
              <p>Email: {session.user?.email}</p>
              <p>Access Token: {session.access_token ? `${session.access_token.substring(0, 20)}...` : 'None'}</p>
              <p>Expires At: {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">User Status</h2>
          <p>Has User: {user ? '✅ Yes' : '❌ No'}</p>
          {user && (
            <div className="ml-4 mt-2">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Last Sign In: {user.last_sign_in_at}</p>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Cookies</h2>
          <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
            {cookies || 'No cookies found'}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Actions</h2>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 