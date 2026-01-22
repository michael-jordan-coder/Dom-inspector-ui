import { InputHTMLAttributes, forwardRef, useRef, useEffect } from 'react';
import { MousePointerIcon, CodeIcon, ArrowUpIcon } from './AnimatedIcons';

interface PromptBarProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    onPickElement?: () => void;
    onCreateSnippet?: () => void;
}

export function PromptBar({
    value,
    onChange,
    onSubmit,
    placeholder = 'Ask about this element...',
    disabled = false,
    loading = false,
    onPickElement,
    onCreateSnippet
}: PromptBarProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !disabled && !loading) {
            e.preventDefault(); // Prevent newline if it's just Enter
            onSubmit();
        }
    };

    return (
        <div className="prompt-bar-container">
            <textarea
                ref={textareaRef}
                className="prompt-textarea"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                rows={1}
            />
            <div className="prompt-actions">
                <button
                    className="icon-btn"
                    aria-label="Pick new element"
                    title="Pick new element"
                    onClick={onPickElement}
                    disabled={disabled}
                >
                    <MousePointerIcon />
                </button>
                <div className="right-actions">
                    <button
                        className="icon-btn"
                        aria-label="Create code snippet"
                        title="Create code snippet"
                        onClick={onCreateSnippet}
                        disabled={disabled}
                    >
                        <CodeIcon />
                    </button>
                    <button
                        className="send-btn"
                        onClick={onSubmit}
                        disabled={disabled || loading || !value.trim()}
                        aria-label="Send"
                    >
                        <ArrowUpIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Local icons removed in favor of AnimatedIcons import



// Standalone prompt input for custom layouts
interface PromptInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    onChange?: (value: string) => void;
}

export const PromptInput = forwardRef<HTMLInputElement, PromptInputProps>(
    ({ className = '', onChange, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`prompt-input ${className}`.trim()}
                onChange={e => onChange?.(e.target.value)}
                {...props}
            />
        );
    }
);

PromptInput.displayName = 'PromptInput';
