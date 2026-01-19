/**
 * Layout Section
 * 
 * Figma-style responsive layout controls.
 */

import React, { useCallback } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { Section, Row, Segmented, NumberField, Toggle } from '../primitives';
import {
  justifyContentFeature,
  alignItemsFeature,
  flowFeature,
  gapFeature,
  paddingHFeature,
  paddingVFeature,
  clipContentFeature,
} from '../features/layout';
import type { FeatureUISegmented, FeatureUINumber } from '../features/types';
import { colors } from '../tokens';

interface LayoutSectionProps {
  styles: ComputedStylesSnapshot;
  onPatchApply: (property: string, value: string) => void;
}

export function LayoutSection({
  styles,
  onPatchApply,
}: LayoutSectionProps): React.ReactElement {
  const isFlexOrGrid =
    styles.display === 'flex' ||
    styles.display === 'inline-flex' ||
    styles.display === 'grid' ||
    styles.display === 'inline-grid';
  const justifyValue = justifyContentFeature.getState(styles);
  const alignValue = alignItemsFeature.getState(styles);
  const flowValue = flowFeature.getState(styles);
  const gapValue = gapFeature.getState(styles);
  const paddingHValue = paddingHFeature.getState(styles);
  const paddingVValue = paddingVFeature.getState(styles);
  const clipValue = clipContentFeature.getState(styles);

  const handleJustifyChange = useCallback(
    (value: string) => {
      const patch = justifyContentFeature.createPatch(value as ReturnType<typeof justifyContentFeature.getState>);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handleAlignChange = useCallback(
    (value: string) => {
      const patch = alignItemsFeature.createPatch(value as ReturnType<typeof alignItemsFeature.getState>);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handleFlowChange = useCallback(
    (value: string) => {
      const patch = flowFeature.createPatch(value as ReturnType<typeof flowFeature.getState>);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handleGapChange = useCallback(
    (value: number) => {
      const patch = gapFeature.createPatch(value);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handlePaddingHChange = useCallback(
    (value: number) => {
      onPatchApply('paddingLeft', `${value}px`);
      onPatchApply('paddingRight', `${value}px`);
    },
    [onPatchApply]
  );

  const handlePaddingVChange = useCallback(
    (value: number) => {
      onPatchApply('paddingTop', `${value}px`);
      onPatchApply('paddingBottom', `${value}px`);
    },
    [onPatchApply]
  );

  const handleClipChange = useCallback(
    (value: boolean) => {
      const patch = clipContentFeature.createPatch(value);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const justifyUI = justifyContentFeature.ui as FeatureUISegmented<string>;
  const alignUI = alignItemsFeature.ui as FeatureUISegmented<string>;
  const flowUI = flowFeature.ui as FeatureUISegmented<string>;
  const gapUI = gapFeature.ui as FeatureUINumber;
  const paddingHUI = paddingHFeature.ui as FeatureUINumber;
  const paddingVUI = paddingVFeature.ui as FeatureUINumber;

  return (
    <>
      {/* Alignment - two segmented groups stretching */}
      {isFlexOrGrid && (
        <Section title="Alignment">
          <Row gap="var(--space-2)">
            <Segmented
              options={alignUI.options}
              value={alignValue}
              onChange={handleAlignChange}
              disabled={!isFlexOrGrid}
              stretch
            />
            <Segmented
              options={justifyUI.options}
              value={justifyValue}
              onChange={handleJustifyChange}
              disabled={!isFlexOrGrid}
              stretch
            />
          </Row>
        </Section>
      )}

      {/* Flow - full width segmented */}
      {isFlexOrGrid && (
        <Section title="Flow">
          <Segmented
            options={flowUI.options}
            value={flowValue}
            onChange={handleFlowChange}
            disabled={!isFlexOrGrid}
            stretch
          />
        </Section>
      )}

      {/* Dimensions - two columns with labels */}
      <Section title="Dimensions">
        <Row gap="var(--space-2)">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <NumberField
              value={0}
              onChange={() => {}}
              icon={<span style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted }}>W</span>}
              disabled
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <NumberField
              value={0}
              onChange={() => {}}
              icon={<span style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted }}>H</span>}
              disabled
            />
          </div>
        </Row>
      </Section>

      {/* Gap - single row when flex/grid */}
      {isFlexOrGrid && (
        <Section title="Gap">
          <NumberField
            value={gapValue}
            onChange={handleGapChange}
            icon={gapUI.icon}
            min={gapUI.min}
            max={gapUI.max}
            step={gapUI.step}
            disabled={!isFlexOrGrid}
          />
        </Section>
      )}

      {/* Padding - two columns */}
      <Section title="Padding">
        <Row gap="var(--space-2)">
          <div style={{ flex: 1 }}>
            <NumberField
              value={paddingHValue}
              onChange={handlePaddingHChange}
              icon={paddingHUI.icon}
              min={paddingHUI.min}
              max={paddingHUI.max}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NumberField
              value={paddingVValue}
              onChange={handlePaddingVChange}
              icon={paddingVUI.icon}
              min={paddingVUI.min}
              max={paddingVUI.max}
            />
          </div>
        </Row>
      </Section>

      {/* Clip Content */}
      <Toggle
        label={clipContentFeature.label}
        checked={clipValue}
        onChange={handleClipChange}
      />
    </>
  );
}
