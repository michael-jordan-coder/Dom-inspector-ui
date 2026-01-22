import React from 'react';
import './components.css';

/**
 * Props for InspectorEmptyState component.
 */
export interface InspectorEmptyStateProps {
    /** Whether the element picker mode is currently active */
    isPickerActive: boolean;
    /** Callback when picker toggle button is clicked */
    onPickerToggle?: () => void;
}

/**
 * InspectorEmptyState
 * 
 * Displays when no element is currently selected in the Inspector.
 * Shows different messaging based on whether the picker is active or idle.
 */
export function InspectorEmptyState({ isPickerActive, onPickerToggle }: InspectorEmptyStateProps): React.ReactElement {
    return (
        <div className="inspector-empty-state">
            <div className="inspector-empty-state-icon">
                <svg
                    width={28}
                    height={28}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
                    />
                </svg>
            </div>
            <h3 className="inspector-empty-state-title">
                {isPickerActive ? 'Select an Element' : 'Pick Element'}
            </h3>
            <p className="inspector-empty-state-description">
                {isPickerActive
                    ? 'Click on any element in the page to inspect and edit its styles.'
                    : 'Start by selecting an element on the page to inspect its styles.'}
            </p>
            {onPickerToggle && (
                <div className="inspector-empty-state-action">
                    <button
                        className={`inspector-empty-state-button${isPickerActive ? ' is-active' : ''}`}
                        onClick={onPickerToggle}
                    >
                        <svg
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z"
                            />
                        </svg>
                        {isPickerActive ? 'Picking...' : 'Pick Element'}
                    </button>
                </div>
            )}
        </div>
    );
}

