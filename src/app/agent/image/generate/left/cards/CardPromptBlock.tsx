// File: src/app/agent/image/left/cards/CardPromptBlock.tsx
'use client';
import React from 'react';

export function CardPromptBlock({
                                    prompt,
                                    description,
                                    text
                                }: {
    prompt?: string;
    description?: string;
    text?: string | string[];
}) {
    return (
        <div className="space-y-2">
            {description && (
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{description}</p>
            )}
            {prompt && (
                <div>
                    <div className="text-[11px] font-medium text-gray-500 mb-1">Prompt</div>
                    <pre className="text-[11px] bg-gray-50 p-2 rounded whitespace-pre-wrap leading-5 max-h-40 overflow-auto">
            {prompt}
          </pre>
                </div>
            )}
            {text && (
                <div>
                    <div className="text-[11px] font-medium text-gray-500 mb-1">Text</div>
                    {Array.isArray(text) ? (
                        <ul className="list-disc ml-5 text-xs space-y-1">
                            {text.map((t, i) => (
                                <li key={i} className="whitespace-pre-wrap">
                                    {t}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs whitespace-pre-wrap">{text}</p>
                    )}
                </div>
            )}
        </div>
    );
}