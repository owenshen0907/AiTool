// File: src/app/components/VoiceToneManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import VoiceToneSidebar from './VoiceToneSidebar';
import VoiceToneDetailPane from './VoiceToneDetailPane';
import AddVoiceToneModal from './AddVoiceToneModal';
import type { VoiceTone } from '@/lib/models/model';

interface Props {
    supplierId: string;
    onClose: () => void;
}

export default function VoiceToneManagement({ supplierId, onClose }: Props) {
    const [tones, setTones] = useState<VoiceTone[]>([]);
    const [selectedTone, setSelectedTone] = useState<VoiceTone | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalTone, setModalTone] = useState<VoiceTone | null>(null);

    const fetchTones = async () => {
        try {
            const res = await fetch('/api/suppliers/voice');
            if (res.ok) {
                const data: VoiceTone[] = await res.json();
                setTones(data);
                setSelectedTone(prev =>
                    prev ? data.find(t => t.id === prev.id) || data[0] || null : data[0] || null
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { void fetchTones(); }, []);

    const handleSaved = () => {
        void fetchTones();
        setShowModal(false);
    };

    const handleDelete = async (t: VoiceTone) => {
        // 如果有预览文件，先删文件
        if (t.previewAudioFileId) {
            await fetch('/api/files', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_id: t.previewAudioFileId }),
            });
        }
        // 再删音色
        await fetch('/api/suppliers/voice', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: t.id }),
        });
        await fetchTones();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="relative bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
                    aria-label="关闭"
                >×</button>

                <VoiceToneSidebar
                    tones={tones}
                    selectedTone={selectedTone}
                    onSelect={setSelectedTone}
                    onAdd={() => { setModalTone(null); setShowModal(true); }}
                    onDelete={handleDelete}
                />

                <VoiceToneDetailPane
                    tone={selectedTone}
                    onEdit={t => { setModalTone(t); setShowModal(true); }}
                />

                {showModal && (
                    <AddVoiceToneModal
                        supplierId={supplierId}
                        tone={modalTone}
                        onClose={() => setShowModal(false)}
                        onSaved={handleSaved}
                    />
                )}
            </div>
        </div>
    );
}
