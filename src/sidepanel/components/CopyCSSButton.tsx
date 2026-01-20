/**
 * Copy CSS Button
 * 
 * Copies applied style changes as a CSS rule to clipboard.
 */

import React, { useState, useCallback } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { colors, radii, spacing, transitions } from '../tokens';

interface CopyCSSButtonProps {
    selector: string;
    styles: ComputedStylesSnapshot;
    onCopy?: () => void;
}

/**
 * Generate CSS text from a ComputedStylesSnapshot.
 * Only includes properties that aren't default/auto values.
 */
function generateCSS(selector: string, styles: ComputedStylesSnapshot): string {
    const properties: string[] = [];

    // Helper to add property if it has a real value
    const add = (prop: string, value: string | undefined) => {
        if (value && value !== 'auto' && value !== 'none' && value !== 'normal') {
            properties.push(`  ${toKebabCase(prop)}: ${value};`);
        }
    };

    // Layout
    add('display', styles.display);
    if (styles.display?.includes('flex') || styles.display?.includes('grid')) {
        add('justify-content', styles.justifyContent);
        add('align-items', styles.alignItems);
        add('gap', styles.gap);
    }

    // Dimensions
    add('width', styles.width);
    add('height', styles.height);

    // Spacing
    add('padding-top', styles.paddingTop);
    add('padding-right', styles.paddingRight);
    add('padding-bottom', styles.paddingBottom);
    add('padding-left', styles.paddingLeft);
    add('margin-top', styles.marginTop);
    add('margin-right', styles.marginRight);
    add('margin-bottom', styles.marginBottom);
    add('margin-left', styles.marginLeft);

    // Appearance
    if (styles.opacity !== '1') add('opacity', styles.opacity);
    add('border-radius', styles.borderRadius);
    add('background-color', styles.backgroundColor);
    add('color', styles.color);
    add('border-color', styles.borderColor);

    // Typography
    add('font-size', styles.fontSize);
    add('font-weight', styles.fontWeight);
    if (styles.lineHeight !== 'normal') add('line-height', styles.lineHeight);

    if (properties.length === 0) {
        return `/* No styles to copy */`;
    }

    return `${selector} {\n${properties.join('\n')}\n}`;
}

/**
 * Convert camelCase to kebab-case.
 */
function toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    width: '100%',
    padding: `8px ${spacing[3]}`,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: transitions.fast,
};

export function CopyCSSButton({
    selector,
    styles,
    onCopy,
}: CopyCSSButtonProps): React.ReactElement {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleCopy = useCallback(async () => {
        const css = generateCSS(selector, styles);
        try {
            await navigator.clipboard.writeText(css);
            setCopied(true);
            onCopy?.();
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy CSS:', e);
        }
    }, [selector, styles, onCopy]);

    return (
        <button
            style={{
                ...buttonStyle,
                backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceRaised,
            }}
            onClick={handleCopy}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Copy all styles as CSS"
        >
            {copied ? (
                <>
                    <span style={{ color: colors.success }}>✓</span>
                    Copied!
                </>
            ) : (
                <>
                    <span style={{ opacity: 0.7 }}>📋</span>
                    Copy CSS
                </>
            )}
        </button>
    );
}
