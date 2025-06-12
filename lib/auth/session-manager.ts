import { createClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'

export interface SessionState {
  session: Session | null
  user: User | null
  isExpired: boolean
  expiresAt: number | null
  refreshing: boolean
}

export class SessionManager {
  private static instance: SessionManager
  private supabase = createClient()
  private refreshTimer: NodeJS.Timeout | null = null
  private listeners: Array<(state: SessionState) => void> = []
  private currentState: SessionState = {
    session: null,
    user: null,
    isExpired: false,
    expiresAt: null,
    refreshing: false
  }

  private constructor() {
    this.initializeSession()
    this.setupAuthListener()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Subscribe to session state changes
   */
  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.push(listener)
    
    // Immediately call with current state
    listener(this.currentState)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.currentState }
  }

  /**
   * Manually refresh the session
   */
  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    if (this.currentState.refreshing) {
      return { success: false, error: 'Refresh already in progress' }
    }

    try {
      this.updateState({ refreshing: true })
      
      const { data, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        console.error('🔄 Session refresh failed:', error.message)
        this.updateState({ 
          refreshing: false,
          isExpired: true 
        })
        return { success: false, error: error.message }
      }

      if (data.session) {
        console.log('✅ Session refreshed successfully')
        this.handleSessionUpdate(data.session)
        return { success: true }
      }

      return { success: false, error: 'No session returned' }
      
    } catch (error) {
      console.error('🔄 Session refresh exception:', error)
      this.updateState({ 
        refreshing: false,
        isExpired: true 
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Sign out and clear session
   */
  async signOut(): Promise<void> {
    this.clearRefreshTimer()
    
    try {
      await this.supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
    
    this.updateState({
      session: null,
      user: null,
      isExpired: false,
      expiresAt: null,
      refreshing: false
    })
  }

  /**
   * Check if session is close to expiring (within 5 minutes)
   */
  isSessionExpiringSoon(): boolean {
    if (!this.currentState.expiresAt) return false
    
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() + fiveMinutes >= this.currentState.expiresAt
  }

  private async initializeSession(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Failed to get initial session:', error)
        return
      }

      if (session) {
        this.handleSessionUpdate(session)
      }
    } catch (error) {
      console.error('Session initialization error:', error)
    }
  }

  private setupAuthListener(): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Session manager auth event:', event)
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        this.handleSessionUpdate(session)
      }
    })
  }

  private handleSessionUpdate(session: Session | null): void {
    this.clearRefreshTimer()
    
    if (session) {
      const expiresAt = session.expires_at ? session.expires_at * 1000 : null
      const isExpired = expiresAt ? Date.now() >= expiresAt : false
      
      this.updateState({
        session,
        user: session.user,
        isExpired,
        expiresAt,
        refreshing: false
      })
      
      // Schedule refresh 5 minutes before expiry
      if (expiresAt && !isExpired) {
        this.scheduleRefresh(expiresAt)
      }
    } else {
      this.updateState({
        session: null,
        user: null,
        isExpired: false,
        expiresAt: null,
        refreshing: false
      })
    }
  }

  private scheduleRefresh(expiresAt: number): void {
    const fiveMinutes = 5 * 60 * 1000
    const refreshTime = expiresAt - fiveMinutes
    const delay = Math.max(0, refreshTime - Date.now())
    
    console.log(`🔄 Scheduling session refresh in ${Math.round(delay / 1000)} seconds`)
    
    this.refreshTimer = setTimeout(async () => {
      console.log('🔄 Auto-refreshing session...')
      await this.refreshSession()
    }, delay)
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  private updateState(updates: Partial<SessionState>): void {
    this.currentState = { ...this.currentState, ...updates }
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState)
      } catch (error) {
        console.error('Session listener error:', error)
      }
    })
  }
} 