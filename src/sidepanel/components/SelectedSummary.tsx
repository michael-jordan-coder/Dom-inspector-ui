import React, { useState } from 'react';
import type { ElementMetadata } from '../../shared/types';

interface SelectedSummaryProps {
  element: ElementMetadata;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  screenshotContainer: {
    position: 'relative',
    backgroundColor: 'var(--surface-raised)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    maxHeight: 180,
    overflow: 'hidden',
  },
  screenshot: {
    maxWidth: '100%',
    maxHeight: 180,
    objectFit: 'contain',
    display: 'block',
  },
  screenshotPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    color: 'var(--text-muted)',
    fontSize: 'var(--fs-xs)',
    gap: 'var(--space-2)',
  },
  content: {
    padding: 'var(--space-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 'var(--fs-base)',
    fontWeight: 600,
    color: 'var(--accent)',
  },
  selectorRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-2)',
  },
  selectorValue: {
    flex: 1,
    fontSize: 'var(--fs-xs)',
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--surface-raised)',
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    wordBreak: 'break-all',
    lineHeight: 1.4,
    maxHeight: 60,
    overflow: 'auto',
  },
  copyButton: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    padding: 0,
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    transition: 'all 0.15s ease',
  },
  copyButtonCopied: {
    color: 'var(--success)',
    borderColor: 'var(--success)',
  },
};

export function SelectedSummary({ element }: SelectedSummaryProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(element.selector);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = element.selector;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={styles.card}>
      {/* Screenshot Preview */}
      <div style={styles.screenshotContainer}>
        {element.screenshot ? (
          <img
            src={element.screenshot}
            alt={`Screenshot of ${element.tagName} element`}
            style={styles.screenshot}
          />
        ) : (
          <div style={styles.screenshotPlaceholder}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            <span>No preview available</span>
          </div>
        )}
      </div>

      {/* Element Info */}
      <div style={styles.content}>
        {/* Tag */}
        <div style={styles.header}>
          <span style={styles.tag}>&lt;{element.tagName}&gt;</span>
        </div>

        {/* Selector with copy */}
        <div style={styles.selectorRow}>
          <code style={styles.selectorValue}>{element.selector}</code>
          <button
            style={{
              ...styles.copyButton,
              ...(copied ? styles.copyButtonCopied : {}),
            }}
            onClick={handleCopy}
            title="Copy selector"
          >
            {copied ? (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
