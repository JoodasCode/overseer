type EventCallback = (data: any) => void;

class EventEmitter {
  private listeners: Record<string, Set<EventCallback>> = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(callback);
  }

  off(event: string, callback: EventCallback) {
    this.listeners[event]?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners[event]?.forEach(cb => cb(data));
  }
}

const emitter = new EventEmitter();

export function subscribe(event: string, callback: EventCallback) {
  emitter.on(event, callback);
}

export function unsubscribe(event: string, callback: EventCallback) {
  emitter.off(event, callback);
}

export function emitEvent(event: string, data: any) {
  emitter.emit(event, data);
} 