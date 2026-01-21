/**
 * useScrubbable Hook
 * 
 * Enables drag-to-adjust behavior for numeric values.
 * Drag right/up increases, left/down decreases.
 * 
 * Enhanced features:
 * - Detent feel at round numbers (0, 10, 50, 100)
 * - Escape to cancel and revert
 * - Shift = 10x, Alt = 0.1x
 */

import { useRef, useCallback, useEffect, useState } from 'react';

export interface ScrubbableOptions {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Allow decimal values */
    decimals?: boolean;
    /** Detent values where scrubbing should "snap" briefly */
    detents?: number[];
    /** Callback when scrubbing starts */
    onScrubStart?: () => void;
    /** Callback when scrubbing ends */
    onScrubEnd?: (cancelled: boolean) => void;
}

export interface ScrubbableHandlers {
    onPointerDown: (e: React.PointerEvent) => void;
    style: React.CSSProperties;
    isScrubbing: boolean;
}

// Default detent values
const DEFAULT_DETENTS = [0, 10, 25, 50, 75, 100, 150, 200];

export function useScrubbable({
    value,
    onChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    decimals = false,
    detents = DEFAULT_DETENTS,
    onScrubStart,
    onScrubEnd,
}: ScrubbableOptions): ScrubbableHandlers {
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startValue = useRef(value);
    const currentValue = useRef(value);
    const [isScrubbing, setIsScrubbing] = useState(false);
    
    // Track detent state
    const lastDetentValue = useRef<number | null>(null);
    const detentHoldCounter = useRef(0);

    // Update currentValue ref when value changes externally
    useEffect(() => {
        if (!isDragging.current) {
            currentValue.current = value;
        }
    }, [value]);

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

            // Detent logic: create a "sticky" feel at detent values
            const nearestDetent = detents.reduce((nearest, detent) => {
                return Math.abs(newValue - detent) < Math.abs(newValue - nearest) ? detent : nearest;
            }, detents[0]);

            const distanceToDetent = Math.abs(newValue - nearestDetent);
            const detentThreshold = step * 2; // Within 2 steps of detent

            if (distanceToDetent < detentThreshold) {
                // We're near a detent
                if (lastDetentValue.current === nearestDetent) {
                    // Same detent, increment hold counter
                    detentHoldCounter.current++;
                    
                    // After holding for a bit, allow passing through
                    if (detentHoldCounter.current < 5) {
                        newValue = nearestDetent;
                    }
                } else {
                    // New detent, snap to it
                    lastDetentValue.current = nearestDetent;
                    detentHoldCounter.current = 0;
                    newValue = nearestDetent;
                }
            } else {
                lastDetentValue.current = null;
                detentHoldCounter.current = 0;
            }

            currentValue.current = newValue;
            onChange(newValue);
        },
        [onChange, min, max, step, decimals, detents]
    );

    const handlePointerUp = useCallback(() => {
        if (isDragging.current) {
            isDragging.current = false;
            setIsScrubbing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            lastDetentValue.current = null;
            detentHoldCounter.current = 0;
            onScrubEnd?.(false);
        }
    }, [onScrubEnd]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isDragging.current) return;

            // Escape to cancel
            if (e.key === 'Escape') {
                e.preventDefault();
                isDragging.current = false;
                setIsScrubbing(false);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Revert to original value
                onChange(startValue.current);
                currentValue.current = startValue.current;
                lastDetentValue.current = null;
                detentHoldCounter.current = 0;
                onScrubEnd?.(true);
            }
        },
        [onChange, onScrubEnd]
    );

    useEffect(() => {
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handlePointerMove, handlePointerUp, handleKeyDown]);

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            isDragging.current = true;
            setIsScrubbing(true);
            startX.current = e.clientX;
            startValue.current = value;
            currentValue.current = value;
            lastDetentValue.current = null;
            detentHoldCounter.current = 0;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            onScrubStart?.();
        },
        [value, onScrubStart]
    );

    return {
        onPointerDown,
        style: { cursor: 'ew-resize' },
        isScrubbing,
    };
}
