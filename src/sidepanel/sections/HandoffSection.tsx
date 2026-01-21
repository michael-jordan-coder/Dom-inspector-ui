/**
 * Handoff Section (Phase 1 Handoff State)
 *
 * The Handoff State is the moment of trust transfer. The tool declares:
 * "My job is done. Here is what I produced. The rest is on you."
 *
 * Displays:
 * - Visual summary of changes
 * - CSS diff (copy-able)
 * - JSON export (copy-able)
 * - Download option
 * - Stability warnings (non-dismissable)
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Section } from '../primitives';
import { AppIcon } from '../primitives/AppIcon';
import { colors, spacing, radii } from '../tokens';
import { getExportData } from '../messaging/sidepanelBridge';
import {
  createExportSchemaV1,
  formatExportJSON,
  generateCSSDiff,
  generateChangeSummary,
} from '../../shared/handoff';
import { generateExecutionPrompt } from '../../shared/promptTemplate';
import type {
  PromptHandoffExport,
  VisualUIInspectorExport,
  ExportWarning,
  SelectorConfidence,
} from '../../shared/types';

interface HandoffSectionProps {
  /** Trigger refresh when styles change */
  refreshTrigger?: number;
  /** Callback when user wants to return to editing */
  onReturnToEditing?: () => void;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[3],
  } as React.CSSProperties,
  
  // Summary section
  summary: {
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  } as React.CSSProperties,
  summaryTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  } as React.CSSProperties,
  summaryMeta: {
    fontSize: '11px',
    color: colors.textMuted,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  } as React.CSSProperties,
  
  // Code blocks
  codeBlock: {
    padding: spacing[3],
    backgroundColor: 'var(--neutral-900)',
    borderRadius: radii.md,
    fontSize: '11px',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    color: colors.text,
    overflowX: 'auto',
    whiteSpace: 'pre',
    maxHeight: '200px',
    overflowY: 'auto',
    lineHeight: 1.5,
  } as React.CSSProperties,
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  } as React.CSSProperties,
  codeLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  
  // Warnings (non-dismissable per Phase 1)
  warningsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
  } as React.CSSProperties,
  warning: {
    padding: spacing[3],
    borderRadius: radii.md,
    display: 'flex',
    gap: spacing[2],
    alignItems: 'flex-start',
    fontSize: '12px',
    lineHeight: 1.4,
  } as React.CSSProperties,
  warningLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
  } as React.CSSProperties,
  warningMedium: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    color: '#fcd34d',
  } as React.CSSProperties,
  warningIcon: {
    flexShrink: 0,
    marginTop: '2px',
  } as React.CSSProperties,
  warningContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  } as React.CSSProperties,
  warningCode: {
    fontFamily: 'monospace',
    fontSize: '10px',
    opacity: 0.7,
  } as React.CSSProperties,
  warningAffected: {
    fontSize: '10px',
    opacity: 0.7,
    fontFamily: 'monospace',
  } as React.CSSProperties,
  
  // Confidence indicator
  confidenceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    fontSize: '12px',
  } as React.CSSProperties,
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  } as React.CSSProperties,
  confidenceHigh: {
    backgroundColor: '#22c55e',
  } as React.CSSProperties,
  confidenceMedium: {
    backgroundColor: '#fbbf24',
  } as React.CSSProperties,
  confidenceLow: {
    backgroundColor: '#ef4444',
  } as React.CSSProperties,
  
  // Buttons
  buttonRow: {
    display: 'flex',
    gap: spacing[2],
    flexWrap: 'wrap',
  } as React.CSSProperties,
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    padding: `8px ${spacing[3]}`,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    border: 'none',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    flex: 1,
    minWidth: '120px',
  } as React.CSSProperties,
  buttonPrimary: {
    backgroundColor: colors.accent,
    color: '#fff',
  } as React.CSSProperties,
  buttonSmall: {
    padding: `4px ${spacing[2]}`,
    fontSize: '11px',
    flex: 'none',
    minWidth: 'auto',
  } as React.CSSProperties,
  
  // Feedback
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
  
  // Tabs
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: spacing[2],
  } as React.CSSProperties,
  tab: {
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.textMuted,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    marginBottom: '-1px',
  } as React.CSSProperties,
  tabActive: {
    color: colors.text,
    borderBottomColor: colors.accent,
  } as React.CSSProperties,
  
  // Empty state
  empty: {
    padding: spacing[4],
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: '12px',
  } as React.CSSProperties,
};

// ============================================================================
// Helper Components
// ============================================================================

function ConfidenceIndicator({ confidence }: { confidence: SelectorConfidence }) {
  const label = {
    high: 'Stable selector (ID-based)',
    medium: 'Moderately stable (class-based)',
    low: 'Fragile selector (may break)',
  }[confidence];

  return (
    <div style={styles.confidenceRow}>
      <div
        style={{
          ...styles.confidenceDot,
          ...(confidence === 'high' ? styles.confidenceHigh : {}),
          ...(confidence === 'medium' ? styles.confidenceMedium : {}),
          ...(confidence === 'low' ? styles.confidenceLow : {}),
        }}
      />
      <span style={{ color: colors.textMuted }}>{label}</span>
    </div>
  );
}

function WarningDisplay({ warning }: { warning: ExportWarning }) {
  const isLowSeverity = warning.code === 'SELECTOR_POSITIONAL' || 
                         warning.code === 'MULTIPLE_ELEMENTS_MATCHED' ||
                         warning.code === 'ELEMENT_NOT_FOUND';

  return (
    <div
      style={{
        ...styles.warning,
        ...(isLowSeverity ? styles.warningLow : styles.warningMedium),
      }}
    >
      <div style={styles.warningIcon}>
        <AppIcon
          name="alertCircle"
          size={16}
          color={isLowSeverity ? '#fca5a5' : '#fcd34d'}
        />
      </div>
      <div style={styles.warningContent}>
        <div>{warning.message}</div>
        <div style={styles.warningCode}>{warning.code}</div>
        {warning.affectedSelectors && warning.affectedSelectors.length > 0 && (
          <div style={styles.warningAffected}>
            Affects: {warning.affectedSelectors.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

type ExportTab = 'css' | 'json' | 'prompt';

export function HandoffSection({
  refreshTrigger,
  onReturnToEditing,
}: HandoffSectionProps): React.ReactElement {
  const [legacyExport, setLegacyExport] = useState<PromptHandoffExport | null>(null);
  const [patchCount, setPatchCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ExportTab>('css');

  // Fetch export data when component mounts or refreshTrigger changes
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getExportData();
        if (mounted) {
          setLegacyExport(result.exportData);
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

  // Convert legacy export to Export Schema v1
  const exportV1 = useMemo((): VisualUIInspectorExport | null => {
    if (!legacyExport) return null;

    // Get page URL and viewport
    const pageUrl = window.location?.href || 'unknown';
    const viewport = {
      width: window.innerWidth || 1440,
      height: window.innerHeight || 900,
    };

    // Convert patches to internal format for the conversion function
    const internalPatches = legacyExport.patches.map(p => ({
      ...p,
      timestamp: Date.now(),
    }));

    return createExportSchemaV1(
      pageUrl,
      viewport,
      internalPatches,
      legacyExport.stability.selectorResolution.status,
      legacyExport.stability.selectorResolution.matchCount,
      legacyExport.stability.identityMatch
    );
  }, [legacyExport]);

  // Generate CSS diff
  const cssDiff = useMemo(() => {
    if (!exportV1) return '';
    return generateCSSDiff(exportV1.patches);
  }, [exportV1]);

  // Generate JSON export
  const jsonExport = useMemo(() => {
    if (!exportV1) return '';
    return formatExportJSON(exportV1);
  }, [exportV1]);

  // Generate execution prompt (for AI)
  const executionPrompt = useMemo(() => {
    if (!legacyExport) return '';
    return generateExecutionPrompt(legacyExport);
  }, [legacyExport]);

  // Get overall confidence level
  const overallConfidence = useMemo((): SelectorConfidence => {
    if (!exportV1 || exportV1.patches.length === 0) return 'low';
    
    // Return the lowest confidence among all patches
    const confidences = exportV1.patches.map(p => p.selectorConfidence);
    if (confidences.includes('low')) return 'low';
    if (confidences.includes('medium')) return 'medium';
    return 'high';
  }, [exportV1]);

  // Show feedback temporarily
  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  // Copy handlers
  const handleCopyCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssDiff);
      showFeedback('CSS copied to clipboard');
    } catch (e) {
      console.error('Failed to copy CSS:', e);
      showFeedback('Failed to copy');
    }
  }, [cssDiff, showFeedback]);

  const handleCopyJSON = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonExport);
      showFeedback('JSON copied to clipboard');
    } catch (e) {
      console.error('Failed to copy JSON:', e);
      showFeedback('Failed to copy');
    }
  }, [jsonExport, showFeedback]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(executionPrompt);
      showFeedback('Prompt copied to clipboard');
    } catch (e) {
      console.error('Failed to copy prompt:', e);
      showFeedback('Failed to copy');
    }
  }, [executionPrompt, showFeedback]);

  const handleDownloadJSON = useCallback(() => {
    if (!exportV1) return;
    
    try {
      const blob = new Blob([jsonExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visual-inspector-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback('Downloaded JSON file');
    } catch (e) {
      console.error('Failed to download:', e);
      showFeedback('Failed to download');
    }
  }, [exportV1, jsonExport, showFeedback]);

  const hasChanges = patchCount > 0 && exportV1 !== null;

  if (!hasChanges) {
    return (
      <Section
        id="handoff"
        title="Handoff"
        collapsible
        badge={undefined}
        defaultCollapsed
      >
        <div style={styles.empty}>
          {isLoading ? 'Loading...' : 'Make visual changes to see handoff options'}
        </div>
      </Section>
    );
  }

  return (
    <Section
      id="handoff"
      title="Handoff"
      collapsible
      badge={`${patchCount} change${patchCount !== 1 ? 's' : ''}`}
    >
      <div style={styles.container}>
        {/* Summary */}
        <div style={styles.summary}>
          <div style={styles.summaryTitle}>
            <AppIcon name="check" size={16} color={colors.success} />
            Ready for Handoff
          </div>
          <div style={styles.summaryMeta}>
            <span>{generateChangeSummary(exportV1.patches)}</span>
            <span>Page: {new URL(exportV1.pageUrl).pathname}</span>
            <span>Viewport: {exportV1.viewport.width}×{exportV1.viewport.height}</span>
          </div>
          <ConfidenceIndicator confidence={overallConfidence} />
        </div>

        {/* Warnings (non-dismissable per Phase 1 contract) */}
        {exportV1.warnings.length > 0 && (
          <div style={styles.warningsContainer}>
            {exportV1.warnings.map((warning, i) => (
              <WarningDisplay key={i} warning={warning} />
            ))}
          </div>
        )}

        {/* Export Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'css' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('css')}
          >
            CSS Diff
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'json' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('json')}
          >
            JSON Export
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'prompt' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('prompt')}
          >
            AI Prompt
          </button>
        </div>

        {/* Code Display */}
        {activeTab === 'css' && (
          <div>
            <div style={styles.codeHeader}>
              <span style={styles.codeLabel}>CSS Changes</span>
              <button
                style={{ ...styles.button, ...styles.buttonSmall }}
                onClick={handleCopyCSS}
              >
                <AppIcon name="copy" size={12} />
                Copy
              </button>
            </div>
            <div style={styles.codeBlock}>{cssDiff}</div>
          </div>
        )}

        {activeTab === 'json' && (
          <div>
            <div style={styles.codeHeader}>
              <span style={styles.codeLabel}>Export Schema v1</span>
              <button
                style={{ ...styles.button, ...styles.buttonSmall }}
                onClick={handleCopyJSON}
              >
                <AppIcon name="copy" size={12} />
                Copy
              </button>
            </div>
            <div style={styles.codeBlock}>{jsonExport}</div>
          </div>
        )}

        {activeTab === 'prompt' && (
          <div>
            <div style={styles.codeHeader}>
              <span style={styles.codeLabel}>Execution Prompt</span>
              <button
                style={{ ...styles.button, ...styles.buttonSmall }}
                onClick={handleCopyPrompt}
              >
                <AppIcon name="copy" size={12} />
                Copy
              </button>
            </div>
            <div style={styles.codeBlock}>{executionPrompt}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.buttonRow}>
          <button
            style={styles.button}
            onClick={handleDownloadJSON}
          >
            <AppIcon name="download" size={14} />
            Download JSON
          </button>
          {onReturnToEditing && (
            <button
              style={styles.button}
              onClick={onReturnToEditing}
            >
              <AppIcon name="chevronLeft" size={14} />
              Return to Editing
            </button>
          )}
        </div>

        {/* Feedback */}
        <div
          style={{
            ...styles.feedback,
            ...(feedback ? styles.feedbackVisible : {}),
          }}
        >
          {feedback || '\u00A0'}
        </div>

        {/* Trust transfer notice */}
        <div
          style={{
            fontSize: '11px',
            color: colors.textMuted,
            textAlign: 'center',
            fontStyle: 'italic',
            opacity: 0.7,
          }}
        >
          This export is a specification document. Implementation responsibility transfers to you.
        </div>
      </div>
    </Section>
  );
}
