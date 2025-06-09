import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up database tables...');

    // Create agents table
    const createAgentsTable = `
      CREATE TABLE IF NOT EXISTS public.agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        role VARCHAR(255),
        persona TEXT,
        avatar TEXT DEFAULT '🤖',
        tools JSONB DEFAULT '[]'::jsonb,
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    // Create agent_memory table
    const createAgentMemoryTable = `
      CREATE TABLE IF NOT EXISTS public.agent_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
        weekly_goals TEXT,
        preferences JSONB DEFAULT '[]'::jsonb,
        recent_learnings JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    // Create chat_messages table
    const createChatMessagesTable = `
      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    // Create tasks table
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
        user_id UUID NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
      CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON public.agent_memory(agent_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_id ON public.chat_messages(agent_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON public.tasks(agent_id);
    `;

    // Execute table creation
    console.log('📊 Creating agents table...');
    await supabaseAdmin.rpc('exec_sql', { sql: createAgentsTable });

    console.log('🧠 Creating agent_memory table...');
    await supabaseAdmin.rpc('exec_sql', { sql: createAgentMemoryTable });

    console.log('💬 Creating chat_messages table...');
    await supabaseAdmin.rpc('exec_sql', { sql: createChatMessagesTable });

    console.log('📋 Creating tasks table...');
    await supabaseAdmin.rpc('exec_sql', { sql: createTasksTable });

    console.log('🔍 Creating indexes...');
    await supabaseAdmin.rpc('exec_sql', { sql: createIndexes });

    console.log('✅ Database setup complete!');

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully'
    });

  } catch (error) {
    console.error('❌ Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 