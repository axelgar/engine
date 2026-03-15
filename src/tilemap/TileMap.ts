import { Rectangle } from '../math/Rectangle.js';
import { Vector2 } from '../math/Vector2.js';
import { Sprite } from '../rendering/Sprite.js';
import type { SpriteBatch } from '../rendering/SpriteBatch.js';
import type { Texture } from '../rendering/Texture.js';
import type {
  TiledMap,
  TiledTileLayer,
  TiledObjectGroup,
  TiledObject,
  TiledTilesetRef,
  TiledProperty,
} from './TiledTypes.js';
import {
  FLIPPED_HORIZONTALLY,
  FLIPPED_VERTICALLY,
  FLIPPED_DIAGONALLY,
  ROTATED_HEX_120,
  GID_MASK,
} from './TiledTypes.js';

export interface TileInfo {
  gid: number;
  localId: number;
  tilesetIndex: number;
  flipH: boolean;
  flipV: boolean;
  flipD: boolean;
}

export interface TilesetBinding {
  firstgid: number;
  texture: Texture;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  tileCount: number;
  margin: number;
  spacing: number;
}

/**
 * Parsed tilemap that can render Tiled JSON maps.
 * Supports orthogonal maps with multiple tile layers and object layers.
 */
export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;

  private tileLayers: ParsedTileLayer[] = [];
  private objectLayers: ParsedObjectLayer[] = [];
  private tilesets: TilesetBinding[] = [];
  private collisionLayer: ParsedTileLayer | null = null;
  private spriteCache = new Map<string, Sprite>();
  private properties: Map<string, string | number | boolean>;

  constructor(data: TiledMap, textures: Map<string, Texture>) {
    this.width = data.width;
    this.height = data.height;
    this.tileWidth = data.tilewidth;
    this.tileHeight = data.tileheight;
    this.pixelWidth = this.width * this.tileWidth;
    this.pixelHeight = this.height * this.tileHeight;
    this.properties = parseProperties(data.properties);

    this.bindTilesets(data.tilesets, textures);
    this.parseLayers(data.layers);
  }

  private bindTilesets(refs: TiledTilesetRef[], textures: Map<string, Texture>): void {
    for (const ref of refs) {
      const name = ref.name ?? ref.source?.replace(/\.(tsj|json|tsx)$/, '') ?? '';
      const texture = textures.get(name);
      if (!texture) continue;

      this.tilesets.push({
        firstgid: ref.firstgid,
        texture,
        tileWidth: ref.tilewidth ?? this.tileWidth,
        tileHeight: ref.tileheight ?? this.tileHeight,
        columns: ref.columns ?? Math.floor(texture.width / (ref.tilewidth ?? this.tileWidth)),
        tileCount: ref.tilecount ?? 0,
        margin: ref.margin ?? 0,
        spacing: ref.spacing ?? 0,
      });
    }
    // Sort by firstgid descending for lookup
    this.tilesets.sort((a, b) => b.firstgid - a.firstgid);
  }

  private parseLayers(layers: TiledMap['layers']): void {
    for (const layer of layers) {
      if (layer.type === 'tilelayer') {
        const parsed = new ParsedTileLayer(layer);
        this.tileLayers.push(parsed);
        if (layer.name.toLowerCase() === 'collision') {
          this.collisionLayer = parsed;
        }
      } else if (layer.type === 'objectgroup') {
        this.objectLayers.push(new ParsedObjectLayer(layer));
      } else if (layer.type === 'group') {
        this.parseLayers(layer.layers);
      }
    }
  }

  /**
   * Resolve a raw GID (with flip flags) into tile info.
   */
  resolveTile(rawGid: number): TileInfo | null {
    const flipH = (rawGid & FLIPPED_HORIZONTALLY) !== 0;
    const flipV = (rawGid & FLIPPED_VERTICALLY) !== 0;
    const flipD = (rawGid & FLIPPED_DIAGONALLY) !== 0;
    const gid = rawGid & GID_MASK;

    if (gid === 0) return null;

    for (let i = 0; i < this.tilesets.length; i++) {
      const ts = this.tilesets[i];
      if (gid >= ts.firstgid) {
        return {
          gid,
          localId: gid - ts.firstgid,
          tilesetIndex: i,
          flipH,
          flipV,
          flipD,
        };
      }
    }
    return null;
  }

  /**
   * Get the tileset binding for a given tileset index.
   */
  getTileset(tilesetIndex: number): TilesetBinding {
    return this.tilesets[tilesetIndex];
  }

  /**
   * Draw all visible tile layers using the sprite batch.
   */
  draw(batch: SpriteBatch, viewRect?: Rectangle): void {
    for (const layer of this.tileLayers) {
      if (!layer.visible) continue;
      this.drawTileLayer(batch, layer, viewRect);
    }
  }

  /**
   * Draw a specific tile layer by name.
   */
  drawLayer(batch: SpriteBatch, name: string, viewRect?: Rectangle): void {
    const layer = this.tileLayers.find((l) => l.name === name);
    if (layer) this.drawTileLayer(batch, layer, viewRect);
  }

  private drawTileLayer(
    batch: SpriteBatch,
    layer: ParsedTileLayer,
    viewRect?: Rectangle,
  ): void {
    // Determine visible tile range
    let startCol = 0;
    let startRow = 0;
    let endCol = this.width;
    let endRow = this.height;

    if (viewRect) {
      startCol = Math.max(0, Math.floor(viewRect.x / this.tileWidth) - 1);
      startRow = Math.max(0, Math.floor(viewRect.y / this.tileHeight) - 1);
      endCol = Math.min(this.width, Math.ceil(viewRect.right / this.tileWidth) + 1);
      endRow = Math.min(this.height, Math.ceil(viewRect.bottom / this.tileHeight) + 1);
    }

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const rawGid = layer.getTile(col, row);
        if (rawGid === 0) continue;

        const info = this.resolveTile(rawGid);
        if (!info) continue;

        const ts = this.tilesets[info.tilesetIndex];
        const sprite = this.getOrCreateSprite(ts, info, col, row);
        if (sprite) {
          sprite.opacity = layer.opacity;
          batch.draw(sprite);
        }
      }
    }
  }

  private getOrCreateSprite(
    ts: TilesetBinding,
    info: TileInfo,
    col: number,
    row: number,
  ): Sprite | null {
    const cacheKey = `${info.gid}:${info.flipH ? 1 : 0}${info.flipV ? 1 : 0}${info.flipD ? 1 : 0}`;
    let sprite = this.spriteCache.get(cacheKey);

    if (!sprite) {
      const srcCol = info.localId % ts.columns;
      const srcRow = Math.floor(info.localId / ts.columns);
      const srcX = ts.margin + srcCol * (ts.tileWidth + ts.spacing);
      const srcY = ts.margin + srcRow * (ts.tileHeight + ts.spacing);

      sprite = new Sprite(ts.texture, {
        sourceRect: new Rectangle(srcX, srcY, ts.tileWidth, ts.tileHeight),
        origin: Vector2.ZERO,
        flipX: info.flipH !== info.flipD,
        flipY: info.flipV !== info.flipD,
      });
      this.spriteCache.set(cacheKey, sprite);
    }

    // Clone position for this tile instance
    const tileSprite = new Sprite(sprite.texture, {
      sourceRect: sprite.sourceRect ?? undefined,
      origin: Vector2.ZERO,
      position: new Vector2(col * this.tileWidth, row * this.tileHeight),
      flipX: sprite.flipX,
      flipY: sprite.flipY,
    });

    return tileSprite;
  }

  /**
   * Check if a tile at (col, row) on the collision layer is solid (non-zero).
   */
  isTileSolid(col: number, row: number): boolean {
    if (!this.collisionLayer) return false;
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return true;
    return (this.collisionLayer.getTile(col, row) & GID_MASK) !== 0;
  }

  /**
   * Check if a world-space rectangle collides with any solid tile.
   */
  rectCollidesWithTerrain(rect: Rectangle): boolean {
    if (!this.collisionLayer) return false;

    const startCol = Math.max(0, Math.floor(rect.x / this.tileWidth));
    const startRow = Math.max(0, Math.floor(rect.y / this.tileHeight));
    const endCol = Math.min(this.width - 1, Math.ceil(rect.right / this.tileWidth) - 1);
    const endRow = Math.min(this.height - 1, Math.ceil(rect.bottom / this.tileHeight) - 1);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (this.isTileSolid(col, row)) return true;
      }
    }
    return false;
  }

  /**
   * World-space position to tile coordinates.
   */
  worldToTile(worldX: number, worldY: number): Vector2 {
    return new Vector2(
      Math.floor(worldX / this.tileWidth),
      Math.floor(worldY / this.tileHeight),
    );
  }

  /**
   * Tile coordinates to world-space position (top-left of tile).
   */
  tileToWorld(col: number, row: number): Vector2 {
    return new Vector2(col * this.tileWidth, row * this.tileHeight);
  }

  /**
   * Get objects from all object layers, optionally filtered by type.
   */
  getObjects(type?: string): TiledObject[] {
    const result: TiledObject[] = [];
    for (const layer of this.objectLayers) {
      for (const obj of layer.objects) {
        if (!type || obj.type === type) {
          result.push(obj);
        }
      }
    }
    return result;
  }

  /**
   * Get objects from a specific object layer by name.
   */
  getObjectsByLayer(layerName: string, type?: string): TiledObject[] {
    const layer = this.objectLayers.find((l) => l.name === layerName);
    if (!layer) return [];
    if (!type) return layer.objects;
    return layer.objects.filter((o) => o.type === type);
  }

  /**
   * Get a single object by name (searches all object layers).
   */
  getObject(name: string): TiledObject | undefined {
    for (const layer of this.objectLayers) {
      const obj = layer.objects.find((o) => o.name === name);
      if (obj) return obj;
    }
    return undefined;
  }

  /**
   * Get a custom map property.
   */
  getProperty(name: string): string | number | boolean | undefined {
    return this.properties.get(name);
  }

  /**
   * Get the names of all tile layers.
   */
  get tileLayerNames(): string[] {
    return this.tileLayers.map((l) => l.name);
  }

  /**
   * Get the names of all object layers.
   */
  get objectLayerNames(): string[] {
    return this.objectLayers.map((l) => l.name);
  }

  /**
   * Get the raw tile GID at a position in a named layer.
   */
  getTile(layerName: string, col: number, row: number): number {
    const layer = this.tileLayers.find((l) => l.name === layerName);
    if (!layer) return 0;
    return layer.getTile(col, row);
  }
}

class ParsedTileLayer {
  readonly name: string;
  readonly visible: boolean;
  readonly opacity: number;
  readonly width: number;
  readonly height: number;
  private data: number[];
  private properties: Map<string, string | number | boolean>;

  constructor(layer: TiledTileLayer) {
    this.name = layer.name;
    this.visible = layer.visible;
    this.opacity = layer.opacity;
    this.width = layer.width;
    this.height = layer.height;
    this.data = layer.data ?? [];
    this.properties = parseProperties(layer.properties);
  }

  getTile(col: number, row: number): number {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return 0;
    return this.data[row * this.width + col] ?? 0;
  }

  getProperty(name: string): string | number | boolean | undefined {
    return this.properties.get(name);
  }
}

class ParsedObjectLayer {
  readonly name: string;
  readonly visible: boolean;
  readonly objects: TiledObject[];
  private properties: Map<string, string | number | boolean>;

  constructor(layer: TiledObjectGroup) {
    this.name = layer.name;
    this.visible = layer.visible;
    this.objects = layer.objects;
    this.properties = parseProperties(layer.properties);
  }

  getProperty(name: string): string | number | boolean | undefined {
    return this.properties.get(name);
  }
}

function parseProperties(
  props?: TiledProperty[],
): Map<string, string | number | boolean> {
  const map = new Map<string, string | number | boolean>();
  if (!props) return map;
  for (const p of props) {
    map.set(p.name, p.value);
  }
  return map;
}
