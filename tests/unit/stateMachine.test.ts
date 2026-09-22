import { describe, it, expect, beforeEach } from 'vitest';
import { StateMachine } from '../../src/automation/stateMachine.js';
import { AutomationState } from '../../src/automation/automationState.js';

describe('StateMachine', () => {
  let fsm: StateMachine;

  beforeEach(() => {
    fsm = new StateMachine(AutomationState.IDLE);
  });

  it('should start at IDLE', () => {
    expect(fsm.getState()).toBe(AutomationState.IDLE);
  });

  it('should allow valid transitions', () => {
    expect(fsm.transitionTo(AutomationState.CONNECTING)).toBe(true);
    expect(fsm.getState()).toBe(AutomationState.CONNECTING);

    expect(fsm.transitionTo(AutomationState.DETECTING_COURSE)).toBe(true);
    expect(fsm.getState()).toBe(AutomationState.DETECTING_COURSE);

    expect(fsm.transitionTo(AutomationState.DETECTING_LESSON)).toBe(true);
    expect(fsm.getState()).toBe(AutomationState.DETECTING_LESSON);
  });

  it('should notify transition listeners', () => {
    const transitions: string[] = [];
    fsm.onTransition((from, to) => {
      transitions.push(`${from}->${to}`);
    });

    fsm.transitionTo(AutomationState.CONNECTING);
    fsm.transitionTo(AutomationState.DETECTING_COURSE);

    expect(transitions).toEqual([
      'IDLE->CONNECTING',
      'CONNECTING->DETECTING_COURSE'
    ]);
  });

  it('should permit emergency transition to STOPPED or REQUIRES_USER from any state', () => {
    fsm.transitionTo(AutomationState.CONNECTING);
    fsm.transitionTo(AutomationState.DETECTING_COURSE);
    
    expect(fsm.canTransitionTo(AutomationState.REQUIRES_USER)).toBe(true);
    fsm.transitionTo(AutomationState.REQUIRES_USER);
    expect(fsm.getState()).toBe(AutomationState.REQUIRES_USER);

    expect(fsm.canTransitionTo(AutomationState.STOPPED)).toBe(true);
    fsm.transitionTo(AutomationState.STOPPED);
    expect(fsm.getState()).toBe(AutomationState.STOPPED);
  });
});
