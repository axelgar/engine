import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/events/EventBus.js';

type TestEvents = {
  hit: { damage: number };
  heal: { amount: number };
  ping: undefined;
};

describe('EventBus', () => {
  it('emits and receives events', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('hit', handler);
    bus.emit('hit', { damage: 10 });
    expect(handler).toHaveBeenCalledWith({ damage: 10 });
  });

  it('supports multiple handlers', () => {
    const bus = new EventBus<TestEvents>();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('hit', h1);
    bus.on('hit', h2);
    bus.emit('hit', { damage: 5 });
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('removes a specific handler with off()', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('hit', handler);
    bus.off('hit', handler);
    bus.emit('hit', { damage: 10 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('fires once() handler only once', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.once('hit', handler);
    bus.emit('hit', { damage: 1 });
    bus.emit('hit', { damage: 2 });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ damage: 1 });
  });

  it('does not throw when emitting with no listeners', () => {
    const bus = new EventBus<TestEvents>();
    expect(() => bus.emit('hit', { damage: 0 })).not.toThrow();
  });

  it('clears all handlers for an event', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();
    bus.on('hit', handler);
    bus.clear('hit');
    bus.emit('hit', { damage: 10 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('clears all handlers', () => {
    const bus = new EventBus<TestEvents>();
    bus.on('hit', vi.fn());
    bus.on('heal', vi.fn());
    bus.clear();
    expect(bus.hasListeners('hit')).toBe(false);
    expect(bus.hasListeners('heal')).toBe(false);
  });

  it('reports hasListeners correctly', () => {
    const bus = new EventBus<TestEvents>();
    expect(bus.hasListeners('hit')).toBe(false);
    const handler = vi.fn();
    bus.on('hit', handler);
    expect(bus.hasListeners('hit')).toBe(true);
    bus.off('hit', handler);
    expect(bus.hasListeners('hit')).toBe(false);
  });
});
