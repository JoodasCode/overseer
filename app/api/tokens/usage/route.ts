import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tokens/usage
 * Returns current token usage for authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get token usage - try function first, fallback to direct query
    let usage
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_token_usage', { p_user_id: user.id })
      .single()

    if (functionError) {
      console.log('📝 Function not available, using direct query:', functionError.message)
      
      // Fallback to direct query
      const { data: tokenData, error: queryError } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (queryError && queryError.code !== 'PGRST116') {
        console.error('❌ Error fetching token usage:', queryError)
        return NextResponse.json(
          { error: 'Failed to fetch token usage' },
          { status: 500 }
        )
      }

      // Initialize user if no record exists
      if (!tokenData) {
        const { data: newTokenData, error: insertError } = await supabase
          .from('user_tokens')
          .insert({
            user_id: user.id,
            tokens_used: 0,
            token_quota: 500,
            reset_period: 'monthly'
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ Error creating token record:', insertError)
          return NextResponse.json(
            { error: 'Failed to initialize token usage' },
            { status: 500 }
          )
        }

        usage = {
          tokens_used: 0,
          token_quota: 500,
          tokens_remaining: 500,
          reset_period: 'monthly',
          last_reset: new Date().toISOString()
        }
      } else {
        usage = {
          tokens_used: tokenData.tokens_used,
          token_quota: tokenData.token_quota,
          tokens_remaining: tokenData.token_quota - tokenData.tokens_used,
          reset_period: tokenData.reset_period,
          last_reset: tokenData.last_reset
        }
      }
    } else {
      usage = functionResult
    }

    return NextResponse.json(usage)

  } catch (error) {
    console.error('❌ Token usage API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 