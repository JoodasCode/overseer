import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Session API called')
    
    // Get all headers
    const headers = Object.fromEntries(request.headers.entries())
    
    // Check for authorization header
    const authHeader = request.headers.get('authorization')
    
    console.log('📋 Request headers:', {
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? `${authHeader.substring(0, 30)}...` : 'null',
      cookieHeader: headers.cookie ? `${headers.cookie.substring(0, 100)}...` : 'null'
    })
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'No authorization header',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderValue: authHeader || 'null',
          allHeaders: headers
        }
      }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    console.log('🔑 Token length:', token.length)
    
    // Try to validate the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Token validation failed',
        debug: {
          authError: authError?.message,
          hasUser: !!user,
          tokenLength: token.length,
          tokenStart: token.substring(0, 20)
        }
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      debug: {
        tokenLength: token.length,
        tokenValid: true
      }
    })
    
  } catch (error) {
    console.error('❌ Debug session error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 