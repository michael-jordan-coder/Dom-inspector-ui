/**
 * Dropdown
 * 
 * Reusable dropdown menu component for selecting from a list of options.
 * Matches the style of ColorPopover and other primitives.
 */

import React, { useState, useRef, useCallback } from 'react';
import { colors, radii, spacing, sizes, transitions } from '../tokens';
import { AppIcon } from './AppIcon';

export interface DropdownOption<T extends string | number> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

interface DropdownProps<T extends string | number> {
    /** Current selected value */
    value: T;
    /** Options list */
    options: DropdownOption<T>[];
    /** Change handler */
    onChange: (value: T) => void;
    /** Whether control is disabled */
    disabled?: boolean;
    /** Optional start icon */
    icon?: React.ReactNode;
    /** Placeholder when no value selected */
    placeholder?: string;
    /** Width */
    width?: number | string;
    /** Custom trigger render prop */
    renderTrigger?: (props: { onClick: () => void; isOpen: boolean; ref: React.RefObject<HTMLDivElement> }) => React.ReactNode;
}

const styles = {
    trigger: {
        display: 'flex',
        alignItems: 'center',
        height: sizes.controlHeight,
        backgroundColor: colors.surfaceRaised,
        borderRadius: radii.sm,
        cursor: 'pointer',
        userSelect: 'none' as const,
        border: `1px solid transparent`,
        transition: `all ${transitions.fast}`,
        paddingRight: spacing[2],
    } as React.CSSProperties,
    triggerDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    } as React.CSSProperties,
    icon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: sizes.controlIconWidth,
        height: '100%',
        color: colors.textMuted,
        flexShrink: 0,
        padding: 6,
    } as React.CSSProperties,
    value: {
        flex: 1,
        fontSize: '11px',
        color: colors.text,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: `0 ${spacing[1]}`,
    } as React.CSSProperties,
    chevron: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textMuted,
        marginLeft: spacing[1],
    } as React.CSSProperties,

    // Popover styles
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        zIndex: 1000,
    },
    popover: {
        position: 'fixed' as const,
        zIndex: 1001,
        width: 200,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        maxHeight: 240,
        overflowY: 'auto' as const,
        padding: spacing[1],
    } as React.CSSProperties,
    item: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: '12px',
        color: colors.text,
        cursor: 'pointer',
        borderRadius: radii.sm,
        transition: `background-color ${transitions.fast}`,
    } as React.CSSProperties,
    itemSelected: {
        color: colors.accent,
        fontWeight: 500,
    } as React.CSSProperties,
};

export function Dropdown<T extends string | number>({
    value,
    options,
    onChange,
    disabled = false,
    icon,
    placeholder = 'Select...',
    width = '100%',
    renderTrigger,
}: DropdownProps<T>): React.ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0 });

    const selectedOption = options.find(o => o.value === value);

    // Calculate position when opening
    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const popoverHeight = Math.min(options.length * 32 + 8, 240); // Approx height

            let top = rect.bottom + 4;

            // Flip up if space is tight at bottom
            if (top + popoverHeight > window.innerHeight - 8) {
                top = rect.top - popoverHeight - 4;
            }

            const popoverWidth = Math.max(rect.width, 180);
            let left = rect.left;

            // Prevent horizontal overflow
            if (left + popoverWidth > window.innerWidth - 8) {
                left = window.innerWidth - popoverWidth - 8;
            }

            setPopoverPos({
                top,
                left,
                width: popoverWidth,
            });
        }
    }, [options.length]);

    const handleToggle = useCallback(() => {
        if (disabled) return;
        if (!isOpen) {
            updatePosition();
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [disabled, isOpen, updatePosition]);

    const handleSelect = useCallback((val: T) => {
        onChange(val);
        setIsOpen(false);
    }, [onChange]);

    return (
        <>
            {/* Trigger Button */}
            {renderTrigger ? (
                renderTrigger({ onClick: handleToggle, isOpen, ref: triggerRef })
            ) : (
                <div
                    ref={triggerRef}
                    style={{
                        ...styles.trigger,
                        width,
                        ...(disabled ? styles.triggerDisabled : {}),
                    }}
                    onClick={handleToggle}
                >
                    {icon && <div style={styles.icon}>{icon}</div>}

                    <div style={styles.value}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </div>

                    <div style={styles.chevron}>
                        <AppIcon name="chevronDown" size={14} />
                    </div>
                </div>
            )}

            {/* Popover Menu */}
            {isOpen && (
                <>
                    <div style={styles.overlay} onClick={() => setIsOpen(false)} />
                    <div
                        style={{
                            ...styles.popover,
                            top: popoverPos.top,
                            left: popoverPos.left,
                            width: popoverPos.width,
                        }}
                    >
                        {options.map((option, index) => {
                            const isSelected = option.value === value;
                            const isHovered = hoveredIndex === index;

                            return (
                                <div
                                    key={String(option.value)}
                                    style={{
                                        ...styles.item,
                                        ...(isHovered ? { backgroundColor: colors.surfaceRaised } : {}),
                                        ...(isSelected ? styles.itemSelected : {}),
                                    }}
                                    onClick={() => handleSelect(option.value)}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {option.icon}
                                        {option.label}
                                    </span>
                                    {isSelected && <AppIcon name="check" size={14} />}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );
}
