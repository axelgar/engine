/**
 * TypeScript interfaces matching the Tiled JSON map format (.tmj/.json).
 * Supports orthogonal maps with CSV/array tile data.
 */

export interface TiledMap {
  type: 'map';
  version: string;
  tiledversion?: string;
  orientation: 'orthogonal' | 'isometric' | 'staggered' | 'hexagonal';
  renderorder: 'right-down' | 'right-up' | 'left-down' | 'left-up';
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  infinite: boolean;
  backgroundcolor?: string;
  nextlayerid: number;
  nextobjectid: number;
  layers: TiledLayer[];
  tilesets: TiledTilesetRef[];
  properties?: TiledProperty[];
}

export type TiledLayer =
  | TiledTileLayer
  | TiledObjectGroup
  | TiledImageLayer
  | TiledGroupLayer;

export interface TiledLayerBase {
  id: number;
  name: string;
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  offsetx?: number;
  offsety?: number;
  parallaxx?: number;
  parallaxy?: number;
  tintcolor?: string;
  properties?: TiledProperty[];
}

export interface TiledTileLayer extends TiledLayerBase {
  type: 'tilelayer';
  width: number;
  height: number;
  data: number[];
  encoding?: 'csv' | 'base64';
  compression?: string;
  chunks?: TiledChunk[];
}

export interface TiledObjectGroup extends TiledLayerBase {
  type: 'objectgroup';
  draworder: 'topdown' | 'index';
  objects: TiledObject[];
  color?: string;
}

export interface TiledImageLayer extends TiledLayerBase {
  type: 'imagelayer';
  image: string;
  imagewidth?: number;
  imageheight?: number;
  transparentcolor?: string;
  repeatx?: boolean;
  repeaty?: boolean;
}

export interface TiledGroupLayer extends TiledLayerBase {
  type: 'group';
  layers: TiledLayer[];
}

export interface TiledChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  data: number[];
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  gid?: number;
  point?: boolean;
  ellipse?: boolean;
  polygon?: Array<{ x: number; y: number }>;
  polyline?: Array<{ x: number; y: number }>;
  text?: TiledText;
  template?: string;
  properties?: TiledProperty[];
}

export interface TiledText {
  text: string;
  fontfamily?: string;
  pixelsize?: number;
  wrap?: boolean;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  halign?: 'left' | 'center' | 'right' | 'justify';
  valign?: 'top' | 'center' | 'bottom';
}

export interface TiledTilesetRef {
  firstgid: number;
  source?: string;
  name?: string;
  tilewidth?: number;
  tileheight?: number;
  tilecount?: number;
  columns?: number;
  image?: string;
  imagewidth?: number;
  imageheight?: number;
  margin?: number;
  spacing?: number;
  transparentcolor?: string;
  tiles?: TiledTileDef[];
  properties?: TiledProperty[];
}

export interface TiledTileDef {
  id: number;
  type?: string;
  animation?: TiledFrame[];
  objectgroup?: TiledObjectGroup;
  properties?: TiledProperty[];
}

export interface TiledFrame {
  tileid: number;
  duration: number;
}

export interface TiledProperty {
  name: string;
  type: 'string' | 'int' | 'float' | 'bool' | 'color' | 'file' | 'object' | 'class';
  value: string | number | boolean;
}

/** GID flip flag bitmasks (bits 31-28). */
export const FLIPPED_HORIZONTALLY = 0x80000000;
export const FLIPPED_VERTICALLY = 0x40000000;
export const FLIPPED_DIAGONALLY = 0x20000000;
export const ROTATED_HEX_120 = 0x10000000;
export const GID_MASK = 0x0FFFFFFF;
