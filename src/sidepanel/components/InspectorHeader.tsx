/**
 * Inspector Header
 * 
 * Top action bar with global controls: Pick Element, Copy CSS.
 */

import React from 'react';
import { AppIcon } from '../primitives';
// ============================================================================
// Styles
// ============================================================================

import './components.css';


export interface InspectorHeaderProps {
  isPickerActive: boolean;
  onPickerToggle: () => void;
  hasSelection: boolean;
  onCopyCSS: () => void;
}

// Action button component for header
function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'active' | 'danger';
  disabled?: boolean;
  title?: string;
}): React.ReactElement {
  return (
    <button
      className={`inspector-action-button variant-${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
      {label}
    </button>
  );
}





export function InspectorHeader({
  isPickerActive,
  onPickerToggle,
  hasSelection,
  onCopyCSS,
}: InspectorHeaderProps): React.ReactElement {
  return (
    <header className="inspector-header">
      <h1 className="inspector-header-title">
        <svg className="inspector-header-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Inspector
      </h1>

      <div className="inspector-header-actions">

        {/* Copy CSS - only visible when element selected */}
        {hasSelection && (
          <ActionButton
            icon={<AppIcon name="copy" />}
            label="Copy"
            onClick={onCopyCSS}
            variant="primary"
            title="Copy all styles as CSS"
          />
        )}

        {/* Pick Element toggle */}
        <ActionButton
          icon={<AppIcon name={isPickerActive ? 'close' : 'pointer'} />}
          label={isPickerActive ? 'Stop' : 'Pick'}
          onClick={onPickerToggle}
          variant={isPickerActive ? 'active' : 'primary'}
          title={isPickerActive ? 'Stop picking (Esc)' : 'Pick an element'}
        />
      </div>
    </header>
  );
}
