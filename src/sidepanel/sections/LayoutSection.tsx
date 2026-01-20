/**
 * Layout Section
 * 
 * Figma-style layout controls matching the reference design.
 */

import React, { useCallback, useState } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { Section, Row, Segmented, NumberField, Toggle, AlignmentGrid, AppIcon } from '../primitives';
import {
  justifyContentFeature,
  alignItemsFeature,
  flowFeature,
  gapFeature,
  paddingHFeature,
  paddingVFeature,
  marginHFeature,
  marginVFeature,
  clipContentFeature,
} from '../features/layout';
import { DimensionControl } from '../components/DimensionControl';
import type { FeatureUISegmented, FeatureUINumber } from '../features/types';
import { colors, spacing } from '../tokens';

interface LayoutSectionProps {
  styles: ComputedStylesSnapshot;
  onPatchApply: (property: string, value: string) => void;
}

// Label style for subsections
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: colors.textMuted,
  marginBottom: 4,
};

export function LayoutSection({
  styles,
  onPatchApply,
}: LayoutSectionProps): React.ReactElement {
  const [borderBox, setBorderBox] = useState(true);

  const isFlexOrGrid =
    styles.display === 'flex' ||
    styles.display === 'inline-flex' ||
    styles.display === 'grid' ||
    styles.display === 'inline-grid';

  // Get all values
  const justifyValue = justifyContentFeature.getState(styles);
  const alignValue = alignItemsFeature.getState(styles);
  const flowValue = flowFeature.getState(styles);
  const gapValue = gapFeature.getState(styles);
  const paddingHValue = paddingHFeature.getState(styles);
  const paddingVValue = paddingVFeature.getState(styles);
  const marginHValue = marginHFeature.getState(styles);
  const marginVValue = marginVFeature.getState(styles);
  const clipValue = clipContentFeature.getState(styles);

  // Handlers
  const handleFlowChange = useCallback(
    (value: string) => {
      const patch = flowFeature.createPatch(value as ReturnType<typeof flowFeature.getState>);
      onPatchApply(patch.property, patch.value);
    },
    [onPatchApply]
  );

  const handleAlignmentChange = useCallback(
    (align: string, justify: string) => {
      const alignPatch = alignItemsFeature.createPatch(align as ReturnType<typeof alignItemsFeature.getState>);
      const justifyPatch = justifyContentFeature.createPatch(justify as ReturnType<typeof justifyContentFeature.getState>);
      onPatchApply(alignPatch.property, alignPatch.value);
      onPatchApply(justifyPatch.property, justifyPatch.value);
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

  const handleMarginHChange = useCallback(
    (value: number) => {
      onPatchApply('marginLeft', `${value}px`);
      onPatchApply('marginRight', `${value}px`);
    },
    [onPatchApply]
  );

  const handleMarginVChange = useCallback(
    (value: number) => {
      onPatchApply('marginTop', `${value}px`);
      onPatchApply('marginBottom', `${value}px`);
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

  const handleBorderBoxChange = useCallback(
    (value: boolean) => {
      setBorderBox(value);
      onPatchApply('boxSizing', value ? 'border-box' : 'content-box');
    },
    [onPatchApply]
  );

  const flowUI = flowFeature.ui as FeatureUISegmented<string>;
  const gapUI = gapFeature.ui as FeatureUINumber;
  const paddingHUI = paddingHFeature.ui as FeatureUINumber;
  const paddingVUI = paddingVFeature.ui as FeatureUINumber;

  return (
    <Section title="Layout">
      {/* Flow - full width segmented */}
      {isFlexOrGrid && (
        <div style={{ marginBottom: spacing[3] }}>
          <span style={labelStyle}>Flow</span>
          <Segmented
            options={flowUI.options}
            value={flowValue}
            onChange={handleFlowChange}
            disabled={!isFlexOrGrid}
            stretch
          />
        </div>
      )}

      {/* Dimensions - W/H on single row */}
      <div style={{ marginBottom: spacing[3] }}>
        <span style={labelStyle}>Dimensions</span>
        <Row gap={spacing[2]} style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <DimensionControl
              label="W"
              property="width"
              value={styles.width}
              minValue={styles.minWidth}
              maxValue={styles.maxWidth}
              onApply={onPatchApply}
            />
          </div>
          <div style={{ flex: 1 }}>
            <DimensionControl
              label="H"
              property="height"
              value={styles.height}
              minValue={styles.minHeight}
              maxValue={styles.maxHeight}
              onApply={onPatchApply}
            />
          </div>
        </Row>
      </div>

      {/* Alignment Grid + Gap (side by side) */}
      {isFlexOrGrid && (
        <Row gap={spacing[3]} style={{ marginBottom: spacing[3], alignItems: 'flex-start' }}>
          <div>
            <span style={labelStyle}>Alignment</span>
            <AlignmentGrid
              alignItems={alignValue}
              justifyContent={justifyValue}
              onChange={handleAlignmentChange}
              disabled={!isFlexOrGrid}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Gap</span>
            <NumberField
              value={gapValue}
              onChange={handleGapChange}
              icon={gapUI.icon}
              unit="px"
              min={gapUI.min}
              max={gapUI.max}
            />
          </div>
        </Row>
      )}

      {/* Padding - two columns */}
      <div style={{ marginBottom: spacing[2] }}>
        <span style={labelStyle}>Padding</span>
        <Row gap={spacing[2]}>
          <div style={{ flex: 1 }}>
            <NumberField
              value={paddingHValue}
              onChange={handlePaddingHChange}
              icon={paddingHUI.icon}
              unit="px"
              min={paddingHUI.min}
              max={paddingHUI.max}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NumberField
              value={paddingVValue}
              onChange={handlePaddingVChange}
              icon={paddingVUI.icon}
              unit="px"
              min={paddingVUI.min}
              max={paddingVUI.max}
            />
          </div>
        </Row>
      </div>

      {/* Clip Content checkbox */}
      <Toggle
        label="Clip content"
        checked={clipValue}
        onChange={handleClipChange}
      />

      {/* Margin - two columns */}
      <div style={{ marginTop: spacing[3], marginBottom: spacing[2] }}>
        <span style={labelStyle}>Margin</span>
        <Row gap={spacing[2]}>
          <div style={{ flex: 1 }}>
            <NumberField
              value={marginHValue}
              onChange={handleMarginHChange}
              icon={<AppIcon name="marginH" size={14} color={colors.textMuted} />}
              unit="px"
              min={-200}
              max={200}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NumberField
              value={marginVValue}
              onChange={handleMarginVChange}
              icon={<AppIcon name="marginV" size={14} color={colors.textMuted} />}
              unit="px"
              min={-200}
              max={200}
            />
          </div>
        </Row>
      </div>

      {/* Border box checkbox */}
      <Toggle
        label="Border box"
        checked={borderBox}
        onChange={handleBorderBoxChange}
      />
    </Section>
  );
}
