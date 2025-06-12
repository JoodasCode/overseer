import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { withSecurity } from '@/lib/middleware/cors-config'
import { PRICING_PLANS, getTokenQuotaByPlan } from '@/lib/constants/pricing'

/**
 * GET /api/tokens/usage
 * Returns current token usage for authenticated user
 * Supports both cookie-based and Bearer token authentication
 */
async function handleTokenUsage(request: NextRequest): Promise<NextResponse> {
  try {
    let user = null
    let supabase = null

    // Try Bearer token authentication first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Create client with Bearer token
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      )
      
      const { data: { user: bearerUser }, error: bearerError } = await supabase.auth.getUser(token)
      if (bearerUser && !bearerError) {
        user = bearerUser
        console.log('Token usage API: Authenticated via Bearer token:', user.id)
      }
    }
    
    // Fallback to cookie-based authentication
    if (!user) {
      try {
        supabase = await createServerClient()
        const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
        if (cookieUser && !cookieError) {
          user = cookieUser
          console.log('Token usage API: Authenticated via cookies:', user.id)
        }
      } catch (cookieErr) {
        console.log('Cookie auth failed:', cookieErr)
      }
    }
    
    if (!user) {
      console.log('Token usage API: No authenticated user')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!supabase) {
      console.error('Token usage API: No Supabase client available')
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    console.log('Token usage API: Authenticated user:', user.id, user.email)

    // Get token usage from user_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no token record exists, create one with default values
    if (tokenError && tokenError.code === 'PGRST116') {
      console.log('Creating new token record for user:', user.id)
      
      const defaultQuota = PRICING_PLANS.FREE.tokenQuota
      const tokenRecord = {
        user_id: user.id,
        tokens_used: 0,
        token_quota: defaultQuota,
        reset_period: 'monthly',
        last_reset: new Date().toISOString()
      }

      const { data: newTokenData, error: insertError } = await supabase
        .from('user_tokens')
        .insert(tokenRecord)
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create token record:', insertError)
        return NextResponse.json(
          { error: 'Failed to initialize token usage' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        tokensUsed: 0,
        tokenQuota: defaultQuota,
        tokensRemaining: defaultQuota,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionPlan: 'FREE'
      })
    }

    if (tokenError) {
      console.error('Error fetching token usage:', tokenError)
      return NextResponse.json(
        { error: 'Failed to fetch token usage' },
        { status: 500 }
      )
    }

    // Calculate reset date (monthly)
    const lastReset = new Date(tokenData.last_reset)
    const nextReset = new Date(lastReset)
    nextReset.setMonth(nextReset.getMonth() + 1)

    // Get user billing info for subscription plan
    const { data: billingData } = await supabase
      .from('user_billing')
      .select('plan_type')
      .eq('user_id', user.id)
      .single()

    const subscriptionPlan = billingData?.plan_type || 'FREE'

    return NextResponse.json({
      tokensUsed: tokenData.tokens_used || 0,
      tokenQuota: tokenData.token_quota || PRICING_PLANS.FREE.tokenQuota,
      tokensRemaining: (tokenData.token_quota || PRICING_PLANS.FREE.tokenQuota) - (tokenData.tokens_used || 0),
      resetDate: nextReset.toISOString(),
      subscriptionPlan: subscriptionPlan.toUpperCase()
    })

  } catch (error) {
    console.error('Token usage API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withSecurity(handleTokenUsage) 