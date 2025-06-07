# Overseer CI/CD Pipeline

This directory contains GitHub Actions workflows for continuous integration and deployment of the Overseer backend.

## CI Workflow (`ci.yml`)

The CI workflow runs automatically on:
- Push to `main` and `develop` branches
- Pull requests targeting `main` and `develop` branches

### What it does

1. **Test Job**:
   - Sets up Node.js environment
   - Installs dependencies
   - Runs linting checks
   - Runs all tests with Vitest

2. **Build Job** (only on push to main/develop):
   - Builds the Next.js application
   - Verifies that the build process completes successfully

### Required Secrets

The following secrets need to be configured in your GitHub repository:

- `DATABASE_URL`: Connection string for your Prisma database
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each of the required secrets listed above

## Local Development

To run the same checks locally before pushing:

```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Run tests
npm test

# Build the application
npm run build
```

## Future Enhancements

- Add deployment workflow for staging/production environments
- Add code coverage reporting
- Add security scanning
- Add performance testing
