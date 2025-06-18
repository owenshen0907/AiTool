/* VoiceToneSidebar.tsx */
// File: src/app/components/VoiceToneSidebar.tsx
'use client';

import React from 'react';
import type { VoiceTone } from '@/lib/models/model';

interface SidebarProps {
    tones: VoiceTone[];
    selectedTone: VoiceTone | null;
    onSelect: (t: VoiceTone) => void;
    onAdd: () => void;
}

export default function VoiceToneSidebar({ tones, selectedTone, onSelect, onAdd }: SidebarProps) {
    return (
        <div className="w-1/4 bg-white p-6 overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-700">音色列表</h4>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" onClick={onAdd}>新增音色</button>
            </div>
            <ul className="space-y-2">
                {tones.map(t => (
                    <li key={t.id} onClick={() => onSelect(t)} className={`px-4 py-2 rounded-lg cursor-pointer transition ${selectedTone?.id===t.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>{t.name}</li>
                ))}
            </ul>
        </div>
    );
}

