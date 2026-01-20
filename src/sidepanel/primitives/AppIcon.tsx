/**
 * AppIcon
 * 
 * Centralized icon component that wraps Tabler Icons.
 * Provides consistent sizing, colors, and theming.
 * 
 * Usage:
 *   <AppIcon name="copy" />
 *   <AppIcon name="reset" size={20} state="danger" />
 */

import React from 'react';
import { ICONS, type IconName } from '../icons/registry';

export type IconState = 'default' | 'muted' | 'active' | 'danger';

interface AppIconProps {
    /** Icon name from registry */
    name: IconName;
    /** Size in pixels (default: 18) */
    size?: number;
    /** Stroke width (default: 1.5) */
    stroke?: number;
    /** Color override (default: currentColor) */
    color?: string;
    /** Semantic state for automatic coloring */
    state?: IconState;
    /** Additional CSS class */
    className?: string;
    /** Style overrides */
    style?: React.CSSProperties;
}

// State to CSS variable mapping
const stateColors: Record<IconState, string> = {
    default: 'var(--icon-color-default, currentColor)',
    muted: 'var(--icon-color-muted, var(--text-muted))',
    active: 'var(--icon-color-active, var(--accent))',
    danger: 'var(--icon-color-danger, var(--error))',
};

// Default icon configuration
const DEFAULTS = {
    size: 18,
    stroke: 1.5,
};

export function AppIcon({
    name,
    size = DEFAULTS.size,
    stroke = DEFAULTS.stroke,
    color,
    state = 'default',
    className,
    style,
}: AppIconProps): React.ReactElement | null {
    const IconComponent = ICONS[name];

    if (!IconComponent) {
        console.warn(`AppIcon: Unknown icon "${name}"`);
        return null;
    }

    // Determine color: explicit prop > state > default
    const resolvedColor = color ?? stateColors[state];

    return (
        <IconComponent
            size={size}
            stroke={stroke}
            color={resolvedColor}
            className={className}
            style={style}
        />
    );
}

// Re-export types for convenience
export type { IconName };
