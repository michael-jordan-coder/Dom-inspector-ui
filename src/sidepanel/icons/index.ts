/**
 * Icon System
 * 
 * Exports the centralized icon registry and AppIcon component.
 * All icons in the sidepanel should use this system.
 */

// Export registry and types
export { ICONS, type IconName, type TablerIcon } from './registry';

// Re-export AppIcon for convenience
export { AppIcon, type IconState } from '../primitives/AppIcon';