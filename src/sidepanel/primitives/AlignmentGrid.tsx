/**
 * Alignment Grid
 * 
 * 3×3 grid of alignment positions for flex/grid containers.
 * Maps to justify-content × align-items combinations.
 */

import React, { useState } from 'react';
import { colors, radii, transitions } from '../tokens';

type AlignItems = 'flex-start' | 'center' | 'flex-end';
type JustifyContent = 'flex-start' | 'center' | 'flex-end';

interface AlignmentGridProps {
    alignItems: string;
    justifyContent: string;
    onChange: (alignItems: AlignItems, justifyContent: JustifyContent) => void;
    disabled?: boolean;
}

// Map alignment values to grid positions
const alignMap: Record<string, AlignItems> = {
    'flex-start': 'flex-start',
    'start': 'flex-start',
    'center': 'center',
    'flex-end': 'flex-end',
    'end': 'flex-end',
    'stretch': 'flex-start',
    'baseline': 'flex-start',
    'normal': 'flex-start',
};

const justifyMap: Record<string, JustifyContent> = {
    'flex-start': 'flex-start',
    'start': 'flex-start',
    'center': 'center',
    'flex-end': 'flex-end',
    'end': 'flex-end',
    'space-between': 'center',
    'space-around': 'center',
    'space-evenly': 'center',
    'normal': 'flex-start',
};

function normalizeAlign(value: string): AlignItems {
    return alignMap[value] || 'flex-start';
}

function normalizeJustify(value: string): JustifyContent {
    return justifyMap[value] || 'flex-start';
}

// Positions in the grid (row, col) to alignment values
const positions: Array<{ row: number; col: number; align: AlignItems; justify: JustifyContent }> = [
    { row: 0, col: 0, align: 'flex-start', justify: 'flex-start' },
    { row: 0, col: 1, align: 'flex-start', justify: 'center' },
    { row: 0, col: 2, align: 'flex-start', justify: 'flex-end' },
    { row: 1, col: 0, align: 'center', justify: 'flex-start' },
    { row: 1, col: 1, align: 'center', justify: 'center' },
    { row: 1, col: 2, align: 'center', justify: 'flex-end' },
    { row: 2, col: 0, align: 'flex-end', justify: 'flex-start' },
    { row: 2, col: 1, align: 'flex-end', justify: 'center' },
    { row: 2, col: 2, align: 'flex-end', justify: 'flex-end' },
];

const styles = {
    container: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 4,
        width: '100%',
        height: 100,
        padding: 8,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        border: `1px solid ${colors.border}`,
    } as React.CSSProperties,
    cell: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
        borderRadius: 2,
        transition: transitions.fast,
    } as React.CSSProperties,
    dot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: colors.textMuted,
        transition: transitions.fast,
    } as React.CSSProperties,
    dotActive: {
        width: 12,
        height: 12,
        backgroundColor: colors.accent,
    } as React.CSSProperties,
    dotHovered: {
        backgroundColor: colors.text,
    } as React.CSSProperties,
};

export function AlignmentGrid({
    alignItems,
    justifyContent,
    onChange,
    disabled = false,
}: AlignmentGridProps): React.ReactElement {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const currentAlign = normalizeAlign(alignItems);
    const currentJustify = normalizeJustify(justifyContent);

    return (
        <div style={styles.container}>
            {positions.map((pos, idx) => {
                const isActive = pos.align === currentAlign && pos.justify === currentJustify;
                const isHovered = hoveredIndex === idx;

                return (
                    <button
                        key={idx}
                        type="button"
                        style={{
                            ...styles.cell,
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => !disabled && onChange(pos.align, pos.justify)}
                        onMouseEnter={() => !disabled && setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        disabled={disabled}
                        title={`${pos.align} / ${pos.justify}`}
                    >
                        <div
                            style={{
                                ...styles.dot,
                                ...(isActive ? styles.dotActive : {}),
                                ...(isHovered && !isActive ? styles.dotHovered : {}),
                            }}
                        />
                    </button>
                );
            })}
        </div>
    );
}
