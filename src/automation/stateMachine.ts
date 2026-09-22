import { AutomationState } from './automationState.js';

export type StateTransitionListener = (from: AutomationState, to: AutomationState, context?: any) => void;

export class StateMachine {
  private currentState: AutomationState = AutomationState.IDLE;
  private listeners: StateTransitionListener[] = [];

  // Allowed transitions map
  private static readonly VALID_TRANSITIONS: Record<AutomationState, AutomationState[]> = {
    [AutomationState.IDLE]: [AutomationState.CONNECTING, AutomationState.DETECTING_COURSE, AutomationState.STOPPED],
    [AutomationState.CONNECTING]: [AutomationState.DETECTING_COURSE, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.DETECTING_COURSE]: [AutomationState.DETECTING_LESSON, AutomationState.REQUIRES_USER, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.DETECTING_LESSON]: [AutomationState.LOADING_PLAYER, AutomationState.REQUIRES_USER, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.LOADING_PLAYER]: [AutomationState.SEEKING, AutomationState.REQUIRES_USER, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.SEEKING]: [AutomationState.WAITING_FOR_COMPLETION, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.WAITING_FOR_COMPLETION]: [AutomationState.COMPLETED, AutomationState.SEEKING, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.COMPLETED]: [AutomationState.ADVANCING, AutomationState.IDLE, AutomationState.STOPPED],
    [AutomationState.ADVANCING]: [AutomationState.VERIFYING_NEW_LESSON, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.VERIFYING_NEW_LESSON]: [AutomationState.DETECTING_COURSE, AutomationState.DETECTING_LESSON, AutomationState.COMPLETED, AutomationState.ERROR, AutomationState.STOPPED],
    [AutomationState.REQUIRES_USER]: [AutomationState.DETECTING_LESSON, AutomationState.LOADING_PLAYER, AutomationState.IDLE, AutomationState.STOPPED],
    [AutomationState.PAUSED]: [AutomationState.DETECTING_LESSON, AutomationState.LOADING_PLAYER, AutomationState.IDLE, AutomationState.STOPPED],
    [AutomationState.ERROR]: [AutomationState.IDLE, AutomationState.DETECTING_LESSON, AutomationState.STOPPED],
    [AutomationState.STOPPED]: [AutomationState.IDLE, AutomationState.CONNECTING, AutomationState.DETECTING_COURSE]
  };

  constructor(initialState: AutomationState = AutomationState.IDLE) {
    this.currentState = initialState;
  }

  public getState(): AutomationState {
    return this.currentState;
  }

  public canTransitionTo(nextState: AutomationState): boolean {
    if (nextState === AutomationState.STOPPED || nextState === AutomationState.ERROR || nextState === AutomationState.REQUIRES_USER) {
      return true;
    }
    const allowed = StateMachine.VALID_TRANSITIONS[this.currentState] || [];
    return allowed.includes(nextState);
  }

  public transitionTo(nextState: AutomationState, context?: any): boolean {
    if (this.currentState === nextState) {
      return true;
    }

    if (!this.canTransitionTo(nextState)) {
      console.warn(`[StateMachine] Invalid state transition requested: ${this.currentState} -> ${nextState}`);
    }

    const prevState = this.currentState;
    this.currentState = nextState;

    this.listeners.forEach(fn => {
      try {
        fn(prevState, nextState, context);
      } catch (err) {
        console.error('[StateMachine] Listener error:', err);
      }
    });

    return true;
  }

  public onTransition(listener: StateTransitionListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public reset(): void {
    this.transitionTo(AutomationState.IDLE);
  }
}
