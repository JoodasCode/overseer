import { beforeAll, afterAll, afterEach } from 'vitest'

// Test environment variables - use a unique email for each test run
const TEST_USER_EMAIL = `test-${Date.now()}@example.com`
const TEST_USER_PASSWORD = 'test-password-123'

// Global test user
export let testUser: any = null
export let testUserToken: string | null = null

beforeAll(async () => {
  // Create mock test user (no real database operations in tests)
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  testUser = {
    id: mockUserId,
    email: TEST_USER_EMAIL,
  }
  testUserToken = 'mock-jwt-token-for-testing'
})

afterEach(async () => {
  // Mock cleanup - no real database operations needed
})

afterAll(async () => {
  // Mock cleanup - no real database operations needed
}) 