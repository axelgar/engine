type Handler<T = unknown> = (data: T) => void;

/**
 * Typed pub/sub event emitter.
 *
 * Usage:
 *   type Events = { 'player:hit': { damage: number } };
 *   const bus = new EventBus<Events>();
 *   bus.on('player:hit', (data) => console.log(data.damage));
 */
export class EventBus<EventMap extends Record<string, unknown> = Record<string, unknown>> {
  private handlers = new Map<keyof EventMap, Set<Handler<never>>>();

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as Handler<never>);
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  once<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    const wrapper = ((data: EventMap[K]) => {
      this.off(event, wrapper);
      handler(data);
    }) as Handler<EventMap[K]>;
    this.on(event, wrapper);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      (handler as Handler<EventMap[K]>)(data);
    }
  }

  clear(event?: keyof EventMap): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  hasListeners(event: keyof EventMap): boolean {
    const handlers = this.handlers.get(event);
    return handlers !== undefined && handlers.size > 0;
  }
}
