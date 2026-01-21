/**
 * ElementBreadcrumb
 * 
 * Displays the hierarchy path from body to the current element.
 * Allows navigation via click and arrow buttons.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { BreadcrumbItem } from '../../shared/types';
import { colors, spacing, radii, transitions, typography } from '../tokens';
import { AppIcon } from '../primitives';

export interface ElementBreadcrumbProps {
  /** Breadcrumb path from body to current element */
  breadcrumb: BreadcrumbItem[];
  /** Callback when a breadcrumb item is clicked */
  onSelect: (selector: string) => void;
  /** Navigate to parent element */
  onNavigateUp: () => void;
  /** Navigate to first child element */
  onNavigateDown: () => void;
  /** Whether parent navigation is possible */
  canNavigateUp: boolean;
  /** Whether child navigation is possible */
  canNavigateDown: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  pathContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  path: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    paddingRight: spacing[2],
  },
  separator: {
    color: colors.textMuted,
    flexShrink: 0,
    fontSize: 10,
    opacity: 0.6,
  },
  item: {
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: radii.sm,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: typography.xs,
    fontFamily: 'inherit',
    transition: `all ${transitions.fast}`,
    flexShrink: 0,
  },
  itemHover: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
  },
  itemCurrent: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontWeight: 500,
  },
  navButtons: {
    display: 'flex',
    gap: 2,
    flexShrink: 0,
  },
  navBtn: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.textMuted,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${transitions.fast}`,
    padding: 0,
  },
  navBtnHover: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
  },
  navBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

export function ElementBreadcrumb({
  breadcrumb,
  onSelect,
  onNavigateUp,
  onNavigateDown,
  canNavigateUp,
  canNavigateDown,
}: ElementBreadcrumbProps): React.ReactElement {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredNav, setHoveredNav] = useState<'up' | 'down' | null>(null);
  const pathRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show current element (last item)
  useEffect(() => {
    if (pathRef.current) {
      pathRef.current.scrollLeft = pathRef.current.scrollWidth;
    }
  }, [breadcrumb]);

  const handleKeyDown = (e: React.KeyboardEvent, selector: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(selector);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.pathContainer}>
        <div
          ref={pathRef}
          style={styles.path}
          // Hide scrollbar in webkit browsers
          className="hide-scrollbar"
        >
          {breadcrumb.map((item, index) => {
            const isCurrent = index === breadcrumb.length - 1;
            const isHovered = hoveredIndex === index && !isCurrent;

            return (
              <React.Fragment key={item.selector}>
                {index > 0 && <span style={styles.separator}>›</span>}
                <button
                  type="button"
                  style={{
                    ...styles.item,
                    ...(isCurrent ? styles.itemCurrent : {}),
                    ...(isHovered ? styles.itemHover : {}),
                  }}
                  onClick={() => onSelect(item.selector)}
                  onKeyDown={(e) => handleKeyDown(e, item.selector)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  title={item.selector}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={styles.navButtons}>
        <button
          type="button"
          style={{
            ...styles.navBtn,
            ...(hoveredNav === 'up' && canNavigateUp ? styles.navBtnHover : {}),
            ...(!canNavigateUp ? styles.navBtnDisabled : {}),
          }}
          onClick={canNavigateUp ? onNavigateUp : undefined}
          disabled={!canNavigateUp}
          onMouseEnter={() => setHoveredNav('up')}
          onMouseLeave={() => setHoveredNav(null)}
          title="Select parent (Alt+↑)"
          aria-label="Navigate to parent element"
        >
          <AppIcon name="chevronUp" size={14} />
        </button>
        <button
          type="button"
          style={{
            ...styles.navBtn,
            ...(hoveredNav === 'down' && canNavigateDown ? styles.navBtnHover : {}),
            ...(!canNavigateDown ? styles.navBtnDisabled : {}),
          }}
          onClick={canNavigateDown ? onNavigateDown : undefined}
          disabled={!canNavigateDown}
          onMouseEnter={() => setHoveredNav('down')}
          onMouseLeave={() => setHoveredNav(null)}
          title="Select first child (Alt+↓)"
          aria-label="Navigate to first child element"
        >
          <AppIcon name="chevronDown" size={14} />
        </button>
      </div>

      {/* Inline style for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
