import React, { useState } from 'react';
import type { ElementMetadata } from '../../shared/types';
import { AppIcon } from '../primitives';
import { ElementBreadcrumb } from './ElementBreadcrumb';
import { ChildrenList } from './ChildrenList';
import { spacing } from '../tokens';

export interface SelectedSummaryProps {
  element: ElementMetadata;
  /** Navigate to element by selector */
  onNavigateToSelector?: (selector: string) => void;
  /** Navigate to parent element */
  onNavigateToParent?: () => void;
  /** Navigate to first child element */
  onNavigateToChild?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minWidth: 0,
    flexShrink: 0,
    boxShadow: 'var(--shadow-sm)',
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
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
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
    width: '100%',
    minWidth: 0,
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
    overflowY: 'auto',
    overflowX: 'hidden',
    minWidth: 0,
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
    transition: 'all var(--transition-fast)',
  },
  copyButtonHover: {
    backgroundColor: 'var(--surface-raised)',
    borderColor: 'var(--text-muted)',
    color: 'var(--text)',
  },
  copyButtonFocused: {
    boxShadow: '0 0 0 var(--ring-width) var(--ring-color)',
    outline: 'none',
  },
  copyButtonCopied: {
    color: 'var(--success)',
    borderColor: 'var(--success)',
  },
};

export function SelectedSummary({
  element,
  onNavigateToSelector,
  onNavigateToParent,
  onNavigateToChild,
}: SelectedSummaryProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const [isCopyHovered, setIsCopyHovered] = useState(false);
  const [isCopyFocused, setIsCopyFocused] = useState(false);

  const hierarchy = element.hierarchy;
  const canNavigateUp = hierarchy?.parent !== null;
  const canNavigateDown = (hierarchy?.children.length ?? 0) > 0;

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
            <AppIcon name="image" size={24} state="muted" />
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
              ...(isCopyHovered && !copied ? styles.copyButtonHover : {}),
              ...(isCopyFocused ? styles.copyButtonFocused : {}),
            }}
            onClick={handleCopy}
            title="Copy selector"
            onMouseEnter={() => setIsCopyHovered(true)}
            onMouseLeave={() => setIsCopyHovered(false)}
            onFocus={() => setIsCopyFocused(true)}
            onBlur={() => setIsCopyFocused(false)}
          >
            {copied ? (
              <AppIcon name="check" size={14} state="active" />
            ) : (
              <AppIcon name="copy" size={14} />
            )}
          </button>
        </div>

        {/* Hierarchy Breadcrumb */}
        {hierarchy && hierarchy.breadcrumb.length > 0 && onNavigateToSelector && (
          <div style={{ marginTop: spacing[2] }}>
            <ElementBreadcrumb
              breadcrumb={hierarchy.breadcrumb}
              onSelect={onNavigateToSelector}
              onNavigateUp={onNavigateToParent ?? (() => {})}
              onNavigateDown={onNavigateToChild ?? (() => {})}
              canNavigateUp={canNavigateUp}
              canNavigateDown={canNavigateDown}
            />
          </div>
        )}

        {/* Children List */}
        {hierarchy && hierarchy.children.length > 0 && onNavigateToSelector && (
          <div style={{ marginTop: spacing[2] }}>
            <ChildrenList
              children={hierarchy.children}
              onSelect={onNavigateToSelector}
            />
          </div>
        )}
      </div>
    </div>
  );
}
