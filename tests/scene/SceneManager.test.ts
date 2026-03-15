import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../../src/scene/SceneManager.js';
import { Scene } from '../../src/scene/Scene.js';

class TestScene extends Scene {
  entered = false;
  exited = false;
  paused = false;
  resumed = false;
  updated = false;
  rendered = false;

  enter() { this.entered = true; }
  exit() { this.exited = true; }
  update(_dt: number) { this.updated = true; }
  render(_interpolation: number) { this.rendered = true; }
  override pause() { this.paused = true; }
  override resume() { this.resumed = true; }
}

function makeFakeEngine(): any {
  return {
    renderer: {},
    input: {},
    assets: {},
    events: {},
  };
}

describe('SceneManager', () => {
  it('pushes and enters a scene', async () => {
    const sm = new SceneManager(makeFakeEngine());
    const scene = new TestScene();

    await sm.push(scene);

    expect(scene.entered).toBe(true);
    expect(sm.active).toBe(scene);
    expect(sm.depth).toBe(1);
  });

  it('pauses current scene when pushing new one', async () => {
    const sm = new SceneManager(makeFakeEngine());
    const scene1 = new TestScene();
    const scene2 = new TestScene();

    await sm.push(scene1);
    await sm.push(scene2);

    expect(scene1.paused).toBe(true);
    expect(scene2.entered).toBe(true);
    expect(sm.active).toBe(scene2);
    expect(sm.depth).toBe(2);
  });

  it('pops a scene and resumes previous', async () => {
    const sm = new SceneManager(makeFakeEngine());
    const scene1 = new TestScene();
    const scene2 = new TestScene();

    await sm.push(scene1);
    await sm.push(scene2);
    sm.pop();

    expect(scene2.exited).toBe(true);
    expect(scene1.resumed).toBe(true);
    expect(sm.active).toBe(scene1);
    expect(sm.depth).toBe(1);
  });

  it('replaces current scene', async () => {
    const sm = new SceneManager(makeFakeEngine());
    const scene1 = new TestScene();
    const scene2 = new TestScene();

    await sm.push(scene1);
    await sm.replace(scene2);

    expect(scene1.exited).toBe(true);
    expect(scene2.entered).toBe(true);
    expect(sm.active).toBe(scene2);
    expect(sm.depth).toBe(1);
  });

  it('updates and renders the active scene', async () => {
    const sm = new SceneManager(makeFakeEngine());
    const scene = new TestScene();

    await sm.push(scene);
    sm.update(1 / 60);
    sm.render(0.5);

    expect(scene.updated).toBe(true);
    expect(scene.rendered).toBe(true);
  });

  it('starts empty with no active scene', () => {
    const sm = new SceneManager(makeFakeEngine());
    expect(sm.active).toBeUndefined();
    expect(sm.depth).toBe(0);
  });
});
