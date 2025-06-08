# Testing Guide

This document explains the testing strategy for Overseer, including how we use mocks and real APIs, and how the backend and frontend are integrated.

## Test Strategy Overview

We use two main types of tests:

### 1. Unit Tests (with Mocks)
- **Purpose:** Fast, reliable, and safe tests that simulate external APIs and services.
- **How:** Use `vi.mock` and `vi.fn` to replace real API calls with fake responses.
- **When:** Run on every code change, in CI, and for most backend logic.

### 2. Integration Tests (with Real APIs)
- **Purpose:** Ensure our code works with real external services and credentials.
- **How:** Use real API tokens from `.env.local` and make real network requests.
- **When:** Run before major releases, or on demand, to verify end-to-end integration.

## Summary Table

| Stage         | Backend         | Frontend         | APIs Used      |
|---------------|----------------|------------------|----------------|
| Dev/Testing   | Mocks + Real   | Mocks            | Mock           |
| Integration   | Real           | Real             | Real           |
| Production    | Real           | Real             | Real           |

## Step-by-Step Workflow

### Technical Steps
1. **Backend:**
   - Write unit tests with mocks for all adapters and services.
   - Add integration tests for real APIs (Gmail, Notion, Slack, Asana, Monday.com).
   - Ensure all environment variables are loaded and checked.
2. **Frontend:**
   - Start with mock API responses for fast UI development.
   - Switch to real backend API once UI is stable.
   - Run end-to-end tests to verify full stack.

### Layman's Terms
- We first test the backend by pretending to talk to other services (like Gmail or Slack) to make sure our code works fast and safely.
- Then, we run a few tests that actually talk to the real services, to make sure everything works for real.
- On the frontend, we start by pretending to get data from the backend so we can build the screens quickly.
- Once the screens look good, we connect them to the real backend and make sure everything works together.
- In production, everything uses the real services and data.

## Running Tests

To run all unit tests:
```sh
pnpm test
```

To run integration tests (with real APIs):
```sh
pnpm test:integration
```

## Interpreting Results
- All tests should pass if your environment is set up correctly.
- If a test fails due to a missing environment variable, check your `.env.local` file for typos or missing values.
- For integration tests, ensure your Supabase and Redis services are running and accessible.

## Troubleshooting
- If environment variables are not being picked up, ensure there are no spaces around the `=` and the file is saved in the project root.
- If you add new environment variables, restart your test runner.

---

For more details, see comments in the test files themselves. 