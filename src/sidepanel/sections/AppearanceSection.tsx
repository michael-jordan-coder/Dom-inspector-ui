/**
 * Appearance Section
 * 
 * Figma-style responsive appearance controls.
 */

import React, { useCallback } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { Section, Row, NumberField, IconButton } from '../primitives';
import { opacityFeature, cornerRadiusFeature } from '../features/appearance';
import { Eye } from '../icons';
import type { FeatureUINumber } from '../features/types';
import { colors } from '../tokens';

interface AppearanceSectionProps {
  styles: ComputedStylesSnapshot;
  onPatchApply: (property: string, value: string) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: colors.textMuted,
  marginBottom: 4,
};

export function AppearanceSection({
  styles,
  onPatchApply,
}: AppearanceSectionProps): React.ReactElement {
  const opacityValue = opacityFeature.getState(styles);
  const radiusValue = cornerRadiusFeature.getState(styles);

  const handleOpacityChange = useCallback(
    (value: number) => {
      const patch = opacityFeature.createPatch(value);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handleRadiusChange = useCallback(
    (value: number) => {
      const patch = cornerRadiusFeature.createPatch(value);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const opacityUI = opacityFeature.ui as FeatureUINumber;
  const radiusUI = cornerRadiusFeature.ui as FeatureUINumber;

  return (
    <Section
      title="Appearance"
      trailingIcons={
        <IconButton
          icon={<Eye size={14} />}
          title="Toggle visibility"
          size="sm"
        />
      }
    >
      {/* Two columns with labels above - Figma style */}
      <Row gap="var(--space-6)">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Opacity</span>
          <NumberField
            value={opacityValue}
            onChange={handleOpacityChange}
            icon={opacityUI.icon}
            unit={opacityUI.unit}
            min={opacityUI.min}
            max={opacityUI.max}
            step={opacityUI.step}
            disabled={!opacityFeature.isApplicable(styles)}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Corner radius</span>
          <NumberField
            value={radiusValue}
            onChange={handleRadiusChange}
            icon={radiusUI.icon}
            min={radiusUI.min}
            max={radiusUI.max}
            step={radiusUI.step}
            disabled={!cornerRadiusFeature.isApplicable(styles)}
          />
        </div>
      </Row>
    </Section>
  );
}
