/**
 * JRPG Engine — Interactive Demo
 *
 * Demonstrates: tilemap rendering, player entity with animation,
 * camera follow, collision, NPC interaction, and dialogue system.
 *
 * Run with: npx vite demo
 */

import {
  Engine,
  Texture,
  TextureFilter,
  Sprite,
  Vector2,
  Rectangle,
  Camera,
  Entity,
  AnimationClip,
  Animator,
  TileMap,
  CollisionSystem,
  DialogueSystem,
} from '../src/index.js';
import type { TiledMap } from '../src/index.js';

// ---------------------------------------------------------------------------
// 1. Procedural texture generation (no external assets needed)
// ---------------------------------------------------------------------------

function createImageFromCanvas(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): HTMLImageElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  const img = new Image();
  img.src = c.toDataURL();
  return img;
}

/** 4-tile tileset: grass, dirt, water, wall (each 16x16) in a 64x16 strip. */
function makeTilesetImage(): HTMLImageElement {
  return createImageFromCanvas(64, 16, (ctx) => {
    // Tile 0: Grass
    ctx.fillStyle = '#3a7d44';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#4a9d54';
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(Math.random() * 14) + 1;
      const y = Math.floor(Math.random() * 14) + 1;
      ctx.fillRect(x, y, 1, 2);
    }

    // Tile 1: Dirt path
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(16, 0, 16, 16);
    ctx.fillStyle = '#9b7924';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(16 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 14), 2, 2);
    }

    // Tile 2: Water
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(32, 0, 16, 16);
    ctx.fillStyle = '#3366cc';
    ctx.fillRect(34, 4, 8, 2);
    ctx.fillRect(36, 10, 6, 2);

    // Tile 3: Wall/stone
    ctx.fillStyle = '#666';
    ctx.fillRect(48, 0, 16, 16);
    ctx.fillStyle = '#777';
    ctx.fillRect(49, 1, 6, 6);
    ctx.fillRect(57, 1, 6, 6);
    ctx.fillRect(53, 9, 6, 6);
  });
}

/** 4-frame character sprite sheet (16x16 each, 64x16 strip). */
function makeCharacterImage(bodyColor: string, headColor: string): HTMLImageElement {
  return createImageFromCanvas(64, 16, (ctx) => {
    for (let frame = 0; frame < 4; frame++) {
      const ox = frame * 16;
      const bounce = frame % 2 === 0 ? 0 : -1;

      // Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(ox + 4, 7 + bounce, 8, 7);

      // Head
      ctx.fillStyle = headColor;
      ctx.fillRect(ox + 5, 2 + bounce, 6, 6);

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(ox + 6, 4 + bounce, 2, 2);
      ctx.fillRect(ox + 9, 4 + bounce, 2, 2);
      ctx.fillStyle = '#222';
      ctx.fillRect(ox + 6, 4 + bounce, 1, 1);
      ctx.fillRect(ox + 9, 4 + bounce, 1, 1);

      // Legs (alternate for walk animation)
      ctx.fillStyle = bodyColor;
      if (frame === 1) {
        ctx.fillRect(ox + 5, 14 + bounce, 3, 2);
        ctx.fillRect(ox + 9, 13 + bounce, 3, 2);
      } else if (frame === 3) {
        ctx.fillRect(ox + 5, 13 + bounce, 3, 2);
        ctx.fillRect(ox + 9, 14 + bounce, 3, 2);
      } else {
        ctx.fillRect(ox + 5, 14, 3, 2);
        ctx.fillRect(ox + 9, 14, 3, 2);
      }
    }
  });
}

/** NPC marker — small floating "!" indicator. */
function makeMarkerImage(): HTMLImageElement {
  return createImageFromCanvas(16, 16, (ctx) => {
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(7, 2, 3, 8);
    ctx.fillRect(7, 12, 3, 3);
  });
}

// ---------------------------------------------------------------------------
// 2. Map data (Tiled JSON format, embedded)
// ---------------------------------------------------------------------------

// 20x15 map, each tile is 16x16 pixels → 320x240 world
// Tile GIDs: 1=grass, 2=dirt, 3=water, 4=wall
const MAP_DATA: TiledMap = {
  type: 'map',
  version: '1.10',
  orientation: 'orthogonal',
  renderorder: 'right-down',
  width: 20,
  height: 15,
  tilewidth: 16,
  tileheight: 16,
  infinite: false,
  nextlayerid: 4,
  nextobjectid: 4,
  tilesets: [
    {
      firstgid: 1,
      name: 'tiles',
      tilewidth: 16,
      tileheight: 16,
      tilecount: 4,
      columns: 4,
      image: 'tiles.png',
      imagewidth: 64,
      imageheight: 16,
    },
  ],
  layers: [
    {
      type: 'tilelayer',
      id: 1,
      name: 'Ground',
      width: 20,
      height: 15,
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      // prettier-ignore
      data: [
        4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4,
        4, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 4,
        4, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 4,
        4, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 4,
        4, 1, 1, 4, 4, 4, 1, 1, 2, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 4,
        4, 1, 1, 4, 1, 4, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4,
        4, 1, 1, 4, 4, 4, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 4,
        4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 4,
        4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 4,
        4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 1, 2, 2, 2, 2, 1, 1, 4,
        4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 2, 1, 1, 4,
        4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 4,
        4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4,
        4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
      ],
    },
    {
      type: 'tilelayer',
      id: 2,
      name: 'collision',
      width: 20,
      height: 15,
      x: 0,
      y: 0,
      opacity: 1,
      visible: false,
      // 0 = passable, 1+ = solid (walls and water)
      // prettier-ignore
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1,
        1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
    },
    {
      type: 'objectgroup',
      id: 3,
      name: 'Entities',
      draworder: 'topdown' as const,
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      objects: [
        {
          id: 1,
          name: 'PlayerSpawn',
          type: 'Spawn',
          x: 32,
          y: 32,
          width: 0,
          height: 0,
          rotation: 0,
          visible: true,
          point: true,
        },
        {
          id: 2,
          name: 'Sage',
          type: 'NPC',
          x: 256,
          y: 128,
          width: 16,
          height: 16,
          rotation: 0,
          visible: true,
        },
      ],
    },
  ],
  properties: [
    { name: 'title', type: 'string', value: 'Demo Village' },
  ],
};

// ---------------------------------------------------------------------------
// 3. Boot the engine
// ---------------------------------------------------------------------------

async function main() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;

  const engine = new Engine({
    canvas,
    width: 512,
    height: 384,
    clearColor: [0.05, 0.05, 0.1, 1],
  });

  const gl = engine.renderer.gl;

  // Wait for images to decode
  const tilesetImg = makeTilesetImage();
  const playerImg = makeCharacterImage('#3366cc', '#ffcc88');
  const npcImg = makeCharacterImage('#cc3333', '#eeddcc');
  const markerImg = makeMarkerImage();

  await Promise.all([
    tilesetImg.decode?.() ?? new Promise((r) => (tilesetImg.onload = r)),
    playerImg.decode?.() ?? new Promise((r) => (playerImg.onload = r)),
    npcImg.decode?.() ?? new Promise((r) => (npcImg.onload = r)),
    markerImg.decode?.() ?? new Promise((r) => (markerImg.onload = r)),
  ]);

  const tilesetTex = new Texture(gl, tilesetImg, { filter: TextureFilter.Nearest });
  const playerTex = new Texture(gl, playerImg, { filter: TextureFilter.Nearest });
  const npcTex = new Texture(gl, npcImg, { filter: TextureFilter.Nearest });
  const markerTex = new Texture(gl, markerImg, { filter: TextureFilter.Nearest });

  // -------------------------------------------------------------------------
  // 4. Tilemap
  // -------------------------------------------------------------------------

  const textures = new Map([['tiles', tilesetTex]]);
  const tileMap = new TileMap(MAP_DATA, textures);

  // -------------------------------------------------------------------------
  // 5. Player entity + animation
  // -------------------------------------------------------------------------

  const spawnObj = tileMap.getObject('PlayerSpawn');
  const player = new Entity(spawnObj?.x ?? 32, spawnObj?.y ?? 32);
  player.bounds = new Rectangle(-6, -4, 12, 12);

  const playerSprite = new Sprite(playerTex, {
    sourceRect: new Rectangle(0, 0, 16, 16),
    origin: new Vector2(0.5, 0.5),
    scale: new Vector2(2, 2),
  });
  player.sprite = playerSprite;

  const walkClip = new AnimationClip(
    'walk',
    [0, 1, 2, 3].map((i) => ({
      sourceRect: new Rectangle(i * 16, 0, 16, 16),
      duration: 0.15,
    })),
    true,
  );
  const idleClip = new AnimationClip('idle', [
    { sourceRect: new Rectangle(0, 0, 16, 16), duration: 1 },
  ]);

  const animator = new Animator(playerSprite);
  animator.addClip(walkClip);
  animator.addClip(idleClip);
  animator.play('idle');

  // -------------------------------------------------------------------------
  // 6. NPC entity
  // -------------------------------------------------------------------------

  const npcData = tileMap.getObjects('NPC')[0];
  const npc = new Entity(npcData.x, npcData.y);
  npc.sprite = new Sprite(npcTex, {
    sourceRect: new Rectangle(0, 0, 16, 16),
    origin: new Vector2(0.5, 0.5),
    scale: new Vector2(2, 2),
  });
  npc.bounds = new Rectangle(-8, -8, 16, 16);

  const markerSprite = new Sprite(markerTex, {
    origin: new Vector2(0.5, 1),
    scale: new Vector2(1.5, 1.5),
  });

  // -------------------------------------------------------------------------
  // 7. Dialogue
  // -------------------------------------------------------------------------

  const dialogue = new DialogueSystem();
  dialogue.addNodes([
    {
      id: 'sage_intro',
      lines: [
        { speaker: 'Old Sage', text: 'Greetings, traveler! Welcome to the demo village.' },
        { speaker: 'Old Sage', text: 'This little world was built with the JRPG engine.' },
        {
          speaker: 'Old Sage',
          text: 'What would you like to know?',
          choices: [
            { text: 'Tell me about the engine', next: 'sage_engine' },
            { text: 'Nothing, goodbye', next: 'sage_bye' },
          ],
        },
      ],
    },
    {
      id: 'sage_engine',
      lines: [
        { speaker: 'Old Sage', text: 'The engine has tilemaps, animation, entities, collision...' },
        { speaker: 'Old Sage', text: '...scenes, transitions, and this very dialogue system!' },
        { speaker: 'Old Sage', text: 'All written in TypeScript with WebGL 2 rendering.' },
      ],
      next: 'sage_bye',
    },
    {
      id: 'sage_bye',
      lines: [{ speaker: 'Old Sage', text: 'Safe travels, adventurer! Press arrow keys to explore.' }],
    },
  ]);

  const dlgBox = document.getElementById('dialogue-box')!;
  const dlgSpeaker = document.getElementById('dlg-speaker')!;
  const dlgText = document.getElementById('dlg-text')!;
  const dlgHint = document.getElementById('dlg-hint')!;

  dialogue.onEvent((e) => {
    if (e.type === 'line') {
      dlgBox.style.display = 'block';
      dlgSpeaker.textContent = e.line.speaker ?? '';
      dlgText.textContent = e.line.text;
      dlgHint.textContent = e.line.choices
        ? 'Press Space to continue...'
        : 'Press Space to continue...';
    } else if (e.type === 'choices') {
      dlgHint.textContent = e.choices.map((c, i) => `[${i + 1}] ${c.text}`).join('   ');
    } else if (e.type === 'end') {
      dlgBox.style.display = 'none';
    }
  });

  // -------------------------------------------------------------------------
  // 8. Input mapping
  // -------------------------------------------------------------------------

  engine.inputMap.map('up', ['ArrowUp', 'KeyW']);
  engine.inputMap.map('down', ['ArrowDown', 'KeyS']);
  engine.inputMap.map('left', ['ArrowLeft', 'KeyA']);
  engine.inputMap.map('right', ['ArrowRight', 'KeyD']);
  engine.inputMap.map('interact', ['Space']);
  engine.inputMap.map('choice1', ['Digit1']);
  engine.inputMap.map('choice2', ['Digit2']);

  // -------------------------------------------------------------------------
  // 9. Collision system
  // -------------------------------------------------------------------------

  const collisionSystem = new CollisionSystem();

  // -------------------------------------------------------------------------
  // 10. Camera setup
  // -------------------------------------------------------------------------

  const camera = engine.renderer.camera;
  camera.zoom = 2;
  camera.follow(player, 0.12);

  // -------------------------------------------------------------------------
  // 11. Game loop
  // -------------------------------------------------------------------------

  const PLAYER_SPEED = 80;
  const NPC_INTERACT_DIST = 32;
  let nearNpc = false;
  let markerBob = 0;

  engine.onUpdate((dt) => {
    // Skip movement during dialogue
    if (dialogue.active) {
      if (engine.inputMap.isJustPressed('interact')) {
        if (dialogue.waitingForChoice) {
          // Do nothing — wait for number key
        } else {
          dialogue.advance();
        }
      }
      if (dialogue.waitingForChoice) {
        if (engine.inputMap.isJustPressed('choice1')) dialogue.selectChoice(0);
        if (engine.inputMap.isJustPressed('choice2')) dialogue.selectChoice(1);
      }
      return;
    }

    // Movement
    const dx = engine.inputMap.getAxis('left', 'right');
    const dy = engine.inputMap.getAxis('up', 'down');
    const moving = dx !== 0 || dy !== 0;

    if (moving) {
      const velocity = new Vector2(dx, dy).normalize().scale(PLAYER_SPEED);
      collisionSystem.moveAndCollide(player, velocity, dt, tileMap);
      playerSprite.flipX = dx < 0;
      animator.play('walk');
    } else {
      animator.play('idle');
    }

    animator.update(dt);

    // NPC proximity check
    const dist = player.position.distance(npc.position);
    nearNpc = dist < NPC_INTERACT_DIST;

    if (nearNpc && engine.inputMap.isJustPressed('interact')) {
      dialogue.start('sage_intro');
    }

    // Marker bobbing
    markerBob += dt * 3;
  });

  engine.onRender((_interpolation) => {
    const batch = engine.renderer.spriteBatch;

    // Draw tilemap
    tileMap.draw(batch);

    // Draw NPC
    npc.sprite!.position = npc.position;
    batch.draw(npc.sprite!);

    // Draw "!" marker above NPC when player is near
    if (nearNpc && !dialogue.active) {
      markerSprite.position = new Vector2(
        npc.position.x,
        npc.position.y - 20 + Math.sin(markerBob) * 3,
      );
      batch.draw(markerSprite);
    }

    // Draw player
    player.draw(batch);
  });

  // FPS display
  const fpsEl = document.getElementById('fps')!;
  setInterval(() => {
    fpsEl.textContent = `${engine.fps} FPS`;
  }, 500);

  engine.start();
  console.log(
    `%c JRPG Engine Demo %c Map: "${tileMap.getProperty('title')}" (${tileMap.pixelWidth}x${tileMap.pixelHeight}px)`,
    'background:#3366cc;color:#fff;padding:2px 6px;border-radius:3px',
    'color:#999',
  );
}

main().catch(console.error);
