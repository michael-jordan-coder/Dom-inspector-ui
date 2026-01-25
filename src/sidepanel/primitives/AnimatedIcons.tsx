import React from 'react';

// Shared types for the icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
}

// ------------------------------------------------------------------
// 1) MousePointerIcon
// ------------------------------------------------------------------
export function MousePointerIcon({ size = 20, ...props }: IconProps) {
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
            style={{ overflow: 'visible' }}
            {...props}
        >
            <style>
                {`
                    .ai-mouse-cursor { transform-origin: center; }
                    .ai-mouse-spark { opacity: 0; transform-origin: 3px 3px; transform: scale(0); }

                    @media (prefers-reduced-motion: no-preference) {
                        .ai-mouse-cursor { transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                        svg:hover .ai-mouse-cursor { transform: translate(-2px, -2px) scale(0.95); }

                        .ai-mouse-spark { transition: all 0.4s ease-out; }
                        svg:hover .ai-mouse-spark { opacity: 1; transform: scale(1.2); }
                    }
                `}
            </style>
            <g className="ai-mouse-spark">
                 <path d="M3 3 L1 1" />
                 <path d="M3 3 L3 0" />
                 <path d="M3 3 L0 3" />
            </g>
            <path
                className="ai-mouse-cursor"
                d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
            />
            <path
                className="ai-mouse-cursor"
                d="M13 13l6 6"
            />
        </svg>
    );
}

// ------------------------------------------------------------------
// 2) CodeIcon
// ------------------------------------------------------------------
export function CodeIcon({ size = 20, ...props }: IconProps) {
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
            {...props}
        >
             <style>
                {`
                    .ai-code-p { opacity: 0; transform: translateY(4px); }

                    @media (prefers-reduced-motion: no-preference) {
                        .ai-code-p { transition: all 0.2s ease-out; }
                        svg:hover .ai-code-p { opacity: 1; transform: translateY(0); }

                        .ai-code-bracket-left { transition: transform 0.2s ease; }
                        svg:hover .ai-code-bracket-left { transform: translateX(-2px); }

                        .ai-code-bracket-right { transition: transform 0.2s ease; }
                        svg:hover .ai-code-bracket-right { transform: translateX(2px); }
                    }
                `}
            </style>
            <polyline className="ai-code-bracket-right" points="16 18 22 12 16 6" />
            <polyline className="ai-code-bracket-left" points="8 6 2 12 8 18" />
            <path className="ai-code-p" d="M10 11v6 M10 12h3a2 2 0 0 1 0 4h-3" strokeWidth="1.5" />
        </svg>
    );
}

// ------------------------------------------------------------------
// 3) ArrowUpIcon
// ------------------------------------------------------------------
export function ArrowUpIcon({ size = 16, ...props }: IconProps) {
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
            {...props}
        >
             <style>
                {`
                    .ai-arrow-trail { opacity: 0; transform: translateY(0); }

                    @media (prefers-reduced-motion: no-preference) {
                        .ai-arrow-main { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                        svg:hover .ai-arrow-main { transform: translateY(-3px); }

                        .ai-arrow-trail { transition: all 0.4s ease; }
                        svg:hover .ai-arrow-trail { opacity: 0.5; transform: translateY(2px); }
                    }
                `}
            </style>
            <path className="ai-arrow-trail" d="M12 19V5M5 12l7-7 7 7" strokeWidth="2" />
            <path className="ai-arrow-main" d="M12 19V5M5 12l7-7 7 7" />
        </svg>
    );
}
