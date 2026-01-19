import React from 'react';

interface InspectorHeaderProps {
  isPickerActive: boolean;
  onPickerToggle: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-4)',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
  },
  title: {
    fontSize: 'var(--fs-lg)',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  logo: {
    width: 20,
    height: 20,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--fs-sm)',
    fontWeight: 600,
    color: 'var(--text)',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buttonActive: {
    backgroundColor: 'var(--success)',
  },
  buttonIcon: {
    width: 16,
    height: 16,
  },
};

export function InspectorHeader({
  isPickerActive,
  onPickerToggle,
}: InspectorHeaderProps): React.ReactElement {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>
        <svg
          style={styles.logo}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        UI Inspector
      </h1>

      <button
        style={{
          ...styles.button,
          ...(isPickerActive ? styles.buttonActive : {}),
        }}
        onClick={onPickerToggle}
        title={isPickerActive ? 'Cancel selection' : 'Pick an element to inspect'}
      >
        <svg
          style={styles.buttonIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          {isPickerActive ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
            />
          )}
        </svg>
        {isPickerActive ? 'Selecting...' : 'Pick Element'}
      </button>
    </header>
  );
}
