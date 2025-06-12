/**
 * Audit Event Types
 */
export type AuditEventType = 
  | 'user.login' 
  | 'user.logout' 
  | 'user.signup'
  | 'user.settings_change'
  | 'agent.chat'
  | 'agent.hire'
  | 'workflow.create'
  | 'workflow.execute'
  | 'integration.connect'
  | 'integration.disconnect'
  | 'api.request'
  | 'security.rate_limit'
  | 'security.auth_failure'

export interface AuditEvent {
  id?: string
  event_type: AuditEventType
  user_id?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export interface AuditContext {
  userId?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * COMPLETELY DISABLED AUDIT LOGGER
 * All methods are no-ops to prevent errors
 */
class AuditLogger {
  private logQueue: AuditEvent[] = []
  private isProcessing = false
  private flushTimer: NodeJS.Timeout | null = null
  private supabaseClient: any = null

  constructor() {
    // COMPLETELY DISABLED - no initialization
    console.log('🔇 Audit logging completely disabled')
  }

  /**
   * DISABLED - Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'created_at'>, context?: AuditContext): Promise<void> {
    // COMPLETELY DISABLED
    console.log(`🔇 Audit event (disabled): ${event.event_type}`)
    return
  }

  /**
   * DISABLED - Start the flush timer
   */
  private startFlushTimer() {
    // COMPLETELY DISABLED
    return
  }

  /**
   * DISABLED - Stop the flush timer
   */
  private stopFlushTimer() {
    // COMPLETELY DISABLED
    return
  }

  /**
   * DISABLED - Flush queued events to database
   */
  private async flush(): Promise<void> {
    // COMPLETELY DISABLED
    return
  }

  /**
   * DISABLED - Get Supabase client
   */
  private getSupabaseClient() {
    // COMPLETELY DISABLED
    return null
  }

  /**
   * DISABLED - Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    // COMPLETELY DISABLED
    return
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

/**
 * DISABLED - Extract audit context from request
 */
export function extractAuditContext(request: Request): AuditContext {
  // COMPLETELY DISABLED
  return {}
} 