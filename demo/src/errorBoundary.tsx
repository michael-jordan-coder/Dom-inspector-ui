import React from 'react';
import { trackError } from '../../src/runtime/client.ts';

interface State {
  hasError: boolean;
  message: string;
}

export class DemoErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error): void {
    trackError(error, 'demo/src/errorBoundary.tsx', 'DemoErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 16, background: '#ffe9e9' }}>Crash captured: {this.state.message}</div>;
    }
    return this.props.children;
  }
}
