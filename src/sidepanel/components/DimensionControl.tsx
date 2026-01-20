import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { colors, spacing, sizes, radii } from '../tokens';
import { Dropdown, DropdownOption } from '../primitives/Dropdown';
import { NumberField } from '../primitives/NumberField';
import { AppIcon } from '../primitives/AppIcon';

interface DimensionControlProps {
    label: 'W' | 'H';
    property: 'width' | 'height';
    value: string;
    minValue?: string; // If provided, Min controls are managed
    maxValue?: string; // If provided, Max controls are managed
    onApply: (property: string, value: string) => void;
}

type DimensionMode = 'fixed' | 'fit' | 'fill';

const AUTO_VALUE = 'auto';
const NONE_VALUE = 'none';

function parseMode(value: string): DimensionMode {
    if (value === 'fit-content') return 'fit';
    if (value === '100%') return 'fill';
    return 'fixed';
}

function parseNumeric(value: string): number {
    return parseFloat(value) || 0;
}

function getUnit(value: string): string {
    if (value.endsWith('%')) return '%';
    if (value.endsWith('vw')) return 'vw';
    if (value.endsWith('vh')) return 'vh';
    return 'px';
}

export function DimensionControl({
    label,
    property,
    value,
    minValue,
    maxValue,
    onApply,
}: DimensionControlProps): React.ReactElement {
    // State for the main value
    const mode = parseMode(value);
    const numericValue = parseNumeric(value);
    const unit = getUnit(value);

    // Helper to check if min/max are "active"
    const isMinActive = minValue && minValue !== AUTO_VALUE; // auto is the default
    const isMaxActive = maxValue && maxValue !== NONE_VALUE;

    // We maintain a local numeric value for fixed mode to avoid jumping when switching modes
    const [cachedFixedValue, setCachedFixedValue] = useState<number>(numericValue || 100);

    // If we are in fixed mode, update cache
    useEffect(() => {
        if (mode === 'fixed') {
            setCachedFixedValue(numericValue);
        }
    }, [numericValue, mode]);

    const handleModeChange = useCallback((newMode: string) => {
        if (newMode === 'fit') {
            onApply(property, 'fit-content');
        } else if (newMode === 'fill') {
            onApply(property, '100%');
        } else if (newMode === 'fixed') {
            onApply(property, `${cachedFixedValue}px`);
        } else if (newMode === 'add-min') {
            onApply(`min${property.charAt(0).toUpperCase() + property.slice(1)}`, '0px');
        } else if (newMode === 'add-max') {
            onApply(`max${property.charAt(0).toUpperCase() + property.slice(1)}`, '100%');
        } else if (newMode === 'remove-min') {
            onApply(`min${property.charAt(0).toUpperCase() + property.slice(1)}`, AUTO_VALUE);
        } else if (newMode === 'remove-max') {
            onApply(`max${property.charAt(0).toUpperCase() + property.slice(1)}`, NONE_VALUE);
        }
    }, [property, cachedFixedValue, onApply]);

    const handleNumericChange = useCallback((val: number) => {
        onApply(property, `${val}${unit}`); // Use current unit
        setCachedFixedValue(val);
    }, [property, unit, onApply]);

    // Dropdown options
    const options: DropdownOption<string>[] = [
        { value: 'fixed', label: `Fixed ${property === 'width' ? 'Width' : 'Height'}`, icon: <AppIcon name={property === 'width' ? 'width' : 'height'} size={14} /> },
        { value: 'fit', label: 'Fit contents', icon: <AppIcon name="minimize" size={14} /> }, // Using minimize as proxy for Hug
        { value: 'fill', label: 'Fill container', icon: <AppIcon name="maximize" size={14} /> }, // Using maximize as proxy for Fill
    ];

    // Add advanced options if min/max props provided
    if (minValue !== undefined || maxValue !== undefined) {
        // We can't strictly insert a divider in DropdownOption type unless we support it.
        // Assuming Dropdown renders all options.
        // If we want a divider, we might need a hack or support in Dropdown.
        // For now, straight list.

        if (minValue !== undefined) {
            if (isMinActive) {
                options.push({ value: 'remove-min', label: 'Remove Min ' + (property === 'width' ? 'Width' : 'Height'), icon: <AppIcon name="minus" size={14} /> });
            } else {
                options.push({ value: 'add-min', label: 'Add Min ' + (property === 'width' ? 'Width' : 'Height'), icon: <AppIcon name="plus" size={14} /> });
            }
        }

        if (maxValue !== undefined) {
            if (isMaxActive) {
                options.push({ value: 'remove-max', label: 'Remove Max ' + (property === 'width' ? 'Width' : 'Height'), icon: <AppIcon name="minus" size={14} /> });
            } else {
                options.push({ value: 'add-max', label: 'Add Max ' + (property === 'width' ? 'Width' : 'Height'), icon: <AppIcon name="plus" size={14} /> });
            }
        }
    }

    // Render trigger for the mode dropdown
    // It resides inside the input container to tight layout
    const renderTrigger = useCallback(({ onClick, ref }: { onClick: () => void, ref: React.RefObject<HTMLDivElement> }) => (
        <div
            ref={ref}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: sizes.controlHeight,
                cursor: 'pointer',
                color: colors.textMuted,
                flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
        >
            <AppIcon name="chevronDown" size={12} />
        </div>
    ), []);

    const dropdownElement = (
        <Dropdown
            value={mode}
            options={options}
            onChange={handleModeChange}
            renderTrigger={renderTrigger}
            width={160} // Popover width
        />
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {/* Main Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {/* If Mode is FIXED: Show Number Field */}
                    {mode === 'fixed' ? (
                        <NumberField
                            value={numericValue}
                            onChange={handleNumericChange}
                            icon={<AppIcon name={label === 'W' ? 'width' : 'height'} size={14} color={colors.textMuted} />}
                            unit={unit} // Preserve unit if possible
                            width="100%"
                            suffix={dropdownElement}
                        />
                    ) : (
                        // Mode is FIT or FILL: Show a button-like display
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                height: sizes.controlHeight,
                                backgroundColor: colors.surfaceRaised,
                                borderRadius: radii.sm,
                                flex: 1,
                                paddingRight: 0,
                                cursor: 'default',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: sizes.controlIconWidth, height: '100%', color: colors.textMuted, padding: 6
                            }}>
                                <AppIcon name={label === 'W' ? 'width' : 'height'} size={14} />
                            </div>
                            <div style={{ flex: 1, fontSize: '11px', color: colors.text, whiteSpace: 'nowrap' }}>
                                {mode === 'fit' ? 'Fit Content' : 'Fill Container'}
                            </div>
                            {dropdownElement}
                        </div>
                    )}
                </div>
            </div>

            {/* Min Constraint Row */}
            {isMinActive && (
                <ConstraintRow
                    label={`Min ${label}`}
                    value={minValue!}
                    onApply={(val) => onApply(`min${property.charAt(0).toUpperCase() + property.slice(1)}`, val)} // Pass raw val
                    onRemove={() => handleModeChange('remove-min')}
                />
            )}

            {/* Max Constraint Row */}
            {isMaxActive && (
                <ConstraintRow
                    label={`Max ${label}`}
                    value={maxValue!}
                    onApply={(val) => onApply(`max${property.charAt(0).toUpperCase() + property.slice(1)}`, val)}
                    onRemove={() => handleModeChange('remove-max')}
                />
            )}
        </div>
    );
}

// Subcomponent for Min/Max rows
function ConstraintRow({ label, value, onApply, onRemove }: { label: string, value: string, onApply: (v: string) => void, onRemove: () => void }) {
    const numParams = useMemo(() => {
        return { val: parseFloat(value) || 0, unit: getUnit(value) };
    }, [value]);

    const removeButton = (
        <div
            onClick={onRemove}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                cursor: 'pointer',
                color: colors.textMuted,
                height: '100%',
            }}
            title="Remove constraint"
            onMouseEnter={(e) => e.currentTarget.style.color = colors.text}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
        >
            <AppIcon name="close" size={10} />
        </div>
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <div style={{ width: sizes.controlIconWidth + 4 }}></div> {/* Indent */}
            <div style={{ flex: 1, position: 'relative' }}>
                <NumberField
                    value={numParams.val}
                    onChange={(v) => onApply(`${v}${numParams.unit}`)}
                    icon={<span style={{ fontSize: 10, color: colors.textMuted }}>{label}</span>}
                    unit={numParams.unit}
                    width="100%"
                    suffix={removeButton}
                />
            </div>
        </div>
    )
}
