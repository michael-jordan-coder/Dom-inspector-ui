/**
 * Icon Registry
 * 
 * Central mapping of icon names to Tabler Icon components.
 * This is the ONLY place where Tabler icons are imported.
 */

import {
    // Navigation & Actions
    IconPointer,
    IconCopy,
    IconRefresh,
    IconArrowBackUp,
    IconArrowForwardUp,
    IconCheck,
    IconX,
    IconChevronDown,
    IconChevronRight,

    // Layout & Flow
    IconLayoutRows,
    IconLayoutColumns,
    IconLayoutGrid,
    IconArrowsHorizontal,
    IconArrowsVertical,
    IconArrowsMaximize,
    IconBoxAlignTop,
    IconBoxAlignBottom,
    IconBoxAlignLeft,
    IconBoxAlignRight,
    IconAlignBoxCenterMiddle,

    // Spacing
    IconSpacingHorizontal,
    IconSpacingVertical,
    IconBorderRadius,

    // Appearance
    IconDroplet,
    IconDropletFilled,
    IconPalette,
    IconEye,
    IconEyeOff,

    // Typography
    IconTypography,
    IconTextSize,
    IconLineHeight,
    IconBold,

    // Misc
    IconLink,
    IconLinkOff,
    IconGripVertical,
    IconDots,
    IconAdjustments,
    IconSettings,
    IconSelector,
    IconScissors,
    IconSquare,
    IconSquareCheckFilled,
    IconPhoto,
    IconPlus,
    IconMinus,
    IconMinimize,
    IconMaximize,
    IconSearch,
    IconCommand,
} from '@tabler/icons-react';

import type { Icon } from '@tabler/icons-react';

/**
 * Icon name to component mapping.
 * Add new icons here as needed.
 */
export const ICONS = {
    // Navigation & Actions
    pointer: IconPointer,
    copy: IconCopy,
    reset: IconRefresh,
    undo: IconArrowBackUp,
    redo: IconArrowForwardUp,
    check: IconCheck,
    close: IconX,
    chevronDown: IconChevronDown,
    chevronRight: IconChevronRight,

    // Layout Flow
    flowRow: IconLayoutColumns,
    flowColumn: IconLayoutRows,
    flowWrap: IconLayoutGrid,
    flowGrid: IconLayoutGrid,

    // Alignment
    alignTop: IconBoxAlignTop,
    alignBottom: IconBoxAlignBottom,
    alignLeft: IconBoxAlignLeft,
    alignRight: IconBoxAlignRight,
    alignCenter: IconAlignBoxCenterMiddle,

    // Sizing & Spacing
    width: IconArrowsHorizontal,
    height: IconArrowsVertical,
    dimensions: IconArrowsMaximize,
    paddingH: IconSpacingHorizontal,
    paddingV: IconSpacingVertical,
    marginH: IconArrowsHorizontal,
    marginV: IconArrowsVertical,
    gap: IconSpacingHorizontal,
    cornerRadius: IconBorderRadius,

    // Appearance
    opacity: IconDroplet,
    opacityFilled: IconDropletFilled,
    color: IconPalette,
    eye: IconEye,
    eyeOff: IconEyeOff,

    // Typography
    typography: IconTypography,
    fontSize: IconTextSize,
    lineHeight: IconLineHeight,
    fontWeight: IconBold,

    // Misc
    link: IconLink,
    unlink: IconLinkOff,
    grip: IconGripVertical,
    dots: IconDots,
    settings: IconSettings,
    adjustments: IconAdjustments,
    selector: IconSelector,
    clip: IconScissors,
    checkbox: IconSquare,
    checkboxChecked: IconSquareCheckFilled,
    image: IconPhoto,
    plus: IconPlus,
    minus: IconMinus,
    minimize: IconMinimize,
    maximize: IconMaximize,
    search: IconSearch,
    command: IconCommand,
} as const;

export type IconName = keyof typeof ICONS;
export type TablerIcon = Icon;
