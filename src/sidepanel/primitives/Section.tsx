import React, { useRef, useState, useEffect, useCallback } from 'react';
import { spacing, colors, typography, radii, transitions } from '../tokens';
import { useSectionCollapse } from '../hooks/useLocalStorage';
import { AppIcon } from './AppIcon';

interface SectionProps {
  /** Unique identifier for collapse state persistence */
  id?: string;
  title: string;
  children: React.ReactNode;
  /** Optional icons to show in the title row (e.g., visibility toggle) */
  trailingIcons?: React.ReactNode;
  /** Enable collapse/expand behavior */
  collapsible?: boolean;
  /** Optional badge to show (e.g., "3 modified") when collapsed */
  badge?: string | number;
  /** Default collapsed state (only used if id not provided) */
  defaultCollapsed?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    width: '100%',
    minWidth: 0,
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
    cursor: 'default',
  },
  headerCollapsible: {
    cursor: 'pointer',
    userSelect: 'none',
    borderRadius: radii.sm,
    marginLeft: -4,
    marginRight: -4,
    paddingLeft: 4,
    paddingRight: 4,
    transition: `background-color ${transitions.fast}`,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  title: {
    fontSize: typography.xs,
    fontWeight: 500,
    color: colors.textMuted,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    color: colors.textMuted,
    transition: `transform ${transitions.fast}`,
    flexShrink: 0,
  },
  chevronRotated: {
    transform: 'rotate(-90deg)',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.accent,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: '2px 6px',
    borderRadius: radii.full,
    marginLeft: spacing[2],
  },
  trailingIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
  },
  contentWrapper: {
    overflow: 'hidden',
    transition: 'height 0.2s ease-out, opacity 0.15s ease-out',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    width: '100%',
    minWidth: 0,
  },
  contentCollapsed: {
    opacity: 0,
    pointerEvents: 'none',
  },
};

/**
 * Section - A titled container for grouping related controls.
 * Matches Figma's compact right panel section structure.
 * Supports collapsible behavior with localStorage persistence.
 */
export function Section({
  id,
  title,
  children,
  trailingIcons,
  collapsible = false,
  badge,
  defaultCollapsed = false,
}: SectionProps): React.ReactElement {
  // Use localStorage-persisted state if id provided, otherwise local state
  const [persistedCollapsed, togglePersisted] = useSectionCollapse(id || 'temp');
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
  
  const isCollapsed = id ? persistedCollapsed : localCollapsed;
  const toggleCollapsed = useCallback(() => {
    if (id) {
      togglePersisted();
    } else {
      setLocalCollapsed(prev => !prev);
    }
  }, [id, togglePersisted]);

  // Ref for measuring content height
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  // Measure content height for animation
  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (!isCollapsed) {
            setContentHeight(entry.contentRect.height);
          }
        }
      });
      
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isCollapsed]);

  const handleHeaderClick = useCallback(() => {
    if (collapsible) {
      toggleCollapsed();
    }
  }, [collapsible, toggleCollapsed]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleCollapsed();
    }
  }, [collapsible, toggleCollapsed]);

  return (
    <div style={styles.section}>
      <div
        style={{
          ...styles.header,
          ...(collapsible ? styles.headerCollapsible : {}),
        }}
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
        onMouseEnter={(e) => {
          if (collapsible) {
            e.currentTarget.style.backgroundColor = 'var(--neutral-800)';
          }
        }}
        onMouseLeave={(e) => {
          if (collapsible) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div style={styles.titleRow}>
          {collapsible && (
            <div style={{
              ...styles.chevron,
              ...(isCollapsed ? styles.chevronRotated : {}),
            }}>
              <AppIcon name="chevronDown" size={12} />
            </div>
          )}
          <span style={styles.title}>{title}</span>
          {badge && isCollapsed && (
            <span style={styles.badge}>{badge}</span>
          )}
        </div>
        {trailingIcons && !isCollapsed && (
          <div style={styles.trailingIcons} onClick={(e) => e.stopPropagation()}>
            {trailingIcons}
          </div>
        )}
      </div>
      
      {collapsible ? (
        <div
          style={{
            ...styles.contentWrapper,
            height: isCollapsed ? 0 : contentHeight,
            opacity: isCollapsed ? 0 : 1,
          }}
        >
          <div
            ref={contentRef}
            style={{
              ...styles.content,
              ...(isCollapsed ? styles.contentCollapsed : {}),
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        <div style={styles.content}>{children}</div>
      )}
    </div>
  );
}
