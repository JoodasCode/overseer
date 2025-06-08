declare module '@/lib/auth' {
  import { Session } from 'next-auth';
  import { NextAuthOptions } from 'next-auth';
  
  /**
   * NextAuth options configuration
   */
  export const authOptions: NextAuthOptions;
  
  /**
   * Get the user ID from a session
   */
  export function getUserId(session: Session | null): string | null;
  
  /**
   * Check if the user is an admin
   */
  export function isUserAdmin(session: Session | null): boolean;
  
  /**
   * Get the user's organization ID
   */
  export function getUserOrgId(session: Session | null): string | null;
  
  /**
   * Check if the user has a specific role
   */
  export function hasRole(session: Session | null, role: string): boolean;
}
