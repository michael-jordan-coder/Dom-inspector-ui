import { useReducer, useState } from 'react';
import { trackRender, trackStateUpdate } from './client';

export function trackedUseState<T>(component: string, file: string | undefined, stateLabel: string, initial: T) {
  const [value, setValue] = useState(initial);
  const wrappedSet: typeof setValue = (next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      trackStateUpdate(component, file, stateLabel, prev, resolved);
      return resolved;
    });
  };
  return [value, wrappedSet] as const;
}

export function trackedUseReducer<S, A>(
  component: string,
  file: string | undefined,
  stateLabel: string,
  reducer: (state: S, action: A) => S,
  initialArg: S
) {
  const trackedReducer = (state: S, action: A): S => {
    const next = reducer(state, action);
    trackStateUpdate(component, file, stateLabel, state, next);
    return next;
  };
  return useReducer(trackedReducer, initialArg);
}

export function trackComponentRender(component: string, file?: string): void {
  trackRender(component, file);
}
