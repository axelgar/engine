/**
 * Manages keyboard and gamepad input with per-frame state tracking.
 */
export class InputManager {
  private keysDown = new Set<string>();
  private keysJustPressed = new Set<string>();
  private keysJustReleased = new Set<string>();
  private previousKeys = new Set<string>();

  private gamepadIndex: number | null = null;
  private gamepadButtons = new Map<number, boolean>();
  private previousGamepadButtons = new Map<number, boolean>();
  private gamepadAxes: number[] = [];

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundGamepadConnected: (e: GamepadEvent) => void;
  private boundGamepadDisconnected: (e: GamepadEvent) => void;

  constructor(private target: EventTarget = window) {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundGamepadConnected = this.onGamepadConnected.bind(this);
    this.boundGamepadDisconnected = this.onGamepadDisconnected.bind(this);

    target.addEventListener('keydown', this.boundKeyDown as EventListener);
    target.addEventListener('keyup', this.boundKeyUp as EventListener);
    window.addEventListener('gamepadconnected', this.boundGamepadConnected as EventListener);
    window.addEventListener('gamepaddisconnected', this.boundGamepadDisconnected as EventListener);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!e.repeat) {
      this.keysDown.add(e.code);
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
  }

  private onGamepadConnected(e: GamepadEvent): void {
    if (this.gamepadIndex === null) {
      this.gamepadIndex = e.gamepad.index;
    }
  }

  private onGamepadDisconnected(e: GamepadEvent): void {
    if (e.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = null;
      this.gamepadButtons.clear();
      this.previousGamepadButtons.clear();
    }
  }

  /**
   * Must be called once per frame (at the start of the update step).
   */
  update(): void {
    // Compute just pressed / just released for keyboard
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();

    for (const key of this.keysDown) {
      if (!this.previousKeys.has(key)) {
        this.keysJustPressed.add(key);
      }
    }
    for (const key of this.previousKeys) {
      if (!this.keysDown.has(key)) {
        this.keysJustReleased.add(key);
      }
    }

    this.previousKeys = new Set(this.keysDown);

    // Poll gamepad
    this.previousGamepadButtons = new Map(this.gamepadButtons);
    this.gamepadButtons.clear();

    if (this.gamepadIndex !== null) {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[this.gamepadIndex];
      if (gp) {
        for (let i = 0; i < gp.buttons.length; i++) {
          this.gamepadButtons.set(i, gp.buttons[i].pressed);
        }
        this.gamepadAxes = gp.axes.slice();
      }
    }
  }

  // Keyboard queries
  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  isKeyJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  isKeyJustReleased(code: string): boolean {
    return this.keysJustReleased.has(code);
  }

  // Gamepad queries
  isGamepadButtonDown(button: number): boolean {
    return this.gamepadButtons.get(button) ?? false;
  }

  isGamepadButtonJustPressed(button: number): boolean {
    const current = this.gamepadButtons.get(button) ?? false;
    const previous = this.previousGamepadButtons.get(button) ?? false;
    return current && !previous;
  }

  getGamepadAxis(axis: number): number {
    return this.gamepadAxes[axis] ?? 0;
  }

  get hasGamepad(): boolean {
    return this.gamepadIndex !== null;
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.boundKeyDown as EventListener);
    this.target.removeEventListener('keyup', this.boundKeyUp as EventListener);
    window.removeEventListener('gamepadconnected', this.boundGamepadConnected as EventListener);
    window.removeEventListener('gamepaddisconnected', this.boundGamepadDisconnected as EventListener);
  }
}
