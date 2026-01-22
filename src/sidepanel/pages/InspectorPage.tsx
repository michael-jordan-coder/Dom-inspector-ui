/**
 * Inspector Page
 * 
 * Main inspector view for element selection and style editing.
 * Shows either the inspector sidebar with element details or an empty state.
 */

import React from 'react';
import type { ElementMetadata, ComputedStylesSnapshot } from '../../shared/types';
import { InspectorEmptyState } from '../components/InspectorEmptyState';
import { InspectorSidebar } from '../InspectorSidebar';

// ============================================================================
// Props
// ============================================================================

export interface InspectorPageProps {
    /** Currently selected element, or null if none */
    selectedElement: ElementMetadata | null;
    /** Computed styles for selected element */
    computedStyles: ComputedStylesSnapshot | null;
    /** Whether the element picker is active */
    isPickerActive: boolean;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Callback to toggle picker mode */
    onPickerToggle: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function InspectorPage({
    selectedElement,
    computedStyles,
    isPickerActive,
    canUndo,
    canRedo,
    onPickerToggle,
}: InspectorPageProps): React.ReactElement {
    // Show sidebar when we have a selected element with computed styles
    if (selectedElement && computedStyles) {
        return (
            <InspectorSidebar
                element={selectedElement}
                styles={computedStyles}
                canUndo={canUndo}
                canRedo={canRedo}
            />
        );
    }

    // Show empty state when no element is selected
    return <InspectorEmptyState isPickerActive={isPickerActive} onPickerToggle={onPickerToggle} />;
}
