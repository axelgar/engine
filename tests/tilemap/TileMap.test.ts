import { describe, it, expect } from 'vitest';
import { TileMap } from '../../src/tilemap/TileMap.js';
import { Rectangle } from '../../src/math/Rectangle.js';
import type { TiledMap } from '../../src/tilemap/TiledTypes.js';
import {
  FLIPPED_HORIZONTALLY,
  FLIPPED_VERTICALLY,
  GID_MASK,
} from '../../src/tilemap/TiledTypes.js';

function makeTiledMap(overrides: Partial<TiledMap> = {}): TiledMap {
  return {
    type: 'map',
    version: '1.10',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    width: 4,
    height: 4,
    tilewidth: 16,
    tileheight: 16,
    infinite: false,
    nextlayerid: 3,
    nextobjectid: 2,
    layers: [],
    tilesets: [
      {
        firstgid: 1,
        name: 'terrain',
        tilewidth: 16,
        tileheight: 16,
        tilecount: 64,
        columns: 8,
        image: 'terrain.png',
        imagewidth: 128,
        imageheight: 128,
      },
    ],
    ...overrides,
  };
}

function makeFakeTexture() {
  return { width: 128, height: 128 } as any;
}

describe('TileMap', () => {
  it('parses map dimensions', () => {
    const data = makeTiledMap();
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.width).toBe(4);
    expect(map.height).toBe(4);
    expect(map.tileWidth).toBe(16);
    expect(map.tileHeight).toBe(16);
    expect(map.pixelWidth).toBe(64);
    expect(map.pixelHeight).toBe(64);
  });

  it('resolves tile GIDs to local IDs', () => {
    const data = makeTiledMap();
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    const info = map.resolveTile(5);
    expect(info).not.toBeNull();
    expect(info!.gid).toBe(5);
    expect(info!.localId).toBe(4);
    expect(info!.flipH).toBe(false);
    expect(info!.flipV).toBe(false);
  });

  it('resolves GID 0 as null (empty tile)', () => {
    const data = makeTiledMap();
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.resolveTile(0)).toBeNull();
  });

  it('extracts flip flags from GIDs', () => {
    const data = makeTiledMap();
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    const rawGid = 3 | FLIPPED_HORIZONTALLY | FLIPPED_VERTICALLY;
    const info = map.resolveTile(rawGid);
    expect(info).not.toBeNull();
    expect(info!.gid).toBe(3);
    expect(info!.flipH).toBe(true);
    expect(info!.flipV).toBe(true);
    expect(info!.flipD).toBe(false);
  });

  it('converts world to tile coordinates', () => {
    const data = makeTiledMap();
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    const tile = map.worldToTile(24, 40);
    expect(tile.x).toBe(1);
    expect(tile.y).toBe(2);
  });

  it('converts tile to world coordinates', () => {
    const data = makeTiledMap();
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    const world = map.tileToWorld(2, 3);
    expect(world.x).toBe(32);
    expect(world.y).toBe(48);
  });

  it('detects collision with solid tiles', () => {
    const data = makeTiledMap({
      layers: [
        {
          type: 'tilelayer',
          id: 1,
          name: 'collision',
          width: 4,
          height: 4,
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          // Row 0: all solid, rest empty
          data: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.isTileSolid(0, 0)).toBe(true);
    expect(map.isTileSolid(3, 0)).toBe(true);
    expect(map.isTileSolid(0, 1)).toBe(false);
    expect(map.isTileSolid(2, 2)).toBe(false);
  });

  it('treats out-of-bounds as solid', () => {
    const data = makeTiledMap({
      layers: [
        {
          type: 'tilelayer',
          id: 1,
          name: 'collision',
          width: 4,
          height: 4,
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          data: new Array(16).fill(0),
        },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.isTileSolid(-1, 0)).toBe(true);
    expect(map.isTileSolid(0, -1)).toBe(true);
    expect(map.isTileSolid(4, 0)).toBe(true);
    expect(map.isTileSolid(0, 4)).toBe(true);
  });

  it('retrieves objects by type', () => {
    const data = makeTiledMap({
      layers: [
        {
          type: 'objectgroup',
          id: 2,
          name: 'Entities',
          draworder: 'topdown',
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          objects: [
            { id: 1, name: 'Player', type: 'Spawn', x: 10, y: 20, width: 16, height: 16, rotation: 0, visible: true },
            { id: 2, name: 'Enemy1', type: 'Enemy', x: 50, y: 60, width: 16, height: 16, rotation: 0, visible: true },
            { id: 3, name: 'Enemy2', type: 'Enemy', x: 80, y: 90, width: 16, height: 16, rotation: 0, visible: true },
          ],
        },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.getObjects('Enemy')).toHaveLength(2);
    expect(map.getObjects('Spawn')).toHaveLength(1);
    expect(map.getObjects()).toHaveLength(3);
  });

  it('gets a single object by name', () => {
    const data = makeTiledMap({
      layers: [
        {
          type: 'objectgroup',
          id: 2,
          name: 'Entities',
          draworder: 'topdown',
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          objects: [
            { id: 1, name: 'Player', type: 'Spawn', x: 10, y: 20, width: 0, height: 0, rotation: 0, visible: true },
          ],
        },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    const player = map.getObject('Player');
    expect(player).toBeDefined();
    expect(player!.x).toBe(10);
    expect(player!.y).toBe(20);
    expect(map.getObject('NonExistent')).toBeUndefined();
  });

  it('gets tile data from a named layer', () => {
    const data = makeTiledMap({
      layers: [
        {
          type: 'tilelayer',
          id: 1,
          name: 'Ground',
          width: 4,
          height: 4,
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          data: [1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.getTile('Ground', 0, 0)).toBe(1);
    expect(map.getTile('Ground', 2, 1)).toBe(7);
    expect(map.getTile('Ground', 0, 2)).toBe(0);
    expect(map.getTile('Unknown', 0, 0)).toBe(0);
  });

  it('exposes layer names', () => {
    const data = makeTiledMap({
      layers: [
        { type: 'tilelayer', id: 1, name: 'Ground', width: 4, height: 4, x: 0, y: 0, opacity: 1, visible: true, data: [] },
        { type: 'tilelayer', id: 2, name: 'Overlay', width: 4, height: 4, x: 0, y: 0, opacity: 1, visible: true, data: [] },
        { type: 'objectgroup', id: 3, name: 'Objects', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: [] },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.tileLayerNames).toEqual(['Ground', 'Overlay']);
    expect(map.objectLayerNames).toEqual(['Objects']);
  });

  it('parses custom properties', () => {
    const data = makeTiledMap({
      properties: [
        { name: 'music', type: 'string', value: 'overworld' },
        { name: 'difficulty', type: 'int', value: 3 },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    expect(map.getProperty('music')).toBe('overworld');
    expect(map.getProperty('difficulty')).toBe(3);
    expect(map.getProperty('nonexistent')).toBeUndefined();
  });

  it('handles rect collision with terrain', () => {
    const data = makeTiledMap({
      layers: [
        {
          type: 'tilelayer',
          id: 1,
          name: 'collision',
          width: 4,
          height: 4,
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          data: [
            1, 1, 1, 1,
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 1, 1, 1,
          ],
        },
      ],
    });
    const textures = new Map([['terrain', makeFakeTexture()]]);
    const map = new TileMap(data, textures);

    // Inside the open area (tiles 1,1 to 2,2) — no collision
    expect(map.rectCollidesWithTerrain(new Rectangle(20, 20, 8, 8))).toBe(false);
    // Overlapping the top wall — collision
    expect(map.rectCollidesWithTerrain(new Rectangle(16, 0, 8, 8))).toBe(true);
  });
});
