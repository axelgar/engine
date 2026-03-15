import { describe, it, expect } from 'vitest';
import { AnimationClip } from '../../src/animation/AnimationClip.js';
import { Animator } from '../../src/animation/Animator.js';
import { Rectangle } from '../../src/math/Rectangle.js';

function makeClip(name: string, frameCount: number, duration = 0.1, loop = true) {
  const frames = Array.from({ length: frameCount }, (_, i) => ({
    sourceRect: new Rectangle(i * 16, 0, 16, 16),
    duration,
  }));
  return new AnimationClip(name, frames, loop);
}

function makeFakeSprite(): any {
  return {
    sourceRect: null,
    position: { x: 0, y: 0 },
    texture: { width: 64, height: 64 },
  };
}

describe('Animator', () => {
  it('plays a clip and updates sprite sourceRect', () => {
    const sprite = makeFakeSprite();
    const animator = new Animator(sprite);
    animator.addClip(makeClip('walk', 4));
    animator.play('walk');

    expect(sprite.sourceRect).not.toBeNull();
    expect(sprite.sourceRect.x).toBe(0);

    animator.update(0.1);
    expect(sprite.sourceRect.x).toBe(16);
  });

  it('reports current clip name', () => {
    const sprite = makeFakeSprite();
    const animator = new Animator(sprite);
    animator.addClip(makeClip('walk', 4));

    expect(animator.currentClipName).toBeNull();
    animator.play('walk');
    expect(animator.currentClipName).toBe('walk');
  });

  it('throws when playing unknown clip', () => {
    const sprite = makeFakeSprite();
    const animator = new Animator(sprite);

    expect(() => animator.play('unknown')).toThrow('not found');
  });

  it('does not restart same clip unless forced', () => {
    const sprite = makeFakeSprite();
    const animator = new Animator(sprite);
    animator.addClip(makeClip('walk', 4));
    animator.play('walk');
    animator.update(0.15);
    expect(sprite.sourceRect.x).toBe(16);

    // Playing same clip again should not restart
    animator.play('walk');
    expect(sprite.sourceRect.x).toBe(16);

    // With restart=true, should reset
    animator.play('walk', true);
    expect(sprite.sourceRect.x).toBe(0);
  });

  it('stops and resumes playback', () => {
    const sprite = makeFakeSprite();
    const animator = new Animator(sprite);
    animator.addClip(makeClip('walk', 4));
    animator.play('walk');

    animator.stop();
    animator.update(0.5);
    expect(sprite.sourceRect.x).toBe(0); // Should not advance

    animator.resume();
    animator.update(0.1);
    expect(sprite.sourceRect.x).toBe(16);
  });

  it('marks non-looping clips as finished', () => {
    const sprite = makeFakeSprite();
    const animator = new Animator(sprite);
    animator.addClip(makeClip('attack', 3, 0.25, false));
    animator.play('attack');

    expect(animator.finished).toBe(false);
    animator.update(0.75);
    expect(animator.finished).toBe(true);
    expect(sprite.sourceRect.x).toBe(32); // Last frame
  });

  it('respects speed multiplier', () => {
    const sprite = makeFakeSprite();
    const animator = new Animator(sprite);
    animator.addClip(makeClip('walk', 4));
    animator.play('walk');

    animator.speed = 2;
    animator.update(0.05); // dt * speed = 0.1
    expect(sprite.sourceRect.x).toBe(16);
  });
});
