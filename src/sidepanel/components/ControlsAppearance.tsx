import React, { useCallback, useState } from 'react';
import type { ComputedStylesSnapshot } from '../../shared/types';
import { applyStylePatch } from '../messaging/sidepanelBridge';

interface ControlsAppearanceProps {
  selector: string;
  styles: ComputedStylesSnapshot;
  onStylesUpdated: (styles: ComputedStylesSnapshot) => void;
}

const componentStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  title: {
    fontSize: 'var(--fs-sm)',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 'var(--space-1)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  label: {
    fontSize: 'var(--fs-xs)',
    fontWeight: 500,
    color: 'var(--text-muted)',
    minWidth: 100,
  },
  sliderContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  slider: {
    flex: 1,
    height: 4,
    WebkitAppearance: 'none',
    appearance: 'none',
    backgroundColor: 'var(--border)',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: 'var(--fs-xs)',
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    minWidth: 40,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    padding: 'var(--space-2)',
    fontSize: 'var(--fs-sm)',
    fontFamily: 'monospace',
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    outline: 'none',
  },
  colorInputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  colorInput: {
    flex: 1,
    padding: 'var(--space-2)',
    fontSize: 'var(--fs-sm)',
    fontFamily: 'monospace',
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    outline: 'none',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  colorPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
};

/**
 * Parse opacity value (can be "1", "0.5", etc.)
 */
function parseOpacity(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 100;
  return Math.round(num * 100);
}

/**
 * Parse border-radius value (can be "8px", "0px", etc.)
 */
function parseBorderRadius(value: string): number {
  return parseInt(value) || 0;
}

export function ControlsAppearance({
  selector,
  styles,
}: ControlsAppearanceProps): React.ReactElement {
  const [colorValue, setColorValue] = useState(styles.backgroundColor);

  const opacityPercent = parseOpacity(styles.opacity);
  const radiusValue = parseBorderRadius(styles.borderRadius);

  const handleChange = useCallback(
    async (property: string, value: string) => {
      try {
        await applyStylePatch(selector, property, value, styles[property as keyof ComputedStylesSnapshot]);
      } catch (e) {
        console.error('Failed to apply patch:', e);
      }
    },
    [selector, styles]
  );

  const handleOpacityChange = (value: number) => {
    const opacity = (value / 100).toFixed(2);
    handleChange('opacity', opacity);
  };

  const handleRadiusChange = (value: string) => {
    const num = parseInt(value) || 0;
    handleChange('borderRadius', `${num}px`);
  };

  const handleColorChange = (value: string) => {
    setColorValue(value);
    handleChange('backgroundColor', value);
  };

  return (
    <div style={componentStyles.card}>
      <h3 style={componentStyles.title}>Appearance</h3>

      {/* Opacity */}
      <div style={componentStyles.row}>
        <span style={componentStyles.label}>Opacity</span>
        <div style={componentStyles.sliderContainer}>
          <input
            type="range"
            style={componentStyles.slider}
            min={0}
            max={100}
            value={opacityPercent}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
          />
          <span style={componentStyles.sliderValue as React.CSSProperties}>{opacityPercent}%</span>
        </div>
      </div>

      {/* Border Radius */}
      <div style={componentStyles.row}>
        <span style={componentStyles.label}>Border Radius</span>
        <div style={componentStyles.sliderContainer}>
          <input
            type="range"
            style={componentStyles.slider}
            min={0}
            max={100}
            value={radiusValue}
            onChange={(e) => handleRadiusChange(e.target.value)}
          />
          <span style={componentStyles.sliderValue as React.CSSProperties}>{radiusValue}px</span>
        </div>
      </div>

      {/* Background Color */}
      <div style={componentStyles.row}>
        <span style={componentStyles.label}>Background</span>
        <div style={componentStyles.colorInputContainer}>
          <input
            type="text"
            style={componentStyles.colorInput}
            value={colorValue}
            onChange={(e) => handleColorChange(e.target.value)}
            onBlur={(e) => handleColorChange(e.target.value)}
            placeholder="e.g., #ff0000, rgba(0,0,0,0.5)"
          />
          <div
            style={{
              ...componentStyles.colorSwatch,
              backgroundColor: colorValue,
            }}
          >
            <input
              type="color"
              style={componentStyles.colorPicker}
              value={colorValue.startsWith('#') ? colorValue : '#ffffff'}
              onChange={(e) => handleColorChange(e.target.value)}
              title="Pick color"
            />
          </div>
        </div>
      </div>

      {/* Inject slider styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: var(--accent);
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        input[type="color"]::-webkit-color-swatch {
          border: none;
        }
      `}</style>
    </div>
  );
}
