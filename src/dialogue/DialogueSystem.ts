/**
 * A dialogue entry: one "page" of text with an optional speaker name.
 */
export interface DialogueLine {
  speaker?: string;
  text: string;
  /** Optional choices for branching dialogue. */
  choices?: DialogueChoice[];
}

export interface DialogueChoice {
  text: string;
  /** Key to jump to in the dialogue tree, or callback. */
  next?: string;
}

export interface DialogueNode {
  id: string;
  lines: DialogueLine[];
  /** Next node ID after all lines are shown (if no choices). */
  next?: string;
}

export type DialogueCallback = (event: DialogueEvent) => void;

export type DialogueEvent =
  | { type: 'line'; line: DialogueLine; nodeId: string; lineIndex: number }
  | { type: 'choices'; choices: DialogueChoice[]; nodeId: string }
  | { type: 'end' };

/**
 * JRPG-style dialogue system. Manages dialogue trees and text progression.
 *
 * Usage:
 *   const dialogue = new DialogueSystem();
 *   dialogue.addNode({ id: 'start', lines: [{ speaker: 'NPC', text: 'Hello!' }] });
 *   dialogue.onEvent((e) => { ... render text box ... });
 *   dialogue.start('start');
 *   // On player input:
 *   dialogue.advance();
 */
export class DialogueSystem {
  private nodes = new Map<string, DialogueNode>();
  private currentNode: DialogueNode | null = null;
  private currentLineIndex = 0;
  private _active = false;
  private _waitingForChoice = false;
  private listeners: DialogueCallback[] = [];

  /**
   * Register a dialogue node.
   */
  addNode(node: DialogueNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Register multiple dialogue nodes.
   */
  addNodes(nodes: DialogueNode[]): void {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
  }

  /**
   * Subscribe to dialogue events.
   */
  onEvent(callback: DialogueCallback): void {
    this.listeners.push(callback);
  }

  /**
   * Remove an event listener.
   */
  offEvent(callback: DialogueCallback): void {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  /**
   * Start a dialogue sequence from a node ID.
   */
  start(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Dialogue node "${nodeId}" not found`);

    this.currentNode = node;
    this.currentLineIndex = 0;
    this._active = true;
    this._waitingForChoice = false;
    this.emitCurrentLine();
  }

  /**
   * Advance to the next line or end the dialogue.
   * Call when the player presses the "confirm" button.
   */
  advance(): void {
    if (!this._active || !this.currentNode || this._waitingForChoice) return;

    this.currentLineIndex++;

    if (this.currentLineIndex < this.currentNode.lines.length) {
      this.emitCurrentLine();
    } else {
      // Check for choices on the last line
      const lastLine = this.currentNode.lines[this.currentNode.lines.length - 1];
      if (lastLine.choices && lastLine.choices.length > 0) {
        this._waitingForChoice = true;
        this.emit({
          type: 'choices',
          choices: lastLine.choices,
          nodeId: this.currentNode.id,
        });
        return;
      }

      // Move to next node or end
      if (this.currentNode.next) {
        this.start(this.currentNode.next);
      } else {
        this.end();
      }
    }
  }

  /**
   * Select a choice by index (when waiting for player choice).
   */
  selectChoice(index: number): void {
    if (!this._waitingForChoice || !this.currentNode) return;

    const lastLine = this.currentNode.lines[this.currentNode.lines.length - 1];
    const choices = lastLine.choices;
    if (!choices || index < 0 || index >= choices.length) return;

    this._waitingForChoice = false;
    const choice = choices[index];

    if (choice.next) {
      this.start(choice.next);
    } else {
      this.end();
    }
  }

  /**
   * End the current dialogue.
   */
  end(): void {
    this._active = false;
    this._waitingForChoice = false;
    this.currentNode = null;
    this.emit({ type: 'end' });
  }

  get active(): boolean {
    return this._active;
  }

  get waitingForChoice(): boolean {
    return this._waitingForChoice;
  }

  get currentSpeaker(): string | undefined {
    if (!this.currentNode) return undefined;
    return this.currentNode.lines[this.currentLineIndex]?.speaker;
  }

  get currentText(): string | undefined {
    if (!this.currentNode) return undefined;
    return this.currentNode.lines[this.currentLineIndex]?.text;
  }

  private emitCurrentLine(): void {
    if (!this.currentNode) return;
    const line = this.currentNode.lines[this.currentLineIndex];
    this.emit({
      type: 'line',
      line,
      nodeId: this.currentNode.id,
      lineIndex: this.currentLineIndex,
    });
  }

  private emit(event: DialogueEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
