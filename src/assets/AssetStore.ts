/**
 * Typed asset registry. Stores loaded assets by key.
 */
export class AssetStore {
  private assets = new Map<string, unknown>();

  set(key: string, asset: unknown): void {
    this.assets.set(key, asset);
  }

  get<T>(key: string): T {
    const asset = this.assets.get(key);
    if (asset === undefined) {
      throw new Error(`Asset "${key}" not found`);
    }
    return asset as T;
  }

  has(key: string): boolean {
    return this.assets.has(key);
  }

  delete(key: string): void {
    this.assets.delete(key);
  }

  clear(): void {
    this.assets.clear();
  }
}
