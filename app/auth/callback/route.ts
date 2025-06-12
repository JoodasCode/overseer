import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    let response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('✅ OAuth callback successful, redirecting to:', next)
        return response
      } else {
        console.error('❌ OAuth callback error:', error)
        return NextResponse.redirect(
          `${origin}/auth/auth-error?error=${encodeURIComponent(error.message)}`
        )
      }
    } catch (error: any) {
      console.error('❌ OAuth callback exception:', error)
      return NextResponse.redirect(
        `${origin}/auth/auth-error?error=${encodeURIComponent(error.message)}`
      )
    }
  }

  // No code parameter, redirect to sign-in
  console.log('❌ No code parameter in OAuth callback')
  return NextResponse.redirect(`${origin}/auth/signin?error=no_code`)
} 