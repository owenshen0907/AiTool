/* EditVoiceToneModal.tsx */
// File: src/app/components/EditVoiceToneModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { VoiceTone } from '@/lib/models/model';

interface Props {
    tone: VoiceTone;
    onClose: () => void;
    onSaved: () => void;
}

export default function EditVoiceToneModal({ tone, onClose, onSaved }: Props) {
    const [name, setName] = useState(tone.name);
    const [description, setDescription] = useState(tone.description || '');
    const [sampleAudioPath, setSampleAudioPath] = useState(tone.sampleAudioPath);

    const handleSave = async () => {
        const res = await fetch('/api/suppliers/voice', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: tone.id,
                name,
                description,
                sample_audio_path: sampleAudioPath,
            }),
        });
        if (res.ok) {
            onSaved();
            onClose();
        } else {
            alert('更新失败');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-96" onClick={e => e.stopPropagation()}>
                <h4 className="text-lg font-semibold mb-4">编辑音色</h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm">名称</label>
                        <input value={name} onChange={e=>setName(e.target.value)} className="w-full border px-2 py-1 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">描述</label>
                        <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border px-2 py-1 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">试听路径</label>
                        <input value={sampleAudioPath} onChange={e=>setSampleAudioPath(e.target.value)} className="w-full border px-2 py-1 rounded" />
                    </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-3 py-1 rounded border">取消</button>
                    <button onClick={handleSave} className="px-3 py-1 rounded bg-blue-600 text-white">保存</button>
                </div>
            </div>
        </div>
    );
}
