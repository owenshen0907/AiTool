import React from 'react';
import promptConfig from './promptConfig.json';

type IntentOption = typeof promptConfig.intentOptions[number];

interface StepIntentSelectProps {
    options: IntentOption[];
    selected: string;
    custom: string;
    onSelect: (code: string) => void;
    onCustom: (text: string) => void;
}

export default function Step2IntentSelect({ options, selected, custom, onSelect, onCustom }: StepIntentSelectProps) {
    const categories = Array.from(new Set(options.map(i => i.category)));
    return (
        <div className="space-y-4">
            <p className="text-gray-500">说明：请选择要执行的任务意图<span className="text-red-500">*</span></p>
            {categories.map(cat => (
                <div key={cat} className="flex items-start space-x-4">
                    <div className="w-1/4 font-medium text-gray-700 pt-2">{cat}</div>
                    <div className="flex-1 flex flex-wrap gap-2">
                        {options.filter(i => i.category === cat).map(i => (
                            <button
                                key={i.code}
                                title={i.description}
                                onClick={() => onSelect(i.code)}
                                className={`px-3 py-1 border rounded-lg cursor-pointer transition ${
                                    selected === i.code
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                {i.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <div className="flex items-start space-x-4">
                <div className="w-1/4 font-medium text-gray-700 pt-2">自定义</div>
                <input
                    type="text"
                    value={custom}
                    onChange={e => {
                        onCustom(e.target.value);
                        // 不要在这里再调 onSelect，否则会把 customIntent 清空
                    }}
                    placeholder="请输入自定义意图"
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                />
            </div>
        </div>
    );
}