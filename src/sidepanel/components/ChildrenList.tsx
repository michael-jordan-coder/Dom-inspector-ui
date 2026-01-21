/**
 * ChildrenList
 * 
 * Displays a list of child elements with clickable navigation.
 * Shows tag name, text preview, and child count indicator.
 */

import React, { useState } from 'react';
import type { ElementSummary } from '../../shared/types';
import { colors, spacing, radii, transitions, typography } from '../tokens';
import { AppIcon } from '../primitives';

export interface ChildrenListProps {
  /** List of child element summaries */
  children: ElementSummary[];
  /** Callback when a child is clicked */
  onSelect: (selector: string) => void;
  /** Maximum number of items to show initially */
  maxVisible?: number;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing[1],
  },
  title: {
    fontSize: typography.xs,
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  count: {
    fontSize: typography.xs,
    color: colors.textMuted,
    backgroundColor: colors.surfaceRaised,
    padding: `2px ${spacing[2]}`,
    borderRadius: radii.full,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.surface,
    border: 'none',
    borderRadius: radii.sm,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: `all ${transitions.fast}`,
    fontFamily: 'inherit',
  },
  itemHover: {
    backgroundColor: colors.surfaceRaised,
  },
  tag: {
    fontSize: typography.xs,
    fontWeight: 600,
    color: colors.accent,
    flexShrink: 0,
  },
  preview: {
    flex: 1,
    fontSize: typography.xs,
    color: colors.textMuted,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  childIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 0,
  },
  showMore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: spacing[2],
    backgroundColor: 'transparent',
    border: `1px dashed ${colors.border}`,
    borderRadius: radii.sm,
    cursor: 'pointer',
    fontSize: typography.xs,
    color: colors.textMuted,
    transition: `all ${transitions.fast}`,
    width: '100%',
    fontFamily: 'inherit',
  },
  showMoreHover: {
    borderColor: colors.textMuted,
    backgroundColor: colors.surface,
    color: colors.text,
  },
};

export function ChildrenList({
  children,
  onSelect,
  maxVisible = 5,
}: ChildrenListProps): React.ReactElement | null {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreHovered, setShowMoreHovered] = useState(false);

  if (children.length === 0) return null;

  const visibleChildren = isExpanded ? children : children.slice(0, maxVisible);
  const hiddenCount = children.length - maxVisible;
  const showShowMore = hiddenCount > 0 && !isExpanded;

  const handleKeyDown = (e: React.KeyboardEvent, selector: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(selector);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Children</span>
        <span style={styles.count}>{children.length}</span>
      </div>

      <div style={styles.list} role="list">
        {visibleChildren.map((child, index) => {
          const isHovered = hoveredIndex === index;
          const displayText = child.textPreview || child.label.replace(child.tagName, '').trim() || '';

          return (
            <button
              key={child.selector}
              type="button"
              style={{
                ...styles.item,
                ...(isHovered ? styles.itemHover : {}),
              }}
              onClick={() => onSelect(child.selector)}
              onKeyDown={(e) => handleKeyDown(e, child.selector)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              title={child.selector}
              role="listitem"
            >
              <span style={styles.tag}>{child.tagName}</span>
              <span style={styles.preview}>{displayText}</span>
              {child.childCount > 0 && (
                <span style={styles.childIndicator}>
                  {child.childCount}
                  <AppIcon name="chevronRight" size={12} />
                </span>
              )}
            </button>
          );
        })}

        {showShowMore && (
          <button
            type="button"
            style={{
              ...styles.showMore,
              ...(showMoreHovered ? styles.showMoreHover : {}),
            }}
            onClick={() => setIsExpanded(true)}
            onMouseEnter={() => setShowMoreHovered(true)}
            onMouseLeave={() => setShowMoreHovered(false)}
          >
            <AppIcon name="plus" size={12} />
            Show {hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}
