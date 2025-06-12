'use client';

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/supabase-auth-provider'

export default function AuthDebugPage() {
  const { user, session, loading } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])

  const runTests = async () => {
    const results = []

    // Test 1: Check session state
    const sessionCheck = await supabase.auth.getSession()
    results.push({
      test: 'Session Check',
      status: sessionCheck.data.session ? '✅ PASS' : '❌ FAIL',
      data: {
        hasSession: !!sessionCheck.data.session,
        userId: sessionCheck.data.session?.user?.id,
        accessToken: sessionCheck.data.session?.access_token ? `${sessionCheck.data.session.access_token.substring(0, 20)}...` : null
      }
    })

    // Test 2: Check API authentication
    if (sessionCheck.data.session) {
      try {
        const response = await fetch('/api/agents', {
          headers: {
            'Authorization': `Bearer ${sessionCheck.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        results.push({
          test: 'Agents API Call',
          status: response.ok ? '✅ PASS' : '❌ FAIL',
          data: {
            status: response.status,
            authenticated: response.status !== 401
          }
        })
      } catch (error) {
        results.push({
          test: 'Agents API Call',
          status: '❌ ERROR',
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
      }
    }

    // Test 3: Check RLS isolation
    if (sessionCheck.data.session) {
      try {
        const { data: userAgents, error } = await supabase
          .from('portal_agents')
          .select('id, name, user_id')
          .eq('user_id', sessionCheck.data.session.user.id)

        results.push({
          test: 'RLS Agent Isolation',
          status: !error ? '✅ PASS' : '❌ FAIL',
          data: {
            userAgentCount: userAgents?.length || 0,
            userAgents: userAgents?.map(a => ({ id: a.id, name: a.name })) || [],
            error: error?.message
          }
        })
      } catch (error) {
        results.push({
          test: 'RLS Agent Isolation',
          status: '❌ ERROR',
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
      }
    }

    // Test 4: Check chat message isolation
    if (sessionCheck.data.session) {
      try {
        const { data: userMessages, error } = await supabase
          .from('portal_agent_logs')
          .select('id, user_id, agent_id, role, message')
          .eq('user_id', sessionCheck.data.session.user.id)
          .limit(5)

        results.push({
          test: 'RLS Chat Message Isolation',
          status: !error ? '✅ PASS' : '❌ FAIL',
          data: {
            messageCount: userMessages?.length || 0,
            messages: userMessages?.map(m => ({ 
              id: m.id, 
              role: m.role, 
              preview: m.message.substring(0, 30) + '...' 
            })) || [],
            error: error?.message
          }
        })
      } catch (error) {
        results.push({
          test: 'RLS Chat Message Isolation',
          status: '❌ ERROR',
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
      }
    }

    setTestResults(results)
  }

  useEffect(() => {
    if (!loading && user) {
      runTests()
    }
  }, [loading, user])

  const clearAppState = () => {
    // Clear localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('chat-') || 
        key.startsWith('agents-') || 
        key.startsWith('messages-')
      )) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    alert(`Cleared ${keysToRemove.length} localStorage keys`)
  }

  if (loading) {
    return <div className="p-8">Loading auth state...</div>
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Auth Debug - Not Authenticated</h1>
        <p>Please sign in to test authentication and data isolation.</p>
        <a href="/auth/signin" className="text-blue-500 underline">Go to Sign In</a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔐 Authentication & Data Isolation Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Current User Info</h2>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Provider:</strong> {user.app_metadata?.provider}</p>
        <p><strong>Session:</strong> {session ? '✅ Active' : '❌ None'}</p>
      </div>

      <div className="mb-6">
        <button 
          onClick={runTests}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          🔄 Run Tests
        </button>
        <button 
          onClick={clearAppState}
          className="bg-orange-500 text-white px-4 py-2 rounded mr-4"
        >
          🧹 Clear App State
        </button>
        <a 
          href="/auth/signin"
          className="bg-green-500 text-white px-4 py-2 rounded inline-block"
        >
          🔄 Switch User
        </a>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              {result.status} {result.test}
            </h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🧪 Manual Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Run tests as User A - note the agent count and message count</li>
          <li>Click "Switch User" and sign in as User B</li>
          <li>Run tests again - should see DIFFERENT agents and messages</li>
          <li>If you see the same data, there's still cross-contamination!</li>
        </ol>
      </div>
    </div>
  )
} 