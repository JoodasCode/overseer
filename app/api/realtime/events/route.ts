import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { subscribe, unsubscribe } from '@/lib/realtime/event-emitter';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let send: ((event: any) => void) | undefined;
  const stream = new ReadableStream({
    start(controller) {
      send = (event: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      subscribe('broadcast', send);
      // Send a hello event on connect
      send({ type: 'hello', message: 'Connected to real-time events.' });
    },
    cancel() {
      if (send) unsubscribe('broadcast', send);
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
} 