/**
 * Legacy auth compatibility layer
 * This file provides compatibility for files that expect NextAuth authOptions
 * In our Supabase-based system, we don't use NextAuth, but some files still reference it
 */

// Mock authOptions for compatibility
export const authOptions = {
  providers: [],
  callbacks: {},
  pages: {},
};

export default authOptions; 