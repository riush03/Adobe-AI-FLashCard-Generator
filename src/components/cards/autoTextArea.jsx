import React, { useRef, useEffect } from "react";

export default function AutoTextarea({ value, onChange, placeholder, autoFocus }) {
    const ref = useRef(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!ref.current) return;

        // Save cursor position before resizing
        const cursorPos = {
            start: ref.current.selectionStart,
            end: ref.current.selectionEnd
        };

        // Reset height and calculate new height
        ref.current.style.height = "auto";
        ref.current.style.height = `${ref.current.scrollHeight}px`;

        // Restore cursor position only if not first render
        if (!isFirstRender.current && cursorPos.start !== null) {
            ref.current.selectionStart = cursorPos.start;
            ref.current.selectionEnd = cursorPos.end;
        }

        isFirstRender.current = false;
    }, [value]);

    useEffect(() => {
        // Auto-focus only on initial mount
        if (autoFocus && ref.current) {
            ref.current.focus();
            // Set cursor to end for auto-focused fields
            ref.current.selectionStart = ref.current.value.length;
            ref.current.selectionEnd = ref.current.value.length;
        }
    }, [autoFocus]);

    const textareaStyle = {
        width: "calc(100% - 36px)",
        padding: "14px 18px 0",
        fontSize: '13px',
        borderRadius: 12,
        border: "1px solid #CBE2FF",
        outline: "none",
        margin: '8px 0',
        overflow: 'hidden',
        resize: 'none',
        minHeight: '50px'
    };

    return (
        <textarea
            ref={ref}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            style={textareaStyle}
        />
    );
}