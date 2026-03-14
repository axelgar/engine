import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop } from '../../src/core/GameLoop.js';

describe('GameLoop', () => {
  let rafCallbacks: Array<(time: number) => void>;
  let cancelledFrames: Set<number>;
  let nextRafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    cancelledFrames = new Set();
    nextRafId = 1;

    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextRafId++;
      rafCallbacks.push((time) => {
        if (!cancelledFrames.has(id)) cb(time);
      });
      return id;
    });

    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
      cancelledFrames.add(id);
    });

    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls update and render when running', () => {
    const update = vi.fn();
    const render = vi.fn();
    const loop = new GameLoop(60, update, render);

    loop.start();
    expect(loop.isRunning).toBe(true);

    // Simulate one frame at 16.67ms (≈60fps)
    const cb = rafCallbacks.shift()!;
    cb(16.67);

    expect(update).toHaveBeenCalled();
    expect(render).toHaveBeenCalled();

    loop.stop();
  });

  it('does not update when paused', () => {
    const update = vi.fn();
    const render = vi.fn();
    const loop = new GameLoop(60, update, render);

    loop.start();
    loop.pause();
    expect(loop.isPaused).toBe(true);

    const cb = rafCallbacks.shift()!;
    cb(16.67);

    expect(update).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();

    loop.stop();
  });

  it('stops cleanly', () => {
    const loop = new GameLoop(60, vi.fn(), vi.fn());
    loop.start();
    loop.stop();
    expect(loop.isRunning).toBe(false);
  });

  it('caps frame time to prevent spiral of death', () => {
    const update = vi.fn();
    const render = vi.fn();
    const loop = new GameLoop(60, update, render);

    loop.start();

    // Simulate a huge frame time (1 second)
    const cb = rafCallbacks.shift()!;
    cb(1000);

    // With 0.25s cap at 60 UPS, max updates = 0.25 / (1/60) = 15
    expect(update.mock.calls.length).toBeLessThanOrEqual(15);
    loop.stop();
  });
});
