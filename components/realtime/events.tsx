import { useEffect } from 'react';

export function RealtimeEvents() {
  useEffect(() => {
    const eventSource = new EventSource('/api/realtime/events');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received real-time event:', data);
    };
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
    };
    return () => {
      eventSource.close();
    };
  }, []);
  return null;
} 