import { describe, it, expect } from 'vitest';

describe('Environment Variables', () => {
  it('should load NEXT_PUBLIC_SUPABASE_URL from .env', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
  });
  it('should load SUPABASE_SERVICE_ROLE_KEY from .env', () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });
  it('should load REDIS_URL from .env', () => {
    expect(process.env.REDIS_URL).toBeDefined();
  });
  it('should load REDIS_TOKEN from .env', () => {
    expect(process.env.REDIS_TOKEN).toBeDefined();
  });
}); 