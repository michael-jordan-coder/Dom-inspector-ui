/**
 * Changes Section
 *
 * Displays the count of visual changes and provides export options:
 * - Export JSON (copy raw export data)
 * - Generate Prompt (copy full execution prompt for AI coding agent)
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Section } from '../primitives';
import { AppIcon } from '../primitives/AppIcon';
import { colors, spacing, radii } from '../tokens';
import { getExportData } from '../messaging/sidepanelBridge';
import { formatHandoffJSON } from '../../shared/handoff';
import { generateExecutionPrompt } from '../../shared/promptTemplate';
import type { PromptHandoffExport } from '../../shared/types';

interface ChangesSectionProps {
  /** Trigger refresh when styles change */
  refreshTrigger?: number;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  } as React.CSSProperties,
  buttonRow: {
    display: 'flex',
    gap: spacing[2],
    width: '100%',
  } as React.CSSProperties,
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: `8px ${spacing[2]}`,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  buttonPrimary: {
    backgroundColor: colors.accent,
    color: '#fff',
  } as React.CSSProperties,
  feedback: {
    fontSize: '11px',
    color: colors.success,
    textAlign: 'center',
    padding: spacing[1],
    opacity: 0,
    transition: 'opacity 0.2s ease',
  } as React.CSSProperties,
  feedbackVisible: {
    opacity: 1,
  } as React.CSSProperties,
  patchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    fontSize: '11px',
    fontFamily: 'monospace',
    color: colors.textMuted,
    maxHeight: '120px',
    overflowY: 'auto',
  } as React.CSSProperties,
  patchItem: {
    display: 'flex',
    gap: spacing[1],
    alignItems: 'baseline',
  } as React.CSSProperties,
  patchProperty: {
    color: colors.accent,
    fontWeight: 500,
  } as React.CSSProperties,
  patchArrow: {
    color: colors.textMuted,
    opacity: 0.6,
  } as React.CSSProperties,
  patchValue: {
    color: colors.text,
  } as React.CSSProperties,
};

function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function ChangesSection({
  refreshTrigger,
}: ChangesSectionProps): React.ReactElement {
  const [exportData, setExportData] = useState<PromptHandoffExport | null>(null);
  const [patchCount, setPatchCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch export data when component mounts or refreshTrigger changes
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getExportData();
        if (mounted) {
          setExportData(result.exportData);
          setPatchCount(result.patchCount);
        }
      } catch (e) {
        console.error('Failed to fetch export data:', e);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  // Show feedback temporarily
  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  // Copy JSON to clipboard
  const handleExportJSON = useCallback(async () => {
    if (!exportData) return;

    try {
      const json = formatHandoffJSON(exportData);
      await navigator.clipboard.writeText(json);
      showFeedback('JSON copied to clipboard');
    } catch (e) {
      console.error('Failed to copy JSON:', e);
      showFeedback('Failed to copy');
    }
  }, [exportData, showFeedback]);

  // Generate and copy execution prompt
  const handleGeneratePrompt = useCallback(async () => {
    if (!exportData) return;

    try {
      const prompt = generateExecutionPrompt(exportData);
      await navigator.clipboard.writeText(prompt);
      showFeedback('Execution prompt copied to clipboard');
    } catch (e) {
      console.error('Failed to copy prompt:', e);
      showFeedback('Failed to copy');
    }
  }, [exportData, showFeedback]);

  const hasChanges = patchCount > 0 && exportData !== null;

  return (
    <Section
      title="Changes"
      collapsible
      badge={patchCount > 0 ? patchCount : undefined}
      defaultCollapsed={!hasChanges}
    >
      <div style={styles.container}>
        {/* Patch list preview */}
        {hasChanges && exportData && (
          <div style={styles.patchList}>
            {exportData.patches.map((patch, i) => (
              <div key={i} style={styles.patchItem}>
                <span style={styles.patchProperty}>
                  {toKebabCase(String(patch.property))}:
                </span>
                <span style={styles.patchValue}>{patch.previousValue}</span>
                <span style={styles.patchArrow}>→</span>
                <span style={styles.patchValue}>{patch.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.button,
              ...(!hasChanges ? styles.buttonDisabled : {}),
            }}
            onClick={handleExportJSON}
            disabled={!hasChanges || isLoading}
            title="Copy raw JSON export data"
          >
            <AppIcon name="copy" size={14} />
            Export JSON
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              ...(!hasChanges ? styles.buttonDisabled : {}),
            }}
            onClick={handleGeneratePrompt}
            disabled={!hasChanges || isLoading}
            title="Generate execution prompt for AI coding agent"
          >
            <AppIcon name="command" size={14} />
            Generate Prompt
          </button>
        </div>

        {/* Feedback message */}
        <div
          style={{
            ...styles.feedback,
            ...(feedback ? styles.feedbackVisible : {}),
          }}
        >
          {feedback || '\u00A0'}
        </div>

        {/* Empty state */}
        {!hasChanges && !isLoading && (
          <div
            style={{
              fontSize: '12px',
              color: colors.textMuted,
              textAlign: 'center',
              padding: spacing[2],
            }}
          >
            Make visual changes to see them here
          </div>
        )}
      </div>
    </Section>
  );
}
