// File: src/app/components/VoiceToneSidebar.tsx
'use client';

import React, { useState } from 'react';
import type { VoiceTone } from '@/lib/models/model';

interface SidebarProps {
    tones: VoiceTone[];
    selectedTone: VoiceTone | null;
    onSelect: (t: VoiceTone) => void;
    onAdd: () => void;
    onDelete: (t: VoiceTone) => void;
}

export default function VoiceToneSidebar({ tones, selectedTone, onSelect, onAdd, onDelete }: SidebarProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    return (
        <div className="w-1/4 bg-white p-6 overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-700">音色列表</h4>
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={onAdd}
                >
                    新增音色
                </button>
            </div>
            <ul className="space-y-2">
                {tones.map(t => (
                    <li
                        key={t.id}
                        className={`px-4 py-2 rounded-lg cursor-pointer transition relative ${
                            selectedTone?.id === t.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => onSelect(t)}
                    >
                        <div className="flex justify-between items-center">
                            <span>{t.name}</span>
                            <div className="relative">
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === t.id ? null : t.id);
                                    }}
                                    className="px-2 py-1 rounded hover:bg-gray-200"
                                >
                                    ⋮
                                </button>
                                {openMenuId === t.id && (
                                    <div className="absolute right-0 mt-1 bg-white border rounded shadow z-10">
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setOpenMenuId(null);
                                                onDelete(t);
                                            }}
                                            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                        >
                                            删除
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
