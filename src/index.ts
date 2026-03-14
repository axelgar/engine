// Core
export { Engine } from './core/Engine.js';
export { GameLoop } from './core/GameLoop.js';
export type { EngineConfig, UpdateCallback, RenderCallback } from './core/types.js';

// Math
export { Vector2 } from './math/Vector2.js';
export { Rectangle } from './math/Rectangle.js';

// Events
export { EventBus } from './events/EventBus.js';

// Rendering
export { WebGLRenderer } from './rendering/WebGLRenderer.js';
export type { RendererConfig } from './rendering/WebGLRenderer.js';
export { SpriteBatch } from './rendering/SpriteBatch.js';
export { Shader, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER } from './rendering/Shader.js';
export { Texture, TextureFilter, TextureWrap } from './rendering/Texture.js';
export type { TextureOptions } from './rendering/Texture.js';
export { Sprite } from './rendering/Sprite.js';
export type { SpriteOptions } from './rendering/Sprite.js';
export { SpriteSheet } from './rendering/SpriteSheet.js';
export { Camera } from './rendering/Camera.js';

// Input
export { InputManager } from './input/InputManager.js';
export { InputMap } from './input/InputMap.js';

// Assets
export { AssetStore } from './assets/AssetStore.js';
export { AssetLoader } from './assets/AssetLoader.js';
export type { AssetManifest, ProgressCallback } from './assets/AssetLoader.js';

// Audio
export { AudioManager } from './audio/AudioManager.js';
export { AudioChannel } from './audio/AudioChannel.js';
export type { PlayOptions } from './audio/AudioChannel.js';
