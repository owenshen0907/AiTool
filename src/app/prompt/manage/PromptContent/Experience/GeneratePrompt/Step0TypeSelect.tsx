import React from 'react';
import promptConfig from './promptConfig.json';

type InputOption = typeof promptConfig.inputOptions[number];

interface StepTypeSelectProps {
    options: InputOption[];
    selected: string;
    onSelect: (code: string) => void;
}

export default function Step0TypeSelect({ options, selected, onSelect }: StepTypeSelectProps) {
    return (
        <div className="grid grid-cols-2 gap-6">
            <p className="col-span-2 text-gray-500">说明：请选择输入的内容类型。</p>
            {options.map(opt => (
                <div
                    key={opt.code}
                    onClick={() => onSelect(opt.code)}
                    className={`p-4 border rounded-lg cursor-pointer hover:shadow-lg ${
                        selected === opt.code ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                    }`}
                >
                    <h4 className="font-semibold mb-1">{opt.label}</h4>
                    <p className="text-sm text-gray-500">{opt.note}</p>
                </div>
            ))}
        </div>
    );
}