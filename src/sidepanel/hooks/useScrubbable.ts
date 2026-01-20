/**
 * useScrubbable Hook
 * 
 * Enables drag-to-adjust behavior for numeric values.
 * Drag right/up increases, left/down decreases.
 */

import { useRef, useCallback, useEffect } from 'react';

export interface ScrubbableOptions {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Allow decimal values */
    decimals?: boolean;
}

export interface ScrubbableHandlers {
    onPointerDown: (e: React.PointerEvent) => void;
    style: React.CSSProperties;
}

export function useScrubbable({
    value,
    onChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    decimals = false,
}: ScrubbableOptions): ScrubbableHandlers {
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startValue = useRef(value);

    const handlePointerMove = useCallback(
        (e: PointerEvent) => {
            if (!isDragging.current) return;

            const deltaX = e.clientX - startX.current;

            // Calculate step multiplier based on modifiers
            let stepMultiplier = 1;
            if (e.shiftKey) stepMultiplier = 10;
            if (e.altKey) stepMultiplier = 0.1;

            // Calculate new value: ~1px = 1 step unit
            const sensitivity = 0.5; // pixels per step
            const delta = Math.round(deltaX * sensitivity) * step * stepMultiplier;
            let newValue = startValue.current + delta;

            // Clamp to range
            newValue = Math.max(min, Math.min(max, newValue));

            // Round based on decimals setting
            if (!decimals) {
                newValue = Math.round(newValue);
            } else {
                newValue = Math.round(newValue * 100) / 100;
            }

            onChange(newValue);
        },
        [onChange, min, max, step, decimals]
    );

    const handlePointerUp = useCallback(() => {
        if (isDragging.current) {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, []);

    useEffect(() => {
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };
    }, [handlePointerMove, handlePointerUp]);

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            isDragging.current = true;
            startX.current = e.clientX;
            startValue.current = value;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        },
        [value]
    );

    return {
        onPointerDown,
        style: { cursor: 'ew-resize' },
    };
}
