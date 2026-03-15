import { isRuntimeEnvelope } from '../devtools-shared/events';

export function initDevtoolsBridge(): void {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    const data = event.data as unknown;

    if (isRuntimeEnvelope(data) || (data && typeof data === 'object' && (data as { kind?: string }).kind === 'error_snapshot')) {
      chrome.runtime.sendMessage({
        type: 'DEVTOOLS_TIMELINE_EVENT',
        payload: data,
      }).catch(() => {
        // devtools may not be open
      });
    }
  });
}
