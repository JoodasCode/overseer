import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLogger } from '@/lib/audit/audit-logger'
import { PRICING_PLANS, DEFAULT_PLAN, DEFAULT_TOKEN_QUOTA } from '@/lib/constants/pricing'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      await auditLogger.log({
        event_type: 'api.unauthorized_access',
        severity: 'medium',
        details: { error: 'Unauthorized access to init-user-plan', authError }
      })
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has plan records
    const { data: existingTokens } = await supabase
      .from('user_tokens')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const { data: existingBilling } = await supabase
      .from('user_billing')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // If user already has plans, return success
    if (existingTokens && existingBilling) {
      await auditLogger.log({
        event_type: 'user.settings_change',
        severity: 'low',
        user_id: user.id,
        user_email: user.email,
        details: { message: 'User already has plan records' }
      })

      return NextResponse.json({ 
        success: true, 
        message: 'User already has plan assigned',
        plan: 'FREE'
      })
    }

    // Initialize user plans
    const promises = []

    // Create user_tokens record if it doesn't exist
    if (!existingTokens) {
      promises.push(
        supabase
          .from('user_tokens')
          .insert({
            user_id: user.id,
            tokens_used: 0,
            token_quota: DEFAULT_TOKEN_QUOTA, // Free plan gets 20 tokens
            subscription_plan: DEFAULT_PLAN,
            reset_period: 'monthly'
          })
      )
    }

    // Create user_billing record if it doesn't exist
    if (!existingBilling) {
      promises.push(
        supabase
          .from('user_billing')
          .insert({
            user_id: user.id,
            subscription_plan: 'FREE',
            auto_renew: false,
            billing_email: user.email
          })
      )
    }

    // Execute all insertions
    const results = await Promise.all(promises)
    
    // Check for errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('❌ Error initializing user plans:', errors)
      
      await auditLogger.log({
        event_type: 'system.error',
        severity: 'high',
        user_id: user.id,
        user_email: user.email,
        details: { errors: errors.map(e => e.error) }
      })

      return NextResponse.json(
        { error: 'Failed to initialize user plan' },
        { status: 500 }
      )
    }

    await auditLogger.log({
      event_type: 'user.settings_change',
      severity: 'low',
      user_id: user.id,
      user_email: user.email,
      details: { 
        plan: 'FREE',
        tokenQuota: 20,
        createdRecords: promises.length
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User plan initialized successfully',
      plan: 'FREE',
      tokenQuota: 20
    })

  } catch (error) {
    console.error('❌ Error in init-user-plan:', error)
    
    await auditLogger.log({
      event_type: 'api.server_error',
      severity: 'high',
      details: { 
        endpoint: '/api/auth/init-user-plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 