import { describe, it, expect, beforeEach } from 'vitest';
import { InputManager } from '../../src/input/InputManager.js';

describe('InputManager', () => {
  let input: InputManager;
  let target: EventTarget;

  beforeEach(() => {
    target = new EventTarget();
    input = new InputManager(target);
  });

  it('tracks key down state', () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    input.update();
    expect(input.isKeyDown('ArrowUp')).toBe(true);
    expect(input.isKeyDown('ArrowDown')).toBe(false);
  });

  it('tracks key just pressed', () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    input.update();
    expect(input.isKeyJustPressed('Space')).toBe(true);

    // Second frame — no longer "just pressed"
    input.update();
    expect(input.isKeyJustPressed('Space')).toBe(false);
    expect(input.isKeyDown('Space')).toBe(true);
  });

  it('tracks key just released', () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    input.update();

    target.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
    input.update();

    expect(input.isKeyJustReleased('KeyA')).toBe(true);
    expect(input.isKeyDown('KeyA')).toBe(false);
  });

  it('ignores repeat events', () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    input.update();

    // Simulate repeat
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', repeat: true }));
    input.update();

    // Should still be down but not "just pressed" again
    expect(input.isKeyDown('KeyW')).toBe(true);
    expect(input.isKeyJustPressed('KeyW')).toBe(false);
  });

  it('cleans up event listeners on destroy', () => {
    input.destroy();
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' }));
    input.update();
    expect(input.isKeyDown('KeyX')).toBe(false);
  });
});
