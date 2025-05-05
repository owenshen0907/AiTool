import React from 'react';

interface StepOutputExampleProps {
    example: string;
    onExample: (v: string) => void;
}

export default function Step4OutputExample({ example, onExample }: StepOutputExampleProps) {
    return (
        <div>
            <p className="text-gray-500">说明：提供期望输出示例（非必填）。</p>
            <textarea
                value={example}
                onChange={e => onExample(e.target.value)}
                placeholder="示例：{ summary: '...' }"
                className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 resize-none"
            />
        </div>
    );
}