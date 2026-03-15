import { describe, it, expect, vi } from 'vitest';
import { DialogueSystem } from '../../src/dialogue/DialogueSystem.js';
import type { DialogueEvent } from '../../src/dialogue/DialogueSystem.js';

describe('DialogueSystem', () => {
  it('starts a dialogue and emits the first line', () => {
    const system = new DialogueSystem();
    const events: DialogueEvent[] = [];

    system.addNode({
      id: 'greeting',
      lines: [
        { speaker: 'NPC', text: 'Hello there!' },
        { speaker: 'NPC', text: 'Nice day, huh?' },
      ],
    });

    system.onEvent((e) => events.push(e));
    system.start('greeting');

    expect(system.active).toBe(true);
    expect(system.currentSpeaker).toBe('NPC');
    expect(system.currentText).toBe('Hello there!');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('line');
  });

  it('advances through lines and ends', () => {
    const system = new DialogueSystem();
    const events: DialogueEvent[] = [];

    system.addNode({
      id: 'greeting',
      lines: [
        { text: 'Line 1' },
        { text: 'Line 2' },
      ],
    });

    system.onEvent((e) => events.push(e));
    system.start('greeting');

    system.advance(); // Move to line 2
    expect(system.currentText).toBe('Line 2');

    system.advance(); // Past last line -> ends
    expect(system.active).toBe(false);
    expect(events[events.length - 1].type).toBe('end');
  });

  it('chains to next node', () => {
    const system = new DialogueSystem();

    system.addNodes([
      { id: 'node1', lines: [{ text: 'First' }], next: 'node2' },
      { id: 'node2', lines: [{ text: 'Second' }] },
    ]);

    system.start('node1');
    expect(system.currentText).toBe('First');

    system.advance(); // Should chain to node2
    expect(system.currentText).toBe('Second');
    expect(system.active).toBe(true);
  });

  it('handles choices', () => {
    const system = new DialogueSystem();
    const events: DialogueEvent[] = [];

    system.addNodes([
      {
        id: 'question',
        lines: [
          {
            text: 'Yes or no?',
            choices: [
              { text: 'Yes', next: 'yes_response' },
              { text: 'No', next: 'no_response' },
            ],
          },
        ],
      },
      { id: 'yes_response', lines: [{ text: 'Great!' }] },
      { id: 'no_response', lines: [{ text: 'Okay then.' }] },
    ]);

    system.onEvent((e) => events.push(e));
    system.start('question');
    system.advance(); // Should trigger choices

    expect(system.waitingForChoice).toBe(true);
    const choiceEvent = events.find((e) => e.type === 'choices');
    expect(choiceEvent).toBeDefined();

    system.selectChoice(0); // Select "Yes"
    expect(system.currentText).toBe('Great!');
    expect(system.waitingForChoice).toBe(false);
  });

  it('ignores advance when waiting for choice', () => {
    const system = new DialogueSystem();

    system.addNode({
      id: 'q',
      lines: [{ text: 'Choose', choices: [{ text: 'A' }, { text: 'B' }] }],
    });

    system.start('q');
    system.advance(); // Triggers choices
    expect(system.waitingForChoice).toBe(true);

    system.advance(); // Should be ignored
    expect(system.waitingForChoice).toBe(true);
  });

  it('ends when choice has no next', () => {
    const system = new DialogueSystem();

    system.addNode({
      id: 'q',
      lines: [{ text: 'Choose', choices: [{ text: 'End' }] }],
    });

    system.start('q');
    system.advance();
    system.selectChoice(0);

    expect(system.active).toBe(false);
  });

  it('throws on unknown node', () => {
    const system = new DialogueSystem();
    expect(() => system.start('nonexistent')).toThrow('not found');
  });

  it('can remove event listeners', () => {
    const system = new DialogueSystem();
    let count = 0;
    const handler = () => { count++; };

    system.addNode({ id: 'test', lines: [{ text: 'Hi' }] });
    system.onEvent(handler);
    system.start('test');
    expect(count).toBe(1);

    system.offEvent(handler);
    system.advance();
    expect(count).toBe(1); // Should not have fired again
  });

  it('can end dialogue manually', () => {
    const system = new DialogueSystem();
    const events: DialogueEvent[] = [];

    system.addNode({ id: 'test', lines: [{ text: 'Hi' }, { text: 'Bye' }] });
    system.onEvent((e) => events.push(e));
    system.start('test');
    system.end();

    expect(system.active).toBe(false);
    expect(events[events.length - 1].type).toBe('end');
  });
});
