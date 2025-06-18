/* VoiceToneDetailPane.tsx */
// File: src/app/components/VoiceToneDetailPane.tsx
'use client';

import React from 'react';
import type { VoiceTone } from '@/lib/models/model';

interface DetailProps {
    tone: VoiceTone | null;
    onEdit: (t: VoiceTone) => void;
}

export default function VoiceToneDetailPane({ tone, onEdit }: DetailProps) {
    if (!tone) return <div className="flex-1 flex items-center justify-center text-gray-400">请选择一个音色查看详情</div>;
    return (
        <div className="flex-1 bg-white p-6 flex flex-col overflow-auto">
            <h4 className="text-2xl font-semibold mb-4">音色详情</h4>
            <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
                <div><strong>名称：</strong>{tone.name}</div>
                <div><strong>接口 ID：</strong>{tone.toneId}</div>
                <div><strong>描述：</strong>{tone.description || '-'}</div>
                <div><strong>可用模型：</strong>{tone.availableModelIds.length > 0 ? tone.availableModelIds.join(', ') : '全局'}</div>
                <div className="col-span-2"><strong>试听：</strong><audio src={tone.sampleAudioPath} controls className="mt-2 w-full" /></div>
            </div>
            <button className="mt-4 text-sm text-blue-600 hover:underline self-start" onClick={() => tone && onEdit(tone)}>编辑音色</button>
        </div>
    );
}