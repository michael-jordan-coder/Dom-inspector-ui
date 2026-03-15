import React from 'react';

export type Variants = Record<string, unknown>;
export type Transition = Record<string, unknown>;
export type SVGMotionProps<T> = React.SVGProps<T> & {
  variants?: Variants;
  initial?: string;
  whileHover?: string;
  whileFocus?: string;
  whileTap?: string;
};

function passthrough(tag: keyof JSX.IntrinsicElements): React.FC<any> {
  return (props) => React.createElement(tag, props, props.children);
}

export const motion = {
  svg: passthrough('svg'),
  path: passthrough('path'),
  polyline: passthrough('polyline'),
  circle: passthrough('circle'),
  line: passthrough('line'),
  g: passthrough('g'),
};

export function useReducedMotion(): boolean {
  return false;
}
