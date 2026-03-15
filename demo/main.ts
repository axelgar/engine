/**
 * JRPG Engine — Ghibli-inspired Demo
 *
 * A charming village scene with lush pixel art, ambient particles,
 * character animation, NPC interaction, and branching dialogue.
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
  Entity,
  AnimationClip,
  Animator,
  TileMap,
  CollisionSystem,
  DialogueSystem,
} from '../src/index.js';
import type { TiledMap } from '../src/index.js';

// ---------------------------------------------------------------------------
// Seeded random for deterministic tile textures
// ---------------------------------------------------------------------------
let _seed = 42;
function srand(s: number) { _seed = s; }
function rand(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Ghibli palette
// ---------------------------------------------------------------------------
const PAL = {
  // Greens — lush Totoro-forest tones
  grassLight:   '#5b8c3e',
  grassMid:     '#4a7a32',
  grassDark:    '#3d6828',
  grassHighlight: '#7aad55',
  leafDark:     '#2d5a1e',
  leafMid:      '#3e7228',
  leafLight:    '#5b9a38',
  leafHighlight:'#8cc060',
  // Earth
  dirtLight:    '#c4a265',
  dirtMid:      '#a88845',
  dirtDark:     '#8a6e35',
  dirtHighlight:'#d4b878',
  // Water — Ponyo ocean
  waterDeep:    '#2a5c8f',
  waterMid:     '#3a7ab8',
  waterLight:   '#5ca0d8',
  waterFoam:    '#a8daf0',
  // Stone — Howl's castle
  stoneLight:   '#9a9488',
  stoneMid:     '#7a756a',
  stoneDark:    '#5c5850',
  stoneHighlight:'#b0aa9c',
  mossGreen:    '#6a8a45',
  // Wood
  woodLight:    '#a08058',
  woodMid:      '#8a6a42',
  woodDark:     '#6a5030',
  // Roof — Kiki's red rooftops
  roofRed:      '#b85040',
  roofRedLight: '#d06850',
  roofRedDark:  '#8a3530',
  // Flowers
  flowerRed:    '#e06060',
  flowerYellow: '#f0d040',
  flowerBlue:   '#6090e0',
  flowerPink:   '#e890b0',
  flowerWhite:  '#f0ece0',
  // Character
  skinLight:    '#fce0c8',
  skinMid:      '#f0c8a0',
  hairBrown:    '#6a4530',
  hairDark:     '#3a2520',
  capeBlue:     '#3858a0',
  capeBlueDark: '#283878',
  dressWhite:   '#e8e0d8',
  dressGreen:   '#508050',
  // NPC sage
  robeRed:      '#9a3030',
  robeBrown:    '#8a6040',
  hairWhite:    '#d8d0c8',
  beardWhite:   '#c8c0b0',
};

// ---------------------------------------------------------------------------
// Procedural texture generation
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

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/**
 * 10-tile tileset in a 160x16 strip (each tile 16x16).
 *
 * GID layout:
 * 1: Grass (light, open field)
 * 2: Grass (darker, under trees)
 * 3: Wildflower meadow
 * 4: Dirt path
 * 5: Water
 * 6: Stone wall
 * 7: Tree trunk
 * 8: Tree canopy
 * 9: Roof tile
 * 10: Wooden floor
 */
function makeTilesetImage(): HTMLImageElement {
  return createImageFromCanvas(160, 16, (ctx) => {
    // --- Tile 0 (GID 1): Grass light ---
    srand(100);
    rect(ctx, 0, 0, 16, 16, PAL.grassMid);
    for (let i = 0; i < 20; i++) {
      px(ctx, randInt(0, 15), randInt(0, 15), PAL.grassLight);
    }
    for (let i = 0; i < 8; i++) {
      const gx = randInt(1, 14);
      const gy = randInt(2, 14);
      px(ctx, gx, gy, PAL.grassHighlight);
      px(ctx, gx, gy - 1, PAL.grassHighlight);
    }
    for (let i = 0; i < 6; i++) {
      px(ctx, randInt(0, 15), randInt(0, 15), PAL.grassDark);
    }

    // --- Tile 1 (GID 2): Grass dark (tree shadow) ---
    srand(200);
    rect(ctx, 16, 0, 16, 16, PAL.grassDark);
    for (let i = 0; i < 15; i++) {
      px(ctx, 16 + randInt(0, 15), randInt(0, 15), PAL.grassMid);
    }
    for (let i = 0; i < 5; i++) {
      px(ctx, 16 + randInt(0, 15), randInt(0, 15), PAL.leafDark);
    }

    // --- Tile 2 (GID 3): Wildflower meadow ---
    srand(300);
    rect(ctx, 32, 0, 16, 16, PAL.grassMid);
    for (let i = 0; i < 12; i++) {
      px(ctx, 32 + randInt(0, 15), randInt(0, 15), PAL.grassLight);
    }
    const flowerColors = [PAL.flowerRed, PAL.flowerYellow, PAL.flowerPink, PAL.flowerWhite, PAL.flowerBlue];
    for (let i = 0; i < 6; i++) {
      const fx = 32 + randInt(1, 14);
      const fy = randInt(1, 14);
      px(ctx, fx, fy, flowerColors[i % flowerColors.length]);
      px(ctx, fx, fy - 1, PAL.grassHighlight); // stem
    }

    // --- Tile 3 (GID 4): Dirt path ---
    srand(400);
    rect(ctx, 48, 0, 16, 16, PAL.dirtMid);
    for (let i = 0; i < 15; i++) {
      px(ctx, 48 + randInt(0, 15), randInt(0, 15), PAL.dirtLight);
    }
    for (let i = 0; i < 8; i++) {
      px(ctx, 48 + randInt(0, 15), randInt(0, 15), PAL.dirtDark);
    }
    for (let i = 0; i < 4; i++) {
      px(ctx, 48 + randInt(0, 15), randInt(0, 15), PAL.dirtHighlight);
    }

    // --- Tile 4 (GID 5): Water ---
    srand(500);
    rect(ctx, 64, 0, 16, 16, PAL.waterDeep);
    for (let i = 0; i < 10; i++) {
      px(ctx, 64 + randInt(0, 15), randInt(0, 15), PAL.waterMid);
    }
    // Gentle wave highlights
    rect(ctx, 64 + 2, 4, 5, 1, PAL.waterLight);
    rect(ctx, 64 + 8, 10, 4, 1, PAL.waterLight);
    rect(ctx, 64 + 3, 13, 3, 1, PAL.waterFoam);
    rect(ctx, 64 + 10, 6, 2, 1, PAL.waterFoam);

    // --- Tile 5 (GID 6): Stone wall ---
    srand(600);
    rect(ctx, 80, 0, 16, 16, PAL.stoneMid);
    // Brick pattern
    rect(ctx, 80, 0, 7, 5, PAL.stoneLight);
    rect(ctx, 80 + 8, 0, 8, 5, PAL.stoneDark);
    rect(ctx, 80, 6, 4, 5, PAL.stoneDark);
    rect(ctx, 80 + 5, 6, 7, 5, PAL.stoneLight);
    rect(ctx, 80 + 13, 6, 3, 5, PAL.stoneMid);
    rect(ctx, 80, 12, 8, 4, PAL.stoneHighlight);
    rect(ctx, 80 + 9, 12, 7, 4, PAL.stoneDark);
    // Mortar lines
    for (let x = 0; x < 16; x++) {
      px(ctx, 80 + x, 5, PAL.stoneDark);
      px(ctx, 80 + x, 11, PAL.stoneDark);
    }
    // Moss accents
    px(ctx, 80 + 2, 14, PAL.mossGreen);
    px(ctx, 80 + 3, 15, PAL.mossGreen);
    px(ctx, 80 + 12, 15, PAL.mossGreen);

    // --- Tile 6 (GID 7): Tree trunk ---
    srand(700);
    rect(ctx, 96, 0, 16, 16, PAL.grassMid); // grass background
    for (let i = 0; i < 8; i++) {
      px(ctx, 96 + randInt(0, 15), randInt(0, 15), PAL.grassLight);
    }
    // Trunk
    rect(ctx, 96 + 5, 0, 6, 16, PAL.woodMid);
    rect(ctx, 96 + 5, 0, 2, 16, PAL.woodDark);
    rect(ctx, 96 + 9, 0, 2, 16, PAL.woodLight);
    // Bark texture
    for (let y = 0; y < 16; y += 3) {
      px(ctx, 96 + 7, y, PAL.woodDark);
      px(ctx, 96 + 8, y + 1, PAL.woodLight);
    }
    // Roots at bottom
    rect(ctx, 96 + 3, 13, 2, 3, PAL.woodDark);
    rect(ctx, 96 + 11, 14, 2, 2, PAL.woodDark);

    // --- Tile 7 (GID 8): Tree canopy ---
    srand(800);
    rect(ctx, 112, 0, 16, 16, PAL.leafMid);
    for (let i = 0; i < 20; i++) {
      px(ctx, 112 + randInt(0, 15), randInt(0, 15), PAL.leafDark);
    }
    for (let i = 0; i < 15; i++) {
      px(ctx, 112 + randInt(0, 15), randInt(0, 15), PAL.leafLight);
    }
    // Top highlights (sunlit)
    for (let i = 0; i < 8; i++) {
      px(ctx, 112 + randInt(3, 13), randInt(0, 5), PAL.leafHighlight);
    }
    // Bottom shadow
    for (let i = 0; i < 6; i++) {
      px(ctx, 112 + randInt(1, 14), randInt(12, 15), PAL.leafDark);
    }
    // Round shape: trim corners
    px(ctx, 112, 0, PAL.grassMid); px(ctx, 113, 0, PAL.grassMid);
    px(ctx, 112 + 14, 0, PAL.grassMid); px(ctx, 112 + 15, 0, PAL.grassMid);
    px(ctx, 112, 1, PAL.grassMid);
    px(ctx, 112 + 15, 1, PAL.grassMid);

    // --- Tile 8 (GID 9): Red roof ---
    srand(900);
    rect(ctx, 128, 0, 16, 16, PAL.roofRed);
    for (let y = 0; y < 16; y += 4) {
      rect(ctx, 128, y, 16, 1, PAL.roofRedDark);
      for (let x = (y % 8 === 0 ? 0 : 4); x < 16; x += 8) {
        rect(ctx, 128 + x, y + 1, 4, 3, PAL.roofRedLight);
      }
    }

    // --- Tile 9 (GID 10): Wooden floor ---
    srand(1000);
    rect(ctx, 144, 0, 16, 16, PAL.woodMid);
    for (let y = 0; y < 16; y += 4) {
      rect(ctx, 144, y, 16, 1, PAL.woodDark);
    }
    for (let i = 0; i < 10; i++) {
      px(ctx, 144 + randInt(0, 15), randInt(0, 15), PAL.woodLight);
    }
    for (let i = 0; i < 5; i++) {
      px(ctx, 144 + randInt(0, 15), randInt(0, 15), PAL.woodDark);
    }
  });
}

/**
 * Character sprite sheet: 4 frames x 16x16 in a 64x16 strip.
 * Ghibli-style character with hair, clothing, and walk animation.
 */
function makePlayerImage(): HTMLImageElement {
  return createImageFromCanvas(64, 16, (ctx) => {
    for (let f = 0; f < 4; f++) {
      const ox = f * 16;
      const bounce = (f === 1 || f === 3) ? -1 : 0;
      const legOffset = f === 1 ? 1 : f === 3 ? -1 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(ox + 4, 14, 8, 2);

      // Cape/cloak (behind body)
      rect(ctx, ox + 4, 7 + bounce, 9, 7, PAL.capeBlueDark);
      rect(ctx, ox + 5, 7 + bounce, 7, 6, PAL.capeBlue);

      // Body / tunic
      rect(ctx, ox + 5, 7 + bounce, 6, 5, PAL.dressWhite);
      rect(ctx, ox + 5, 8 + bounce, 6, 4, '#d8d4cc');

      // Belt
      rect(ctx, ox + 5, 11 + bounce, 6, 1, PAL.woodDark);

      // Legs
      rect(ctx, ox + 5, 12 + bounce + (legOffset > 0 ? 0 : 0), 2, 3, PAL.capeBlueDark);
      rect(ctx, ox + 9, 12 + bounce + (legOffset < 0 ? 0 : 0), 2, 3, PAL.capeBlueDark);
      if (f === 1) {
        rect(ctx, ox + 5, 13, 2, 2, PAL.capeBlueDark);
        rect(ctx, ox + 9, 12, 2, 2, PAL.capeBlueDark);
      } else if (f === 3) {
        rect(ctx, ox + 5, 12, 2, 2, PAL.capeBlueDark);
        rect(ctx, ox + 9, 13, 2, 2, PAL.capeBlueDark);
      }

      // Boots
      if (f !== 1) px(ctx, ox + 5, 14 + bounce, PAL.woodDark);
      if (f !== 3) px(ctx, ox + 10, 14 + bounce, PAL.woodDark);

      // Head
      rect(ctx, ox + 5, 2 + bounce, 6, 6, PAL.skinLight);
      rect(ctx, ox + 6, 3 + bounce, 4, 4, PAL.skinMid);

      // Hair
      rect(ctx, ox + 4, 1 + bounce, 8, 3, PAL.hairBrown);
      rect(ctx, ox + 5, 1 + bounce, 6, 2, PAL.hairBrown);
      px(ctx, ox + 4, 3 + bounce, PAL.hairBrown); // sideburn L
      px(ctx, ox + 11, 3 + bounce, PAL.hairBrown); // sideburn R
      // Hair highlight
      px(ctx, ox + 6, 1 + bounce, '#8a6548');
      px(ctx, ox + 7, 1 + bounce, '#8a6548');

      // Eyes
      px(ctx, ox + 6, 4 + bounce, '#2a3050');
      px(ctx, ox + 9, 4 + bounce, '#2a3050');
      // Eye whites
      px(ctx, ox + 7, 4 + bounce, '#e8e8f0');
      px(ctx, ox + 10, 4 + bounce, '#e8e8f0');

      // Mouth
      px(ctx, ox + 8, 6 + bounce, '#c08880');

      // Arms
      rect(ctx, ox + 3, 8 + bounce, 2, 3, PAL.skinLight);
      rect(ctx, ox + 11, 8 + bounce, 2, 3, PAL.skinLight);
      // Arm sway
      if (f === 1) {
        px(ctx, ox + 3, 9 + bounce, PAL.skinMid);
      } else if (f === 3) {
        px(ctx, ox + 12, 9 + bounce, PAL.skinMid);
      }
    }
  });
}

/**
 * NPC sage: 4-frame idle animation (subtle sway)
 */
function makeNpcImage(): HTMLImageElement {
  return createImageFromCanvas(64, 16, (ctx) => {
    for (let f = 0; f < 4; f++) {
      const ox = f * 16;
      const sway = f === 1 ? 1 : f === 3 ? -1 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(ox + 4, 14, 9, 2);

      // Robe
      rect(ctx, ox + 4, 6, 9, 10, PAL.robeRed);
      rect(ctx, ox + 5, 6, 7, 9, '#a83838');
      // Robe hem
      rect(ctx, ox + 3, 13, 11, 2, PAL.robeRed);
      // Inner robe
      rect(ctx, ox + 7, 7, 3, 7, PAL.robeBrown);

      // Head
      rect(ctx, ox + 5 + sway, 1, 7, 6, PAL.skinMid);
      rect(ctx, ox + 6 + sway, 2, 5, 4, PAL.skinLight);

      // Beard
      rect(ctx, ox + 6 + sway, 5, 5, 3, PAL.beardWhite);
      rect(ctx, ox + 7 + sway, 7, 3, 2, PAL.hairWhite);

      // Hair/hat
      rect(ctx, ox + 5 + sway, 0, 7, 2, PAL.hairWhite);
      rect(ctx, ox + 4 + sway, 1, 2, 2, PAL.hairWhite);
      rect(ctx, ox + 11 + sway, 1, 2, 2, PAL.hairWhite);

      // Eyes
      px(ctx, ox + 7 + sway, 3, '#2a2020');
      px(ctx, ox + 10 + sway, 3, '#2a2020');
      // Eyebrows
      px(ctx, ox + 7 + sway, 2, PAL.hairWhite);
      px(ctx, ox + 10 + sway, 2, PAL.hairWhite);

      // Staff
      const staffX = ox + 13 + (f % 2 === 0 ? 0 : 0);
      rect(ctx, staffX, 0, 1, 15, PAL.woodMid);
      rect(ctx, staffX - 1, 0, 3, 2, '#d0a040'); // staff orb
      px(ctx, staffX, 0, '#f0d060');
    }
  });
}

/** Interaction marker "!" with glow effect */
function makeMarkerImage(): HTMLImageElement {
  return createImageFromCanvas(16, 16, (ctx) => {
    // Glow
    ctx.fillStyle = 'rgba(255, 220, 80, 0.25)';
    ctx.fillRect(4, 0, 8, 16);
    ctx.fillRect(2, 2, 12, 12);
    // Exclamation mark
    rect(ctx, 7, 2, 3, 8, '#ffd840');
    rect(ctx, 7, 12, 3, 3, '#ffd840');
    // Inner highlight
    px(ctx, 8, 3, '#fff8e0');
    px(ctx, 8, 13, '#fff8e0');
  });
}

/** 1x1 white pixel for particle rendering */
function makeParticleImage(): HTMLImageElement {
  return createImageFromCanvas(4, 4, (ctx) => {
    rect(ctx, 0, 0, 4, 4, '#ffffff');
    // Slight rounded look
    px(ctx, 0, 0, 'rgba(255,255,255,0.3)');
    px(ctx, 3, 0, 'rgba(255,255,255,0.3)');
    px(ctx, 0, 3, 'rgba(255,255,255,0.3)');
    px(ctx, 3, 3, 'rgba(255,255,255,0.3)');
  });
}

// ---------------------------------------------------------------------------
// Map data — a charming Ghibli village
// ---------------------------------------------------------------------------

// 30x20 map, 16px tiles → 480x320 world
// GIDs: 1=grass, 2=dark grass, 3=flowers, 4=dirt, 5=water,
//        6=stone, 7=trunk, 8=canopy, 9=roof, 10=floor
const G = 1, D = 2, F = 3, P = 4, W = 5, S = 6, T = 7, C = 8, R = 9, FL = 10;

const MAP_DATA: TiledMap = {
  type: 'map',
  version: '1.10',
  orientation: 'orthogonal',
  renderorder: 'right-down',
  width: 30,
  height: 20,
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
      tilecount: 10,
      columns: 10,
      image: 'tiles.png',
      imagewidth: 160,
      imageheight: 16,
    },
  ],
  layers: [
    {
      type: 'tilelayer',
      id: 1,
      name: 'Ground',
      width: 30,
      height: 20,
      x: 0, y: 0,
      opacity: 1,
      visible: true,
      // prettier-ignore
      data: [
        // Row 0: forest border (top)
        C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C,
        // Row 1
        C, C, D, D, G, G, F, G, G, D, C, C, G, G, P, P, G, G, G, G, C, C, D, G, G, G, F, G, C, C,
        // Row 2
        C, D, G, G, G, F, G, G, G, G, D, G, G, P, P, G, G, F, G, G, G, D, G, G, G, G, G, G, D, C,
        // Row 3: village area starts
        C, D, G, G, G, G, G, G, G, G, G, G, P, P, G, G, G, G, G, F, G, G, G, G, W, W, G, G, D, C,
        // Row 4
        C, G, G, F, G, R, R, R, G, G, G, P, P, G, G, G, R, R, R, G, G, G, G, W, W, W, W, G, G, C,
        // Row 5
        C, G, G, G, G, R, R, R, G, G, P, P, G, G, G, G, R, R, R, G, G, F, G, G, W, W, G, G, G, C,
        // Row 6
        C, G, G, G, G,FL,FL,FL, G, P, P, G, G, G, G, G,FL,FL,FL, G, G, G, G, G, G, G, G, F, G, C,
        // Row 7: main path
        C, D, G, G, G, G, P, G, P, P, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, D, C,
        // Row 8
        C, G, G, F, G, P, P, P, P, G, G, G, F, G, G, G, P, P, P, G, G, G, T, G, G, G, G, G, G, C,
        // Row 9
        C, G, G, G, P, P, G, G, G, G, G, G, G, G, F, G, G, G, P, P, G, C, C, C, G, G, F, G, G, C,
        // Row 10
        C, G, G, P, P, G, G, G, G, T, G, G, G, G, G, G, G, G, G, P, P, G, T, G, G, G, G, G, G, C,
        // Row 11
        C, G, P, P, G, G, G, G, C, C, C, G, G, F, G, G, G, G, G, G, P, G, G, G, G, G, G, G, D, C,
        // Row 12
        C, G, P, G, G, F, G, G, G, T, G, G, G, G, G, G, R, R, R, G, P, G, G, G, F, G, G, D, C, C,
        // Row 13
        C, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, R, R, R, G, P, P, G, G, G, G, D, C, C, C,
        // Row 14
        C, G, P, P, G, G, G, G, G, G, G, F, G, G, G, G,FL,FL,FL, G, G, P, P, G, G, D, C, C, C, C,
        // Row 15
        C, D, G, P, P, G, G, F, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, P, D, C, C, C, C, C,
        // Row 16
        C, D, G, G, P, P, G, G, G, G, G, G, G, G, F, G, G, G, G, F, G, G, G, D, C, C, C, C, C, C,
        // Row 17
        C, C, D, G, G, P, P, P, G, G, F, G, G, G, G, G, G, F, G, G, G, G, D, C, C, C, C, C, C, C,
        // Row 18
        C, C, C, D, D, G, G, P, P, P, G, G, G, G, G, G, G, G, G, D, D, D, C, C, C, C, C, C, C, C,
        // Row 19: forest border (bottom)
        C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C,
      ],
    },
    {
      type: 'tilelayer',
      id: 2,
      name: 'collision',
      width: 30,
      height: 20,
      x: 0, y: 0,
      opacity: 1,
      visible: false,
      // 0=passable, 1=solid
      // prettier-ignore
      data: [
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,
        1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,0,0,1,
        1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,
        1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,
        1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      ],
    },
    {
      type: 'objectgroup',
      id: 3,
      name: 'Entities',
      draworder: 'topdown' as const,
      x: 0, y: 0,
      opacity: 1,
      visible: true,
      objects: [
        {
          id: 1,
          name: 'PlayerSpawn',
          type: 'Spawn',
          x: 80,
          y: 128,
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
          x: 272,
          y: 112,
          width: 16,
          height: 16,
          rotation: 0,
          visible: true,
        },
      ],
    },
  ],
  properties: [
    { name: 'title', type: 'string', value: 'Windmill Village' },
  ],
};

// ---------------------------------------------------------------------------
// Ambient particle system (pollen / petals drifting in the wind)
// ---------------------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  tint: [number, number, number];
  opacity: number;
}

class ParticleEmitter {
  particles: Particle[] = [];
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth: number, worldHeight: number, count: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.spawn());
    }
  }

  private spawn(): Particle {
    const isPetal = Math.random() > 0.6;
    return {
      x: Math.random() * this.worldWidth,
      y: Math.random() * this.worldHeight,
      vx: 8 + Math.random() * 12,
      vy: -3 + Math.random() * 6,
      life: 0,
      maxLife: 4 + Math.random() * 6,
      size: isPetal ? 1.5 + Math.random() : 0.8 + Math.random() * 0.5,
      tint: isPetal
        ? [1.0, 0.85 + Math.random() * 0.15, 0.85 + Math.random() * 0.1]
        : [1.0, 1.0, 0.9 + Math.random() * 0.1],
      opacity: 0.2 + Math.random() * 0.4,
    };
  }

  update(dt: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt + Math.sin(p.life * 2) * dt * 4;
      p.life += dt;
      if (p.life > p.maxLife || p.x > this.worldWidth + 20 || p.y < -20 || p.y > this.worldHeight + 20) {
        this.particles[i] = this.spawn();
        this.particles[i].x = -10;
      }
    }
  }

  draw(batch: any, texture: Texture, cameraPos: Vector2, viewW: number, viewH: number) {
    const halfW = viewW / 2;
    const halfH = viewH / 2;
    for (const p of this.particles) {
      // Only draw particles near camera
      if (
        p.x < cameraPos.x - halfW - 20 || p.x > cameraPos.x + halfW + 20 ||
        p.y < cameraPos.y - halfH - 20 || p.y > cameraPos.y + halfH + 20
      ) continue;

      const fadeIn = Math.min(p.life * 2, 1);
      const fadeOut = Math.max(0, 1 - (p.life - p.maxLife + 1));
      const alpha = p.opacity * fadeIn * fadeOut;
      if (alpha <= 0) continue;

      const sprite = new Sprite(texture, {
        position: new Vector2(p.x, p.y),
        origin: new Vector2(0.5, 0.5),
        scale: new Vector2(p.size, p.size),
        tint: p.tint,
        opacity: alpha,
      });
      batch.draw(sprite);
    }
  }
}

// ---------------------------------------------------------------------------
// Typewriter text effect
// ---------------------------------------------------------------------------

class TypewriterText {
  fullText = '';
  visibleChars = 0;
  speed = 35; // chars per second
  private elapsed = 0;
  done = true;

  start(text: string) {
    this.fullText = text;
    this.visibleChars = 0;
    this.elapsed = 0;
    this.done = false;
  }

  update(dt: number) {
    if (this.done) return;
    this.elapsed += dt;
    this.visibleChars = Math.min(
      this.fullText.length,
      Math.floor(this.elapsed * this.speed),
    );
    if (this.visibleChars >= this.fullText.length) {
      this.done = true;
    }
  }

  skip() {
    this.visibleChars = this.fullText.length;
    this.done = true;
  }

  get text(): string {
    return this.fullText.slice(0, this.visibleChars);
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function main() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;

  const engine = new Engine({
    canvas,
    width: 640,
    height: 480,
    clearColor: [0.18, 0.22, 0.15, 1], // Muted forest green background
  });

  const gl = engine.renderer.gl;

  // Generate textures
  const tilesetImg = makeTilesetImage();
  const playerImg = makePlayerImage();
  const npcImg = makeNpcImage();
  const markerImg = makeMarkerImage();
  const particleImg = makeParticleImage();

  await Promise.all(
    [tilesetImg, playerImg, npcImg, markerImg, particleImg].map(
      (img) => img.decode?.() ?? new Promise<void>((r) => { img.onload = () => r(); }),
    ),
  );

  const tilesetTex = new Texture(gl, tilesetImg, { filter: TextureFilter.Nearest });
  const playerTex = new Texture(gl, playerImg, { filter: TextureFilter.Nearest });
  const npcTex = new Texture(gl, npcImg, { filter: TextureFilter.Nearest });
  const markerTex = new Texture(gl, markerImg, { filter: TextureFilter.Nearest });
  const particleTex = new Texture(gl, particleImg, { filter: TextureFilter.Nearest });

  // -----------------------------------------------------------------------
  // Tilemap
  // -----------------------------------------------------------------------

  const textures = new Map([['tiles', tilesetTex]]);
  const tileMap = new TileMap(MAP_DATA, textures);

  // -----------------------------------------------------------------------
  // Player
  // -----------------------------------------------------------------------

  const spawnObj = tileMap.getObject('PlayerSpawn');
  const player = new Entity(spawnObj?.x ?? 80, spawnObj?.y ?? 128);
  player.bounds = new Rectangle(-5, -3, 10, 10);

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
      duration: 0.12,
    })),
    true,
  );
  const idleClip = new AnimationClip('idle', [
    { sourceRect: new Rectangle(0, 0, 16, 16), duration: 0.6 },
    { sourceRect: new Rectangle(16, 0, 16, 16), duration: 0.6 },
  ]);

  const animator = new Animator(playerSprite);
  animator.addClip(walkClip);
  animator.addClip(idleClip);
  animator.play('idle');

  // -----------------------------------------------------------------------
  // NPC
  // -----------------------------------------------------------------------

  const npcData = tileMap.getObjects('NPC')[0];
  const npc = new Entity(npcData.x, npcData.y);
  const npcSprite = new Sprite(npcTex, {
    sourceRect: new Rectangle(0, 0, 16, 16),
    origin: new Vector2(0.5, 0.5),
    scale: new Vector2(2, 2),
  });
  npc.sprite = npcSprite;
  npc.bounds = new Rectangle(-8, -8, 16, 16);

  // NPC idle animation (gentle sway)
  const npcIdleClip = new AnimationClip('idle', [
    { sourceRect: new Rectangle(0, 0, 16, 16), duration: 0.8 },
    { sourceRect: new Rectangle(16, 0, 16, 16), duration: 0.8 },
    { sourceRect: new Rectangle(32, 0, 16, 16), duration: 0.8 },
    { sourceRect: new Rectangle(48, 0, 16, 16), duration: 0.8 },
  ]);
  const npcAnimator = new Animator(npcSprite);
  npcAnimator.addClip(npcIdleClip);
  npcAnimator.play('idle');

  const markerSprite = new Sprite(markerTex, {
    origin: new Vector2(0.5, 1),
    scale: new Vector2(1.5, 1.5),
  });

  // -----------------------------------------------------------------------
  // Particles
  // -----------------------------------------------------------------------

  const particles = new ParticleEmitter(tileMap.pixelWidth, tileMap.pixelHeight, 40);

  // -----------------------------------------------------------------------
  // Dialogue
  // -----------------------------------------------------------------------

  const dialogue = new DialogueSystem();
  dialogue.addNodes([
    {
      id: 'sage_intro',
      lines: [
        { speaker: 'Elder Kaede', text: 'Ah, a traveler! Welcome to Windmill Village.' },
        { speaker: 'Elder Kaede', text: 'The wind carries the scent of wildflowers today...' },
        { speaker: 'Elder Kaede', text: 'This world was shaped by the JRPG engine, you know.' },
        {
          speaker: 'Elder Kaede',
          text: 'What brings you to our little village?',
          choices: [
            { text: 'Tell me about this place', next: 'sage_lore' },
            { text: 'I\'m just passing through', next: 'sage_bye' },
          ],
        },
      ],
    },
    {
      id: 'sage_lore',
      lines: [
        { speaker: 'Elder Kaede', text: 'This village sits at the edge of the Emerald Forest.' },
        { speaker: 'Elder Kaede', text: 'We have tilemaps painted tile by tile, entities that live and breathe...' },
        { speaker: 'Elder Kaede', text: 'A collision system that keeps us grounded, animations that bring us life.' },
        { speaker: 'Elder Kaede', text: 'And of course, this dialogue system connecting our hearts.' },
      ],
      next: 'sage_bye',
    },
    {
      id: 'sage_bye',
      lines: [
        { speaker: 'Elder Kaede', text: 'May the wind guide your journey. Explore freely, young one!' },
      ],
    },
  ]);

  const dlgBox = document.getElementById('dialogue-box')!;
  const dlgSpeaker = document.getElementById('dlg-speaker')!;
  const dlgTextContent = document.getElementById('dlg-text-content')!;
  const dlgHint = document.getElementById('dlg-hint')!;
  const typewriter = new TypewriterText();

  dialogue.onEvent((e) => {
    if (e.type === 'line') {
      dlgBox.style.display = 'block';
      dlgSpeaker.textContent = e.line.speaker ?? '';
      typewriter.start(e.line.text);
      dlgHint.textContent = '';
    } else if (e.type === 'choices') {
      dlgHint.textContent = e.choices.map((c, i) => `[${i + 1}] ${c.text}`).join('    ');
    } else if (e.type === 'end') {
      dlgBox.style.display = 'none';
    }
  });

  // -----------------------------------------------------------------------
  // Input
  // -----------------------------------------------------------------------

  engine.inputMap.map('up', ['ArrowUp', 'KeyW']);
  engine.inputMap.map('down', ['ArrowDown', 'KeyS']);
  engine.inputMap.map('left', ['ArrowLeft', 'KeyA']);
  engine.inputMap.map('right', ['ArrowRight', 'KeyD']);
  engine.inputMap.map('interact', ['Space']);
  engine.inputMap.map('choice1', ['Digit1']);
  engine.inputMap.map('choice2', ['Digit2']);

  // -----------------------------------------------------------------------
  // Systems
  // -----------------------------------------------------------------------

  const collisionSystem = new CollisionSystem();

  const camera = engine.renderer.camera;
  camera.zoom = 2.5;
  camera.follow(player, 0.08);

  // -----------------------------------------------------------------------
  // Game loop
  // -----------------------------------------------------------------------

  const PLAYER_SPEED = 70;
  const NPC_INTERACT_DIST = 36;
  let nearNpc = false;
  let markerBob = 0;
  let gameTime = 0;

  engine.onUpdate((dt) => {
    gameTime += dt;
    particles.update(dt);
    npcAnimator.update(dt);

    // Typewriter
    typewriter.update(dt);
    if (dialogue.active) {
      dlgTextContent.textContent = typewriter.text;
    }

    // Dialogue input
    if (dialogue.active) {
      if (engine.inputMap.isJustPressed('interact')) {
        if (dialogue.waitingForChoice) {
          // wait for number
        } else if (!typewriter.done) {
          typewriter.skip();
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

    // NPC proximity
    const dist = player.position.distance(npc.position);
    nearNpc = dist < NPC_INTERACT_DIST;

    if (nearNpc && engine.inputMap.isJustPressed('interact')) {
      dialogue.start('sage_intro');
    }

    markerBob += dt * 3.5;
  });

  engine.onRender((_interpolation) => {
    const batch = engine.renderer.spriteBatch;

    // Draw tilemap
    tileMap.draw(batch);

    // Particles (behind characters)
    const camPos = camera.position;
    const viewW = camera.viewportWidth / camera.zoom;
    const viewH = camera.viewportHeight / camera.zoom;
    particles.draw(batch, particleTex, camPos, viewW, viewH);

    // NPC
    npcSprite.position = npc.position;
    batch.draw(npcSprite);

    // Interaction marker
    if (nearNpc && !dialogue.active) {
      const bobY = Math.sin(markerBob) * 3;
      const pulseScale = 1.3 + Math.sin(markerBob * 1.5) * 0.15;
      markerSprite.position = new Vector2(
        npc.position.x,
        npc.position.y - 22 + bobY,
      );
      markerSprite.scale = new Vector2(pulseScale, pulseScale);
      markerSprite.opacity = 0.7 + Math.sin(markerBob * 2) * 0.3;
      batch.draw(markerSprite);
    }

    // Player
    player.draw(batch);
  });

  // FPS display
  const fpsEl = document.getElementById('fps')!;
  setInterval(() => {
    fpsEl.textContent = `${engine.fps} FPS`;
  }, 500);

  // When clicking "Space" on the page shows hint
  const hint = document.querySelector('#dlg-hint')!;
  if (hint.textContent === '') {
    hint.textContent = '';
  }

  engine.start();
  console.log(
    `%c JRPG Engine %c ${tileMap.getProperty('title')} — ${tileMap.pixelWidth}x${tileMap.pixelHeight}px`,
    'background:#3858a0;color:#fff;padding:2px 8px;border-radius:3px;font-weight:bold',
    'color:#7a9a55',
  );
}

main().catch(console.error);
