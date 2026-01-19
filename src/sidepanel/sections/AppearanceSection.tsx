/**
 * Appearance Section
 * 
 * Figma-style responsive appearance controls.
 * Includes opacity, corner radius, and color controls.
 */

import React, { useCallback, useMemo } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { Section, NumberField, IconButton, ColorField } from '../primitives';
import { opacityFeature, cornerRadiusFeature } from '../features/appearance';
import { 
  textColorFeature, 
  backgroundColorFeature, 
  borderColorFeature 
} from '../features/color';
import { 
  Eye, 
  TextColorIcon, 
  BackgroundColorIcon, 
  BorderColorIcon 
} from '../icons';
import type { FeatureUINumber } from '../features/types';
import { colors, spacing } from '../tokens';

interface AppearanceSectionProps {
  styles: ComputedStylesSnapshot;
  onPatchApply: (property: string, value: string) => void;
  /** CSS tokens available for color selection */
  colorTokens?: Array<{ name: string; value: string }>;
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: colors.textMuted,
  marginBottom: 4,
};

const twoColumnGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[3],
  width: '100%',
  minWidth: 0,
};

export function AppearanceSection({
  styles,
  onPatchApply,
  colorTokens = [],
}: AppearanceSectionProps): React.ReactElement {
  // Existing feature values
  const opacityValue = opacityFeature.getState(styles);
  const radiusValue = cornerRadiusFeature.getState(styles);
  
  // Color feature values
  const textColorValue = textColorFeature.getState(styles);
  const bgColorValue = backgroundColorFeature.getState(styles);
  const borderColorValue = borderColorFeature.getState(styles);
  const showBorderColor = borderColorFeature.isApplicable(styles);

  // Handlers for existing features
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

  // Handlers for color features
  const handleTextColorChange = useCallback(
    (value: string) => {
      const patch = textColorFeature.createPatch(value);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handleBgColorChange = useCallback(
    (value: string) => {
      const patch = backgroundColorFeature.createPatch(value);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handleBorderColorChange = useCallback(
    (value: string) => {
      const patch = borderColorFeature.createPatch(value);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  // Filter tokens by color-related names
  const colorRelatedTokens = useMemo(() => {
    return colorTokens.filter(token => {
      const name = token.name.toLowerCase();
      return (
        name.includes('color') ||
        name.includes('bg') ||
        name.includes('text') ||
        name.includes('foreground') ||
        name.includes('background') ||
        name.includes('primary') ||
        name.includes('secondary') ||
        name.includes('accent') ||
        name.includes('neutral') ||
        name.includes('surface') ||
        name.includes('border')
      );
    });
  }, [colorTokens]);

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
      {/* Row 1: Opacity and Corner radius - two columns grid */}
      <div style={twoColumnGridStyle}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
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
      </div>

      {/* Row 2: Colors - two columns for text and background */}
      <div style={twoColumnGridStyle}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Text</span>
          <ColorField
            value={textColorValue}
            rawValue={styles.rawStyles?.color}
            onChange={handleTextColorChange}
            icon={<TextColorIcon size={14} />}
            tokens={colorRelatedTokens}
            ariaLabel="Text color"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Fill</span>
          <ColorField
            value={bgColorValue}
            rawValue={styles.rawStyles?.backgroundColor}
            onChange={handleBgColorChange}
            icon={<BackgroundColorIcon size={14} />}
            tokens={colorRelatedTokens}
            ariaLabel="Background color"
          />
        </div>
      </div>

      {/* Row 3: Border color - only if element has visible border */}
      {showBorderColor && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Border</span>
          <ColorField
            value={borderColorValue}
            rawValue={styles.rawStyles?.borderColor}
            onChange={handleBorderColorChange}
            icon={<BorderColorIcon size={14} />}
            tokens={colorRelatedTokens}
            ariaLabel="Border color"
          />
        </div>
      )}
    </Section>
  );
}
