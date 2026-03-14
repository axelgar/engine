import { describe, it, expect, vi } from 'vitest';
import { AssetStore } from '../../src/assets/AssetStore.js';
import { AssetLoader } from '../../src/assets/AssetLoader.js';

describe('AssetStore', () => {
  it('stores and retrieves assets', () => {
    const store = new AssetStore();
    store.set('hero', { name: 'hero' });
    expect(store.get('hero')).toEqual({ name: 'hero' });
  });

  it('throws on missing asset', () => {
    const store = new AssetStore();
    expect(() => store.get('missing')).toThrow('Asset "missing" not found');
  });

  it('checks existence with has()', () => {
    const store = new AssetStore();
    expect(store.has('x')).toBe(false);
    store.set('x', 1);
    expect(store.has('x')).toBe(true);
  });

  it('deletes assets', () => {
    const store = new AssetStore();
    store.set('a', 1);
    store.delete('a');
    expect(store.has('a')).toBe(false);
  });

  it('clears all assets', () => {
    const store = new AssetStore();
    store.set('a', 1);
    store.set('b', 2);
    store.clear();
    expect(store.has('a')).toBe(false);
    expect(store.has('b')).toBe(false);
  });
});

describe('AssetLoader', () => {
  it('calls progress callback', async () => {
    const store = new AssetStore();
    const loader = new AssetLoader(store);

    // Mock the loadJson method to avoid actual fetch
    vi.spyOn(loader, 'loadJson').mockResolvedValue({});

    const progress = vi.fn();
    await loader.load({ json: { config: '/config.json' } }, progress);

    expect(progress).toHaveBeenCalledWith(1, 1);
  });
});
