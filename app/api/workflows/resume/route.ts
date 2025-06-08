import { NextRequest, NextResponse } from 'next/server';
import { resumeWorkflow } from '@/lib/workflow/scheduler';
import { Workflow } from '@/lib/workflow/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, workflow, interval } = body;

    if (!id || !workflow || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: id, workflow, interval' },
        { status: 400 }
      );
    }

    resumeWorkflow(id, workflow as Workflow, interval);
    return NextResponse.json({ success: true, message: `Workflow ${id} resumed.` });
  } catch (error) {
    console.error('Error resuming workflow:', error);
    return NextResponse.json(
      { error: 'Failed to resume workflow', details: (error as Error).message },
      { status: 500 }
    );
  }
} 