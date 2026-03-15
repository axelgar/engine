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

// Tilemap
export { TileMap } from './tilemap/TileMap.js';
export type { TileInfo, TilesetBinding } from './tilemap/TileMap.js';
export type {
  TiledMap,
  TiledLayer,
  TiledTileLayer,
  TiledObjectGroup,
  TiledImageLayer,
  TiledGroupLayer,
  TiledObject,
  TiledTilesetRef,
  TiledTileDef,
  TiledFrame,
  TiledProperty,
} from './tilemap/TiledTypes.js';
export {
  FLIPPED_HORIZONTALLY,
  FLIPPED_VERTICALLY,
  FLIPPED_DIAGONALLY,
  ROTATED_HEX_120,
  GID_MASK,
} from './tilemap/TiledTypes.js';

// Animation
export { AnimationClip } from './animation/AnimationClip.js';
export type { AnimationFrame } from './animation/AnimationClip.js';
export { Animator } from './animation/Animator.js';

// Scene
export { Scene } from './scene/Scene.js';
export { SceneManager } from './scene/SceneManager.js';
export { FadeTransition } from './scene/Transition.js';
export type { Transition } from './scene/Transition.js';

// Entity
export { Entity } from './entity/Entity.js';
export type { Component } from './entity/Component.js';

// Collision
export { CollisionSystem } from './collision/CollisionSystem.js';
export type { CollisionResult } from './collision/CollisionSystem.js';

// Dialogue
export { DialogueSystem } from './dialogue/DialogueSystem.js';
export type {
  DialogueLine,
  DialogueChoice,
  DialogueNode,
  DialogueEvent,
  DialogueCallback,
} from './dialogue/DialogueSystem.js';
