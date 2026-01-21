/**
 * Inspector Sidebar
 * 
 * Main composition component for the Figma-style inspector panel.
 * Compact layout matching Figma's right panel density.
 */

import React, { useCallback, useMemo } from 'react';
import type { ComputedStylesSnapshot, ElementMetadata } from '../shared/types';
import {
  applyStylePatch,
} from './messaging/sidepanelBridge';
import { Divider } from './primitives';
import { AppearanceSection, LayoutSection, TypographySection, EffectsSection, HistorySection, ChangesSection } from './sections';
import { SelectedSummary } from './components/SelectedSummary';
import { spacing } from './tokens';
import { getDefaultColorTokens } from './features/color';

interface InspectorSidebarProps {
  element: ElementMetadata;
  styles: ComputedStylesSnapshot;
  canUndo: boolean;
  canRedo: boolean;
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



export function InspectorSidebar({
  element,
  styles,
  canUndo,
  canRedo,
}: InspectorSidebarProps): React.ReactElement {
  // Track style changes to refresh ChangesSection
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handlePatchApply = useCallback(
    async (property: string, value: string) => {
      try {
        const previousValue = styles[property as keyof ComputedStylesSnapshot];
        const prevString = typeof previousValue === 'string' ? previousValue : '';
        await applyStylePatch(element.selector, property, value, prevString);
        // Trigger refresh of ChangesSection
        setRefreshTrigger((prev) => prev + 1);
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
      <SelectedSummary
        element={element}
      />

      <Divider margin={spacing[1]} />

      <LayoutSection
        styles={styles}
        onPatchApply={handlePatchApply}
      />

      <Divider margin={spacing[1]} />
      <TypographySection
        styles={styles}
        onPatchApply={handlePatchApply}
      />

      <Divider margin={spacing[1]} />
      <AppearanceSection
        styles={styles}
        onPatchApply={handlePatchApply}
        colorTokens={colorTokens}
      />

      <Divider margin={spacing[1]} />
      <EffectsSection
        styles={styles}
        onPatchApply={handlePatchApply}
      />

      <Divider margin={spacing[1]} />

      <HistorySection
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <Divider margin={spacing[1]} />

      <ChangesSection
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
