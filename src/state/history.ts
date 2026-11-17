import { configReducer } from './config';
import type { Action, AppConfig } from './types';

export interface HistoryState {
  past: AppConfig[];
  present: AppConfig;
  future: AppConfig[];
  /** Coalescing key and time of the last tracked change. */
  lastGroup: string | null;
  lastAt: number;
}

export type HistoryAction =
  | { type: 'history/undo' }
  | { type: 'history/redo' }
  | { type: 'history/apply'; action: Action; at: number };

const MAX_STEPS = 100;
/** Rapid edits of the same thing (typing, dragging a slider) collapse into one undo step. */
const COALESCE_MS = 800;
/** Export settings are preferences, not part of the design, so they skip history. */
const UNTRACKED: ReadonlySet<Action['type']> = new Set(['export/update']);

function groupOf(action: Action): string {
  switch (action.type) {
    case 'content/update':
      return `content:${action.contentType}:${Object.keys(action.patch).join(',')}`;
    case 'design/update':
      return `design:${action.group ?? 'edit'}`;
    default:
      return action.type;
  }
}

export function initHistory(present: AppConfig): HistoryState {
  return { past: [], present, future: [], lastGroup: null, lastAt: 0 };
}

/** Wraps the config reducer with bounded undo/redo history. */
export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'history/undo': {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastGroup: null,
        lastAt: 0,
      };
    }
    case 'history/redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
        lastGroup: null,
        lastAt: 0,
      };
    }
    case 'history/apply': {
      const present = configReducer(state.present, action.action);
      if (present === state.present) return state;
      if (UNTRACKED.has(action.action.type)) return { ...state, present };

      const group = groupOf(action.action);
      const coalesce = group === state.lastGroup && action.at - state.lastAt < COALESCE_MS;
      return {
        past: coalesce ? state.past : [...state.past, state.present].slice(-MAX_STEPS),
        present,
        future: [],
        lastGroup: group,
        lastAt: action.at,
      };
    }
  }
}
