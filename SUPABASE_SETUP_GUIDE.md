# Overseer Supabase Setup Guide

This guide provides step-by-step instructions for setting up the Overseer database schema in Supabase.

## Prerequisites

- A Supabase account and project
- Access to the Supabase dashboard
- The Overseer codebase cloned locally

## Step 1: Access Your Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com) and sign in
2. Select your Overseer project from the dashboard

## Step 2: Apply the Database Schema

1. In the Supabase dashboard, navigate to the **SQL Editor** section
2. Create a new query or use an existing one
3. Open the SQL schema file from your local project:
   ```
   /Users/ahassan/Downloads/Overseer/prisma/schema.sql
   ```
4. Copy the entire contents of this file
5. Paste it into the SQL Editor in Supabase
6. Click **Run** to execute the SQL and create all tables and relationships

## Step 3: Verify Table Creation

1. In the Supabase dashboard, go to the **Table Editor** section
2. You should see the following tables:
   - User
   - Agent
   - AgentMemory
   - MemoryLog
   - Task
   - ChatMessage
   - Workflow
   - WorkflowExecution
   - ErrorLog
   - Integration
   - KnowledgeBase

## Step 4: Update Environment Variables

1. Make sure your local `.env` file has the correct Supabase URL and API keys
2. You can find these values in the Supabase dashboard under **Project Settings** > **API**
3. Copy the URL and the `anon` key (public)
4. Update your `.env` file with these values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   DATABASE_URL=postgresql://postgres:your_db_password@db.your_supabase_id.supabase.co:5432/postgres?schema=public
   ```

## Step 5: Generate Prisma Client

1. Run the following command to generate the Prisma client based on your schema:
   ```bash
   npx prisma generate
   ```

## Step 6: Test Database Connection

1. Run the test script to verify your connection:
   ```bash
   node scripts/test-connection.js
   ```

## Troubleshooting

### API Key Issues

If you're seeing "Invalid API key" errors:
1. Go to **Project Settings** > **API** in the Supabase dashboard
2. Regenerate the anon key if necessary
3. Update your `.env` file with the new key

### Database Connection Issues

Direct PostgreSQL connections to Supabase might be restricted in some environments. If you're unable to connect directly:
1. Use the Supabase JavaScript client for database operations
2. Apply schema changes through the SQL Editor in the dashboard
3. Make sure your IP address is not blocked by Supabase

### Row Level Security (RLS) Issues

If you're having permission issues when accessing tables:
1. Check the RLS policies in the Supabase dashboard under **Authentication** > **Policies**
2. Make sure appropriate policies are in place for each table
3. For development, you can temporarily disable RLS for specific tables if needed

## Next Steps

After successfully setting up the database:
1. Implement the core API endpoints using the Prisma client
2. Set up authentication flows
3. Begin developing the agent memory system
4. Implement the chat API with streaming responses
