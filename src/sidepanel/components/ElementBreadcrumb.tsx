/**
 * ElementBreadcrumb
 * 
 * Displays the hierarchy path from body to the current element.
 * Allows navigation via click and arrow buttons.
 */

import React, { useRef, useEffect } from 'react';
import type { BreadcrumbItem } from '../../shared/types';
import { AppIcon } from '../primitives';
// ============================================================================
// Styles
// ============================================================================

import './components.css';


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



export function ElementBreadcrumb({
  breadcrumb,
  onSelect,
  onNavigateUp,
  onNavigateDown,
  canNavigateUp,
  canNavigateDown,
}: ElementBreadcrumbProps): React.ReactElement {
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
    <div className="breadcrumb-container">
      <div className="breadcrumb-path-container">
        <div
          ref={pathRef}
          className="breadcrumb-path"
        >
          {breadcrumb.map((item, index) => {
            const isCurrent = index === breadcrumb.length - 1;

            return (
              <React.Fragment key={item.selector}>
                {index > 0 && <span className="breadcrumb-separator">›</span>}
                <button
                  type="button"
                  className={`breadcrumb-item ${isCurrent ? 'is-current' : ''}`}
                  onClick={() => onSelect(item.selector)}
                  onKeyDown={(e) => handleKeyDown(e, item.selector)}
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

      <div className="breadcrumb-nav-buttons">
        <button
          type="button"
          className="breadcrumb-nav-btn"
          onClick={canNavigateUp ? onNavigateUp : undefined}
          disabled={!canNavigateUp}
          title="Select parent (Alt+↑)"
          aria-label="Navigate to parent element"
        >
          <AppIcon name="chevronUp" size={14} />
        </button>
        <button
          type="button"
          className="breadcrumb-nav-btn"
          onClick={canNavigateDown ? onNavigateDown : undefined}
          disabled={!canNavigateDown}
          title="Select first child (Alt+↓)"
          aria-label="Navigate to first child element"
        >
          <AppIcon name="chevronDown" size={14} />
        </button>
      </div>
    </div>
  );
}
