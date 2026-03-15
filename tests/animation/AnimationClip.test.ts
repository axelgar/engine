import { describe, it, expect } from 'vitest';
import { AnimationClip } from '../../src/animation/AnimationClip.js';
import { Rectangle } from '../../src/math/Rectangle.js';

function makeFrames(count: number, duration = 0.1) {
  return Array.from({ length: count }, (_, i) => ({
    sourceRect: new Rectangle(i * 16, 0, 16, 16),
    duration,
  }));
}

describe('AnimationClip', () => {
  it('computes total duration', () => {
    const clip = new AnimationClip('walk', makeFrames(4, 0.1));
    expect(clip.totalDuration).toBeCloseTo(0.4);
  });

  it('returns the correct frame at a given time', () => {
    const clip = new AnimationClip('walk', makeFrames(4, 0.1));

    expect(clip.getFrameAtTime(0).sourceRect.x).toBe(0);
    expect(clip.getFrameAtTime(0.05).sourceRect.x).toBe(0);
    expect(clip.getFrameAtTime(0.1).sourceRect.x).toBe(16);
    expect(clip.getFrameAtTime(0.25).sourceRect.x).toBe(32);
    expect(clip.getFrameAtTime(0.35).sourceRect.x).toBe(48);
  });

  it('loops by default', () => {
    const clip = new AnimationClip('walk', makeFrames(4, 0.25), true);

    // At t=1.0 (totalDuration), should loop back to frame 0
    expect(clip.getFrameAtTime(1.0).sourceRect.x).toBe(0);
    // At t=1.25, should be at frame 1
    expect(clip.getFrameAtTime(1.25).sourceRect.x).toBe(16);
  });

  it('stays on last frame when not looping', () => {
    const clip = new AnimationClip('attack', makeFrames(3, 0.1), false);

    // Past end — should stay at last frame
    expect(clip.getFrameAtTime(0.5).sourceRect.x).toBe(32);
    expect(clip.getFrameAtTime(10).sourceRect.x).toBe(32);
  });

  it('returns correct frame index', () => {
    const clip = new AnimationClip('walk', makeFrames(4, 0.1));

    expect(clip.getFrameIndexAtTime(0)).toBe(0);
    expect(clip.getFrameIndexAtTime(0.15)).toBe(1);
    expect(clip.getFrameIndexAtTime(0.25)).toBe(2);
    expect(clip.getFrameIndexAtTime(0.35)).toBe(3);
  });

  it('throws if clip has no frames', () => {
    const clip = new AnimationClip('empty', []);
    expect(() => clip.getFrameAtTime(0)).toThrow('no frames');
  });
});
