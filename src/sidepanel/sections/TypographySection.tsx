/**
 * Typography Section
 * 
 * Font styling controls: size, weight, line-height.
 */

import React, { useCallback } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { Section, Row, NumberField, Dropdown } from '../primitives';
import { fontSizeFeature, fontWeightFeature, lineHeightFeature } from '../features/typography';
import type { FeatureUINumber, FeatureUISegmented } from '../features/types';
import { colors, spacing } from '../tokens';

interface TypographySectionProps {
    styles: ComputedStylesSnapshot;
    onPatchApply: (property: string, value: string) => void;
}

const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: colors.textMuted,
    marginBottom: 4,
};

export function TypographySection({
    styles,
    onPatchApply,
}: TypographySectionProps): React.ReactElement {
    const fontSizeValue = fontSizeFeature.getState(styles);
    const fontWeightValue = fontWeightFeature.getState(styles);
    const lineHeightValue = lineHeightFeature.getState(styles);

    const handleFontSizeChange = useCallback(
        (value: number) => {
            const patch = fontSizeFeature.createPatch(value);
            onPatchApply(patch.property, patch.value);
        },
        [onPatchApply]
    );

    const handleFontWeightChange = useCallback(
        (value: string) => {
            const patch = fontWeightFeature.createPatch(value as 'normal' | 'medium' | 'semibold' | 'bold');
            onPatchApply(patch.property, patch.value);
        },
        [onPatchApply]
    );

    const handleLineHeightChange = useCallback(
        (value: number) => {
            const patch = lineHeightFeature.createPatch(value);
            onPatchApply(patch.property, patch.value);
        },
        [onPatchApply]
    );

    const fontSizeUI = fontSizeFeature.ui as FeatureUINumber;
    const fontWeightUI = fontWeightFeature.ui as FeatureUISegmented<string>;
    const lineHeightUI = lineHeightFeature.ui as FeatureUINumber;

    // Convert segmented options to dropdown options
    const weightOptions = fontWeightUI.options.map(opt => ({
        value: opt.value,
        label: opt.title || opt.value,
        icon: opt.icon
    }));

    return (
        <Section id="typography" title="Text" collapsible>
            {/* Font Size and Line Height */}
            <Row gap={spacing[3]}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={labelStyle}>Size</span>
                    <NumberField
                        value={fontSizeValue}
                        onChange={handleFontSizeChange}
                        icon={fontSizeUI.icon}
                        min={fontSizeUI.min}
                        max={fontSizeUI.max}
                        step={fontSizeUI.step}
                        unit={fontSizeUI.unit}
                    />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={labelStyle}>Line Height</span>
                    <NumberField
                        value={lineHeightValue}
                        onChange={handleLineHeightChange}
                        icon={lineHeightUI.icon}
                        min={lineHeightUI.min}
                        max={lineHeightUI.max}
                        step={lineHeightUI.step}
                    />
                </div>
            </Row>

            {/* Font Weight */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={labelStyle}>Weight</span>

                <Dropdown
                    options={weightOptions}
                    value={fontWeightValue}
                    onChange={handleFontWeightChange}
                    width="100%"
                />
            </div>
        </Section>
    );
}
