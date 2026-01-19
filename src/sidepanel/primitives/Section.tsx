import React from 'react';
import { spacing, colors, typography } from '../tokens';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  /** Optional icons to show in the title row (e.g., visibility toggle) */
  trailingIcons?: React.ReactNode;
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2], // Reduced from spacing[3]
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20, // Reduced from 24
  },
  title: {
    fontSize: typography.xs, // Reduced from sm
    fontWeight: 500,
    color: colors.textMuted, // Muted like Figma
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  trailingIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2], // Reduced from spacing[3]
  },
};

/**
 * Section - A titled container for grouping related controls.
 * Matches Figma's compact right panel section structure.
 */
export function Section({
  title,
  children,
  trailingIcons,
}: SectionProps): React.ReactElement {
  return (
    <div style={styles.section}>
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        {trailingIcons && (
          <div style={styles.trailingIcons}>{trailingIcons}</div>
        )}
      </div>
      <div style={styles.content}>{children}</div>
    </div>
  );
}
