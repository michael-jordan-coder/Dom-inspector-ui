/**
 * PresetPopover
 * 
 * Floating popover showing preset values and recent selections.
 * Appears below NumberField on focus.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { colors, radii, spacing, typography } from '../tokens';

interface PresetPopoverProps {
  /** Preset values to display */
  presets: number[];
  /** Recently used values */
  recentValues?: number[];
  /** Current value (for highlighting) */
  currentValue: number;
  /** Unit to display */
  unit?: string;
  /** Callback when value is selected */
  onSelect: (value: number) => void;
  /** Close popover callback */
  onClose: () => void;
  /** Position anchor element rect */
  anchorRect: DOMRect;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 999,
  },
  container: {
    position: 'fixed' as const,
    zIndex: 1000,
    minWidth: 140,
    maxWidth: 200,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    animation: 'fadeIn 0.1s ease-out',
  } as React.CSSProperties,
  section: {
    padding: spacing[2],
  } as React.CSSProperties,
  sectionWithBorder: {
    padding: spacing[2],
    borderBottom: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: spacing[1],
  } as React.CSSProperties,
  grid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
  } as React.CSSProperties,
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    padding: '4px 8px',
    fontSize: typography.xs,
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: 'none',
    borderRadius: radii.sm,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  } as React.CSSProperties,
  itemSelected: {
    backgroundColor: colors.accent,
    color: '#fff',
  } as React.CSSProperties,
  itemHovered: {
    backgroundColor: 'var(--neutral-700)',
  } as React.CSSProperties,
};

export function PresetPopover({
  presets,
  recentValues = [],
  currentValue,
  unit: _unit = 'px', // Reserved for future use with unit display
  onSelect,
  onClose,
  anchorRect,
}: PresetPopoverProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    // Find current value in presets
    const allValues = [...recentValues, ...presets];
    return allValues.findIndex((v) => v === currentValue);
  });

  // Position calculation
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const containerHeight = 200; // Approximate max height
    const containerWidth = 160;

    let top = anchorRect.bottom + 4;
    let left = anchorRect.left;

    // Keep within viewport
    if (left + containerWidth > window.innerWidth - 8) {
      left = window.innerWidth - containerWidth - 8;
    }
    if (top + containerHeight > window.innerHeight - 8) {
      top = anchorRect.top - containerHeight - 4;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  // Keyboard navigation
  useEffect(() => {
    const allValues = [...recentValues, ...presets];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < allValues.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : allValues.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < allValues.length) {
            onSelect(allValues[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [presets, recentValues, selectedIndex, onSelect, onClose]);

  const handleItemClick = useCallback((value: number) => {
    onSelect(value);
    onClose();
  }, [onSelect, onClose]);

  const formatValue = (value: number): string => {
    if (value === 9999) return '∞';
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(1);
  };

  // Combine recent and presets, removing duplicates
  const uniquePresets = presets.filter((p) => !recentValues.includes(p));
  let globalIndex = 0;

  return (
    <>
      {/* Overlay to catch clicks outside */}
      <div style={styles.overlay} onClick={onClose} />

      <div
        ref={containerRef}
        style={{
          ...styles.container,
          top: position.top,
          left: position.left,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Recent values section */}
        {recentValues.length > 0 && (
          <div style={styles.sectionWithBorder}>
            <div style={styles.sectionTitle}>Recent</div>
            <div style={styles.grid}>
              {recentValues.map((value) => {
                const idx = globalIndex++;
                const isSelected = idx === selectedIndex;
                const isHovered = idx === hoveredIndex;
                const isCurrent = value === currentValue;
                
                return (
                  <button
                    key={`recent-${value}`}
                    style={{
                      ...styles.item,
                      ...(isSelected || isCurrent ? styles.itemSelected : {}),
                      ...(isHovered && !isSelected && !isCurrent ? styles.itemHovered : {}),
                    }}
                    onClick={() => handleItemClick(value)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {formatValue(value)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Presets section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            {recentValues.length > 0 ? 'Presets' : `Quick Values`}
          </div>
          <div style={styles.grid}>
            {uniquePresets.map((value) => {
              const idx = globalIndex++;
              const isSelected = idx === selectedIndex;
              const isHovered = idx === hoveredIndex;
              const isCurrent = value === currentValue;
              
              return (
                <button
                  key={`preset-${value}`}
                  style={{
                    ...styles.item,
                    ...(isSelected || isCurrent ? styles.itemSelected : {}),
                    ...(isHovered && !isSelected && !isCurrent ? styles.itemHovered : {}),
                  }}
                  onClick={() => handleItemClick(value)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {formatValue(value)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
