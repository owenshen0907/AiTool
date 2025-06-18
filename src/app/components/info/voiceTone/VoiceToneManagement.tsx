// File: src/app/components/VoiceToneManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import VoiceToneSidebar from './VoiceToneSidebar';
import VoiceToneDetailPane from './VoiceToneDetailPane';
import AddVoiceToneModal from './AddVoiceToneModal';
import EditVoiceToneModal from './EditVoiceToneModal';
import type { VoiceTone } from '@/lib/models/model';

interface Props {
    /** 所选供应商 ID，用于新增弹窗 */
    supplierId: string;
    /** 关闭管理面板 */
    onClose: () => void;
}

export default function VoiceToneManagement({ supplierId, onClose }: Props) {
    const [tones, setTones] = useState<VoiceTone[]>([]);
    const [selectedTone, setSelectedTone] = useState<VoiceTone | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    /** 拉取当前用户所有音色 */
    const fetchTones = async () => {
        try {
            const res = await fetch('/api/suppliers/voice');
            if (res.ok) {
                const data: VoiceTone[] = await res.json();
                setTones(data);
                setSelectedTone(prev =>
                    prev
                        ? data.find(t => t.id === prev.id) || data[0] || null
                        : data[0] || null
                );
            } else {
                console.error('Failed to fetch voice tones');
            }
        } catch (err) {
            console.error('Error fetching voice tones:', err);
        }
    };

    useEffect(() => {
        void fetchTones();
    }, []);

    /** 新增之后刷新列表 */
    const handleAddSaved = () => {
        void fetchTones();
        setShowAdd(false);
    };
    /** 编辑之后刷新列表 */
    const handleEditSaved = () => {
        void fetchTones();
        setShowEdit(false);
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
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
                    aria-label="关闭"
                >
                    ×
                </button>

                {/* 左侧：音色列表 */}
                <VoiceToneSidebar
                    tones={tones}
                    selectedTone={selectedTone}
                    onSelect={setSelectedTone}
                    onAdd={() => setShowAdd(true)}
                />

                {/* 右侧：音色详情 */}
                <VoiceToneDetailPane
                    tone={selectedTone}
                    onEdit={t => {
                        setSelectedTone(t);
                        setShowEdit(true);
                    }}
                />

                {/* 新增弹窗 */}
                {showAdd && (
                    <AddVoiceToneModal
                        supplierId={supplierId}
                        onClose={() => setShowAdd(false)}
                        onSaved={handleAddSaved}
                    />
                )}

                {/* 编辑弹窗 */}
                {showEdit && selectedTone && (
                    <EditVoiceToneModal
                        tone={selectedTone}
                        onClose={() => setShowEdit(false)}
                        onSaved={handleEditSaved}
                    />
                )}
            </div>
        </div>
    );
}