import React from 'react';

// Shared types
interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
}

// ------------------------------------------------------------------
// 1) MousePointerIcon — "Spark Interaction"
// ------------------------------------------------------------------
export function MousePointerIcon({ size = 20, className, ...props }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`group ${className || ''}`}
            {...props}
        >
            <style>{`
                @keyframes mouse-spark-anim {
                    0% { opacity: 0; transform: scale(0.5); stroke-dasharray: 0 100; }
                    40% { opacity: 1; transform: scale(1.2); stroke-dasharray: 100 0; }
                    100% { opacity: 0; transform: scale(1.2); stroke-dasharray: 100 0; }
                }
                .mouse-spark { opacity: 0; transform-origin: 3px 3px; }
                .group:hover .mouse-spark { animation: mouse-spark-anim 0.4s ease-out forwards; }

                .mouse-cursor { transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: center; }
                .group:hover .mouse-cursor { transform: scale(0.95) translate(-2px, -2px); }

                @media (prefers-reduced-motion: reduce) {
                    .mouse-spark { animation: none !important; }
                    .mouse-cursor { transition: none !important; transform: none !important; }
                }
            `}</style>

            {/* Sparks - radiating from top-left (approx 3,3) */}
            <path d="M3 3 L1 1" className="mouse-spark" style={{ animationDelay: '0ms' }} />
            <path d="M3 3 L3 0" className="mouse-spark" style={{ animationDelay: '50ms' }} />
            <path d="M3 3 L0 3" className="mouse-spark" style={{ animationDelay: '100ms' }} />

            {/* Cursor Body */}
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" className="mouse-cursor" />
            <path d="M13 13l6 6" className="mouse-cursor" />
        </svg>
    );
}

// ------------------------------------------------------------------
// 2) CodeIcon — "Type-in Glyph"
// ------------------------------------------------------------------
export function CodeIcon({ size = 20, className, ...props }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`group ${className || ''}`}
            {...props}
        >
            <style>{`
                .code-p { opacity: 0; transform: translateY(4px); transition: all 0.2s ease-out; }
                .group:hover .code-p { opacity: 1; transform: translateY(0); }
                .code-bracket-left { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .group:hover .code-bracket-left { transform: translateX(-2px); }
                .code-bracket-right { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .group:hover .code-bracket-right { transform: translateX(2px); }
                @media (prefers-reduced-motion: reduce) {
                    .code-p, .code-bracket-left, .code-bracket-right { transition: none !important; transform: none !important; opacity: 1 !important; }
                }
            `}</style>

            <polyline points="16 18 22 12 16 6" className="code-bracket-right" />
            <polyline points="8 6 2 12 8 18" className="code-bracket-left" />

            {/* The "p" appearing */}
            <path d="M10 11v6 M10 12h3a2 2 0 0 1 0 4h-3" strokeWidth="1.5" className="code-p" />
        </svg>
    );
}

// ------------------------------------------------------------------
// 3) ArrowUpIcon — "Send / Launch"
// ------------------------------------------------------------------
export function ArrowUpIcon({ size = 16, className, ...props }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`group ${className || ''}`}
            {...props}
        >
            <style>{`
                @keyframes arrow-trail-anim {
                    0% { opacity: 0; stroke-dasharray: 0 100; stroke-dashoffset: 0; }
                    20% { opacity: 0.5; stroke-dasharray: 100 0; }
                    100% { opacity: 0; stroke-dasharray: 0 100; stroke-dashoffset: -10; }
                }
                .arrow-main { transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .group:hover .arrow-main { transform: translateY(-3px); }

                .arrow-trail { opacity: 0; transform: translateY(2px); }
                .group:hover .arrow-trail { animation: arrow-trail-anim 0.4s ease-out forwards; }

                @media (prefers-reduced-motion: reduce) {
                    .arrow-main, .arrow-trail { transition: none !important; animation: none !important; }
                }
            `}</style>

            {/* Trail (Ghost) Arrow */}
            <path d="M12 19V5M5 12l7-7 7 7" className="arrow-trail" strokeWidth="2" />

            {/* Main Arrow */}
            <path d="M12 19V5M5 12l7-7 7 7" className="arrow-main" />
        </svg>
    );
}
