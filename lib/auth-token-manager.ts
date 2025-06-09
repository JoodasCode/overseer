import { createClient } from '@supabase/supabase-js'

// Create Supabase client for auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

class AuthTokenManager {
  private static instance: AuthTokenManager
  private currentToken: string | null = null
  private tokenPromise: Promise<string | null> | null = null

  private constructor() {
    // Listen for auth changes and update token
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentToken = session?.access_token || null
      console.log('🔑 Auth token updated:', this.currentToken ? 'Present' : 'None')
    })
  }

  static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager()
    }
    return AuthTokenManager.instance
  }

  async getToken(): Promise<string | null> {
    // If we have a current token, return it immediately
    if (this.currentToken) {
      return this.currentToken
    }

    // If we're already fetching a token, wait for that promise
    if (this.tokenPromise) {
      return this.tokenPromise
    }

    // Fetch the token
    this.tokenPromise = this.fetchToken()
    const token = await this.tokenPromise
    this.tokenPromise = null
    return token
  }

  private async fetchToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      this.currentToken = session?.access_token || null
      return this.currentToken
    } catch (error) {
      console.warn('Failed to get auth token:', error)
      return null
    }
  }

  // Force refresh the token
  async refreshToken(): Promise<string | null> {
    this.currentToken = null
    this.tokenPromise = null
    return this.getToken()
  }
}

export const authTokenManager = AuthTokenManager.getInstance() 