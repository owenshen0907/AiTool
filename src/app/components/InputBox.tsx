// components/InputBox.tsx
import React from 'react';

interface InputBoxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
}

export default function InputBox({
                                     value,
                                     onChange,
                                     placeholder = '',
                                     className = '',
                                     readOnly = false,
                                 }: InputBoxProps) {
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full resize-y border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:border-blue-300 ${readOnly ? 'bg-gray-100' : ''} ${className}`}
        />
    );
}
