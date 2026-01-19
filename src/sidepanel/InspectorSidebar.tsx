/**
 * Inspector Sidebar
 * 
 * Main composition component for the Figma-style inspector panel.
 * Compact layout matching Figma's right panel density.
 */

import React, { useCallback, useMemo } from 'react';
import type { ComputedStylesSnapshot, ElementMetadata } from '../shared/types';
import { applyStylePatch } from './messaging/sidepanelBridge';
import { Divider } from './primitives';
import { AppearanceSection, LayoutSection, HistorySection } from './sections';
import { SelectedSummary } from './components/SelectedSummary';
import { spacing, colors, radii } from './tokens';
import { Check } from './icons';
import { getDefaultColorTokens } from './features/color';

interface InspectorSidebarProps {
  element: ElementMetadata;
  styles: ComputedStylesSnapshot;
  canUndo: boolean;
  canRedo: boolean;
  onDone: () => void;
}

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3], // Reduced from spacing[4]
  padding: spacing[3], // Reduced from spacing[4]
  overflowY: 'auto',
  overflowX: 'hidden',
  flex: 1,
  width: '100%',
  minWidth: 0, // Crucial for flex children to shrink properly
};

const doneButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[1],
  width: '100%',
  padding: `10px ${spacing[3]}`,
  fontSize: '13px',
  fontWeight: 600,
  color: colors.bg,
  backgroundColor: colors.text,
  border: 'none',
  borderRadius: radii.full,
  cursor: 'pointer',
  transition: 'all 0.12s ease',
  flexShrink: 0, // Prevent button from squishing
};

export function InspectorSidebar({
  element,
  styles,
  canUndo,
  canRedo,
  onDone,
}: InspectorSidebarProps): React.ReactElement {
  const handlePatchApply = useCallback(
    async (property: string, value: string) => {
      try {
        const previousValue = styles[property as keyof ComputedStylesSnapshot];
        const prevString = typeof previousValue === 'string' ? previousValue : '';
        await applyStylePatch(element.selector, property, value, prevString);
      } catch (e) {
        console.error('Failed to apply patch:', e);
      }
    },
    [element.selector, styles]
  );

  // Get default color tokens for the color picker
  const colorTokens = useMemo(() => getDefaultColorTokens(), []);

  return (
    <div style={containerStyles}>
      <SelectedSummary element={element} />

      <Divider margin={spacing[1]} />

      <AppearanceSection
        styles={styles}
        onPatchApply={handlePatchApply}
        colorTokens={colorTokens}
      />

      <Divider margin={spacing[1]} />

      <LayoutSection
        styles={styles}
        onPatchApply={handlePatchApply}
      />

      <Divider margin={spacing[1]} />

      <HistorySection
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <button
        style={doneButtonStyles}
        onClick={onDone}
        title="Finish manipulation and clear selection"
      >
        <Check size={14} strokeWidth={2.5} />
        Done
      </button>
    </div>
  );
}
