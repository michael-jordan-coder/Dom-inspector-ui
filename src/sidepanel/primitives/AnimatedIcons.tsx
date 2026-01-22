import { motion, useReducedMotion, Variants, Transition, SVGMotionProps } from 'framer-motion';

// Shared types for the icons - extensions SVGMotionProps to be compatible with motion.svg
interface IconProps extends SVGMotionProps<SVGSVGElement> {
    size?: number | string;
}

// Shared transition configuration for premium feel
const defaultTransition: Transition = {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 0.5,
};

// ------------------------------------------------------------------
// 1) MousePointerIcon — "Spark Interaction"
// ------------------------------------------------------------------
export function MousePointerIcon({ size = 20, ...props }: IconProps) {
    const shouldReduceMotion = useReducedMotion();

    const cursorVariants: Variants = {
        rest: {
            x: 0,
            y: 0,
            scale: 1
        },
        hover: {
            x: -2,
            y: -2,
            scale: 0.95, // subtle "press" feel moving toward tip
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 10
            }
        }
    };

    const sparkVariants: Variants = {
        rest: {
            opacity: 0,
            scale: 0,
            pathLength: 0
        },
        hover: {
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 1.2],
            pathLength: [0, 1, 1],
            transition: {
                duration: 0.4,
                times: [0, 0.4, 1],
                ease: "easeOut"
            }
        }
    };

    // If reduced motion, we disable the motion variants
    const isMotionDisabled = shouldReduceMotion;

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial="rest"
            whileHover={isMotionDisabled ? undefined : "hover"}
            whileFocus={isMotionDisabled ? undefined : "hover"}
            whileTap={isMotionDisabled ? undefined : "hover"}
            {...props}
        >
            {/* Sparks - radiating from top-left (approx 3,3) */}
            <motion.path d="M3 3 L1 1" variants={sparkVariants} custom={1} />
            <motion.path d="M3 3 L3 0" variants={sparkVariants} custom={2} />
            <motion.path d="M3 3 L0 3" variants={sparkVariants} custom={3} />

            {/* Cursor Body */}
            <motion.path
                d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
                variants={cursorVariants}
            />
            <motion.path
                d="M13 13l6 6"
                variants={cursorVariants}
            />
        </motion.svg>
    );
}

// ------------------------------------------------------------------
// 2) CodeIcon — "Type-in Glyph"
// ------------------------------------------------------------------
export function CodeIcon({ size = 20, ...props }: IconProps) {
    const shouldReduceMotion = useReducedMotion();

    // A simple "p" letter path centered roughly
    // M10 11v6 M10 12h3a2 2 0 0 1 0 4h-3
    const pPath = "M10 11v6 M10 12h3a2 2 0 0 1 0 4h-3";

    const pVariants: Variants = {
        rest: {
            opacity: 0,
            y: 4
        },
        hover: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        }
    };

    const bracketLeftVariants: Variants = {
        rest: { x: 0 },
        hover: { x: -2, transition: defaultTransition }
    };
    const bracketRightVariants: Variants = {
        rest: { x: 0 },
        hover: { x: 2, transition: defaultTransition }
    };

    const isMotionDisabled = shouldReduceMotion;

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial="rest"
            whileHover={isMotionDisabled ? undefined : "hover"}
            whileFocus={isMotionDisabled ? undefined : "hover"}
            {...props}
        >
            <motion.polyline
                points="16 18 22 12 16 6"
                variants={bracketRightVariants}
            />
            <motion.polyline
                points="8 6 2 12 8 18"
                variants={bracketLeftVariants}
            />

            {/* The "p" appearing */}
            <motion.path
                d={pPath}
                strokeWidth="1.5"
                variants={pVariants}
            />
        </motion.svg>
    );
}

// ------------------------------------------------------------------
// 3) ArrowUpIcon — "Send / Launch"
// ------------------------------------------------------------------
export function ArrowUpIcon({ size = 16, ...props }: IconProps) {
    const shouldReduceMotion = useReducedMotion();

    const arrowVariants: Variants = {
        rest: {
            y: 0,
        },
        hover: {
            y: -3,
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 15
            }
        }
    };

    const trailVariants: Variants = {
        rest: {
            opacity: 0,
            y: 0,
            pathLength: 0
        },
        hover: {
            opacity: [0, 0.5, 0],
            y: 2, // Slight lag behind
            pathLength: [0.2, 1, 0], // Draws then disappears
            transition: {
                duration: 0.4,
                times: [0, 0.2, 1]
            }
        }
    };

    const isMotionDisabled = shouldReduceMotion;

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial="rest"
            whileHover={isMotionDisabled ? undefined : "hover"}
            whileFocus={isMotionDisabled ? undefined : "hover"}
            {...props}
        >
            {/* Trail (Ghost) Arrow - subtle opacity */}
            <motion.path
                d="M12 19V5M5 12l7-7 7 7"
                variants={trailVariants}
                style={{ originY: 1 }} // Expand from bottom
                strokeWidth="2"
            />

            {/* Main Arrow */}
            <motion.path
                d="M12 19V5M5 12l7-7 7 7"
                variants={arrowVariants}
            />
        </motion.svg>
    );
}
