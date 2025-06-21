/* AddVoiceToneModal.tsx */
// File: src/app/components/AddVoiceToneModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { VoiceTone } from '@/lib/models/model';

interface Props {
    supplierId: string;
    /** 编辑时传入现有音色，否则为新增 */
    tone?: VoiceTone | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function AddVoiceToneModal({ supplierId, tone = null, onClose, onSaved }: Props) {
    const isEdit = Boolean(tone);
    const [toneId, setToneId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [sampleAudioPath, setSampleAudioPath] = useState<string | null>(null);
    const [fileRecord, setFileRecord] = useState<{ id: string; url: string } | null>(null);
    const [voiceId, setVoiceId] = useState<string | null>(null);

    useEffect(() => {
        if (tone) {
            setToneId(tone.toneId);
            setName(tone.name);
            setDescription(tone.description || '');
            setSampleAudioPath(tone.sampleAudioPath || null);
            if (tone.previewAudioFileId && tone.sampleAudioPath) {
                setFileRecord({ id: tone.previewAudioFileId, url: tone.sampleAudioPath });
            } else {
                setFileRecord(null);
            }
            setVoiceId(tone.id);
        }
    }, [tone]);

    const validateFields = () => {
        if (!toneId.trim() || !name.trim()) {
            alert('请先填写音色 ID 和名称');
            return false;
        }
        return true;
    };

    // 上传文件并自动保存关联（不关闭弹窗）
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!validateFields()) return;
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !['mp3', 'wav'].includes(ext)) {
            alert('只支持 mp3 或 wav 格式');
            return;
        }

        // 上传到 files 服务
        const formData = new FormData();
        formData.append('module', 'VoiceTone');
        formData.append('file', file);

        const resFile = await fetch('/api/files', { method: 'POST', body: formData });
        if (!resFile.ok) {
            alert('文件上传失败');
            return;
        }
        const data = (await resFile.json()) as { file_id: string; file_path: string };
        const url = `/${data.file_path}`;

        setFileRecord({ id: data.file_id, url });
        setSampleAudioPath(url);

        // 同步到音色表
        const payload: any = {
            supplier_id: supplierId,
            tone_id: toneId,
            name,
            description,
            sample_audio_path: url,
            preview_audio_file_id: data.file_id,
        };
        let method = 'POST';
        if (voiceId) {
            method = 'PATCH';
            payload.id = voiceId;
        }
        const resTone = await fetch('/api/suppliers/voice', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!resTone.ok) {
            alert('保存音色失败');
            return;
        }
        const toneData = (await resTone.json()) as VoiceTone;
        setVoiceId(toneData.id);
    };

    // 删除文件并清空关联（不关闭弹窗）
    const handleDeleteAudio = async () => {
        if (!fileRecord || !voiceId) return;
        const resDel = await fetch('/api/files', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_id: fileRecord.id }),
        });
        if (!resDel.ok) {
            alert('删除失败');
            return;
        }

        setFileRecord(null);
        setSampleAudioPath(null);

        await fetch('/api/suppliers/voice', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: voiceId,
                sample_audio_path: null,
                preview_audio_file_id: null,
            }),
        });
    };

    // 点击保存：最后一次保存所有字段并关闭弹窗
    const handleSave = async () => {
        if (!validateFields()) return;
        const payload: any = {
            supplier_id: supplierId,
            tone_id: toneId,
            name,
            description,
        };
        let method = 'POST';
        if (voiceId) {
            method = 'PATCH';
            payload.id = voiceId;
            payload.sample_audio_path = sampleAudioPath;
            payload.preview_audio_file_id = fileRecord?.id || null;
        } else if (sampleAudioPath && fileRecord) {
            payload.sample_audio_path = sampleAudioPath;
            payload.preview_audio_file_id = fileRecord.id;
        }
        const res = await fetch('/api/suppliers/voice', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            onSaved();
            onClose();
        } else {
            alert('保存失败');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-96" onClick={e => e.stopPropagation()}>
                <h4 className="text-lg font-semibold mb-4">{isEdit ? '编辑' : '新增'}音色</h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm">音色 ID</label>
                        <input
                            value={toneId}
                            onChange={e => setToneId(e.target.value)}
                            className="w-full border px-2 py-1 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm">名称</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full border px-2 py-1 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm">描述</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full border px-2 py-1 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm">试听音频</label>
                        {sampleAudioPath && (
                            <div className="flex items-center space-x-2 mb-2">
                                <audio controls src={sampleAudioPath} />
                                <button
                                    onClick={handleDeleteAudio}
                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                >删除</button>
                            </div>
                        )}
                        <input
                            type="file"
                            accept=".mp3,.wav"
                            onChange={handleFileChange}
                            className="w-full"
                        />
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