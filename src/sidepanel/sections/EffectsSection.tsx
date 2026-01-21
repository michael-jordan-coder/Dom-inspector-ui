/**
 * Effects Section
 * 
 * Controls for CSS transitions, animations, and transforms.
 */

import React, { useCallback, useState } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { Section, Row, NumberField, Dropdown, AppIcon } from '../primitives';
import {
  transitionDurationFeature,
  transitionDelayFeature,
  transformRotateFeature,
  transformScaleFeature,
  transformTranslateXFeature,
  transformTranslateYFeature,
  EASING_PRESETS,
  TRANSITION_PROPERTIES,
} from '../features/effects';
import type { FeatureUINumber } from '../features/types';
import { colors, spacing } from '../tokens';

interface EffectsSectionProps {
  styles: ComputedStylesSnapshot;
  onPatchApply: (property: string, value: string) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: colors.textMuted,
  marginBottom: 4,
};

const subsectionStyle: React.CSSProperties = {
  marginTop: spacing[3],
  paddingTop: spacing[2],
  borderTop: `1px solid ${colors.border}`,
};

export function EffectsSection({
  styles,
  onPatchApply,
}: EffectsSectionProps): React.ReactElement {
  // Local state for effect values (since they're not in computed styles)
  const [transitionProperty, setTransitionProperty] = useState('all');
  const [transitionDuration, setTransitionDuration] = useState(0);
  const [transitionDelay, setTransitionDelay] = useState(0);
  const [transitionEasing, setTransitionEasing] = useState('ease');
  
  const [rotate, setRotate] = useState(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // Transition handlers
  const handleTransitionPropertyChange = useCallback(
    (value: string) => {
      setTransitionProperty(value);
      onPatchApply('transitionProperty', value);
    },
    [onPatchApply]
  );

  const handleTransitionDurationChange = useCallback(
    (value: number) => {
      setTransitionDuration(value);
      onPatchApply('transitionDuration', `${value}ms`);
    },
    [onPatchApply]
  );

  const handleTransitionDelayChange = useCallback(
    (value: number) => {
      setTransitionDelay(value);
      onPatchApply('transitionDelay', `${value}ms`);
    },
    [onPatchApply]
  );

  const handleTransitionEasingChange = useCallback(
    (value: string) => {
      setTransitionEasing(value);
      onPatchApply('transitionTimingFunction', value);
    },
    [onPatchApply]
  );

  // Transform handlers
  const handleRotateChange = useCallback(
    (value: number) => {
      setRotate(value);
      // Build combined transform
      const transform = buildTransformString(value, scale, translateX, translateY);
      onPatchApply('transform', transform);
    },
    [scale, translateX, translateY, onPatchApply]
  );

  const handleScaleChange = useCallback(
    (value: number) => {
      setScale(value);
      const transform = buildTransformString(rotate, value, translateX, translateY);
      onPatchApply('transform', transform);
    },
    [rotate, translateX, translateY, onPatchApply]
  );

  const handleTranslateXChange = useCallback(
    (value: number) => {
      setTranslateX(value);
      const transform = buildTransformString(rotate, scale, value, translateY);
      onPatchApply('transform', transform);
    },
    [rotate, scale, translateY, onPatchApply]
  );

  const handleTranslateYChange = useCallback(
    (value: number) => {
      setTranslateY(value);
      const transform = buildTransformString(rotate, scale, translateX, value);
      onPatchApply('transform', transform);
    },
    [rotate, scale, translateX, onPatchApply]
  );

  // Test transition button
  const handleTestTransition = useCallback(() => {
    // Toggle a property to test the transition
    const currentOpacity = parseFloat(styles.opacity || '1');
    const newOpacity = currentOpacity === 1 ? 0.5 : 1;
    onPatchApply('opacity', String(newOpacity));
    
    // Reset after transition
    setTimeout(() => {
      onPatchApply('opacity', String(currentOpacity));
    }, transitionDuration + 100);
  }, [styles.opacity, transitionDuration, onPatchApply]);

  // Get feature UIs
  const durationUI = transitionDurationFeature.ui as FeatureUINumber;
  const delayUI = transitionDelayFeature.ui as FeatureUINumber;
  const rotateUI = transformRotateFeature.ui as FeatureUINumber;
  const scaleUI = transformScaleFeature.ui as FeatureUINumber;
  const translateXUI = transformTranslateXFeature.ui as FeatureUINumber;
  const translateYUI = transformTranslateYFeature.ui as FeatureUINumber;

  return (
    <Section id="effects" title="Effects" collapsible>
      {/* Transition Controls */}
      <div>
        <span style={labelStyle}>Transition Property</span>
        <Dropdown
          options={TRANSITION_PROPERTIES.map(p => ({ value: p.value, label: p.label }))}
          value={transitionProperty}
          onChange={handleTransitionPropertyChange}
          width="100%"
        />
      </div>

      <Row gap={spacing[2]} style={{ marginTop: spacing[2] }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Duration</span>
          <NumberField
            value={transitionDuration}
            onChange={handleTransitionDurationChange}
            unit={durationUI.unit}
            min={durationUI.min}
            max={durationUI.max}
            step={durationUI.step}
            propertyType="transitionDuration"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Delay</span>
          <NumberField
            value={transitionDelay}
            onChange={handleTransitionDelayChange}
            unit={delayUI.unit}
            min={delayUI.min}
            max={delayUI.max}
            step={delayUI.step}
            propertyType="transitionDelay"
          />
        </div>
      </Row>

      <div style={{ marginTop: spacing[2] }}>
        <span style={labelStyle}>Easing</span>
        <Dropdown
          options={EASING_PRESETS.map(e => ({ value: e.value, label: e.label }))}
          value={transitionEasing}
          onChange={handleTransitionEasingChange}
          width="100%"
        />
      </div>

      {/* Test button */}
      <button
        style={{
          marginTop: spacing[2],
          width: '100%',
          padding: `${spacing[2]} ${spacing[3]}`,
          fontSize: '12px',
          fontWeight: 500,
          color: colors.text,
          backgroundColor: colors.surfaceRaised,
          border: `1px solid ${colors.border}`,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[2],
          transition: 'background-color 0.1s',
        }}
        onClick={handleTestTransition}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--neutral-700)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.surfaceRaised;
        }}
      >
        <AppIcon name="eye" size={14} />
        Test Transition
      </button>

      {/* Transform Controls */}
      <div style={subsectionStyle}>
        <span style={{ ...labelStyle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Transform
        </span>
      </div>

      <Row gap={spacing[2]} style={{ marginTop: spacing[2] }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Rotate</span>
          <NumberField
            value={rotate}
            onChange={handleRotateChange}
            icon={<AppIcon name="reset" size={14} color={colors.textMuted} />}
            unit={rotateUI.unit}
            min={rotateUI.min}
            max={rotateUI.max}
            step={rotateUI.step}
            propertyType="rotate"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Scale</span>
          <NumberField
            value={scale}
            onChange={handleScaleChange}
            icon={<AppIcon name="maximize" size={14} color={colors.textMuted} />}
            min={scaleUI.min}
            max={scaleUI.max}
            step={scaleUI.step}
            propertyType="scale"
          />
        </div>
      </Row>

      <Row gap={spacing[2]} style={{ marginTop: spacing[2] }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Translate X</span>
          <NumberField
            value={translateX}
            onChange={handleTranslateXChange}
            icon={<AppIcon name="width" size={14} color={colors.textMuted} />}
            unit={translateXUI.unit}
            min={translateXUI.min}
            max={translateXUI.max}
            step={translateXUI.step}
            propertyType="translateX"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={labelStyle}>Translate Y</span>
          <NumberField
            value={translateY}
            onChange={handleTranslateYChange}
            icon={<AppIcon name="height" size={14} color={colors.textMuted} />}
            unit={translateYUI.unit}
            min={translateYUI.min}
            max={translateYUI.max}
            step={translateYUI.step}
            propertyType="translateY"
          />
        </div>
      </Row>
    </Section>
  );
}

/**
 * Build a combined CSS transform string
 */
function buildTransformString(
  rotate: number,
  scale: number,
  translateX: number,
  translateY: number
): string {
  const parts: string[] = [];
  
  if (translateX !== 0 || translateY !== 0) {
    parts.push(`translate(${translateX}px, ${translateY}px)`);
  }
  if (rotate !== 0) {
    parts.push(`rotate(${rotate}deg)`);
  }
  if (scale !== 1) {
    parts.push(`scale(${scale})`);
  }
  
  return parts.length > 0 ? parts.join(' ') : 'none';
}
