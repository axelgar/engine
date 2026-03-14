import type { InputManager } from './InputManager.js';

/**
 * Action-based input mapping.
 * Maps logical actions (e.g. "confirm", "moveUp") to physical keys/buttons.
 */
export class InputMap {
  private actions = new Map<string, ActionBinding>();

  constructor(private input: InputManager) {}

  /**
   * Define an action mapping.
   * Keys use KeyboardEvent.code (e.g. "ArrowUp", "KeyW").
   * Gamepad buttons use numeric indices.
   */
  map(action: string, keys: string[], gamepadButtons: number[] = []): void {
    this.actions.set(action, { keys, gamepadButtons });
  }

  isPressed(action: string): boolean {
    const binding = this.actions.get(action);
    if (!binding) return false;

    for (const key of binding.keys) {
      if (this.input.isKeyDown(key)) return true;
    }
    for (const btn of binding.gamepadButtons) {
      if (this.input.isGamepadButtonDown(btn)) return true;
    }
    return false;
  }

  isJustPressed(action: string): boolean {
    const binding = this.actions.get(action);
    if (!binding) return false;

    for (const key of binding.keys) {
      if (this.input.isKeyJustPressed(key)) return true;
    }
    for (const btn of binding.gamepadButtons) {
      if (this.input.isGamepadButtonJustPressed(btn)) return true;
    }
    return false;
  }

  /**
   * Get a directional axis value from two actions (negative/positive).
   * Returns -1, 0, or 1 for digital input; analog values for gamepad axes.
   */
  getAxis(negativeAction: string, positiveAction: string): number {
    let value = 0;
    if (this.isPressed(negativeAction)) value -= 1;
    if (this.isPressed(positiveAction)) value += 1;
    return value;
  }
}

interface ActionBinding {
  keys: string[];
  gamepadButtons: number[];
}
