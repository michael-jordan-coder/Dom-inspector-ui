/**
 * ChildrenList
 * 
 * Displays a list of child elements with clickable navigation.
 * Shows tag name, text preview, and child count indicator.
 */

import React, { useState } from 'react';
import { AppIcon } from '../primitives';

import type { ElementSummary } from '../../shared/types';
import './components.css';

export interface ChildrenListProps {
  /** List of child element summaries */
  children: ElementSummary[];
  /** Callback when a child is clicked */
  onSelect: (selector: string) => void;
  /** Maximum number of items to show initially */
  maxVisible?: number;
}




export function ChildrenList({
  children,
  onSelect,
  maxVisible = 5,
}: ChildrenListProps): React.ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="children-list-container">
      <div className="children-list-header">
        <span className="children-list-title">Children</span>
        <span className="children-list-count">{children.length}</span>
      </div>

      <div className="children-list-items" role="list">
        {visibleChildren.map((child) => {
          const displayText = child.textPreview || child.label.replace(child.tagName, '').trim() || '';

          return (
            <button
              key={child.selector}
              type="button"
              className="children-list-item"
              onClick={() => onSelect(child.selector)}
              onKeyDown={(e) => handleKeyDown(e, child.selector)}
              title={child.selector}
              role="listitem"
            >
              <span className="children-list-tag">{child.tagName}</span>
              <span className="children-list-preview">{displayText}</span>
              {child.childCount > 0 && (
                <span className="children-list-child-indicator">
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
            className="children-list-show-more"
            onClick={() => setIsExpanded(true)}
          >
            <AppIcon name="plus" size={12} />
            Show {hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}
