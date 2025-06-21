/* -------------------------------------------------------------------------- */
/*  DubbingContent.tsx                                                        */
/* -------------------------------------------------------------------------- */
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import type { Supplier, Model, VoiceTone } from '@/lib/models/model';
import { generateCSV, parseExcel } from '@/lib/utils/fileUtils';

import DubbingHeader, { DubCase as DubCaseBase } from './DubbingHeader';
import DubbingTable                               from './DubbingTable';

/* ---------- 行类型扩展 ---------- */
export interface DubCase extends DubCaseBase {
    audioFileId?: string | null;   // 文件表 ID
    audioFilePath?: string | null; // 文件在服务器的相对路径
}

/* ---------- 存库 JSON 结构 ---------- */
interface DubbingBody {
    supplierId?: string;
    model?: string;
    responseFormat?: string;
    speed?: number;
    volume?: number;
    cases?: DubCase[];
}

interface Props {
    selectedItem: ContentItem;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
}

/* ---------- 工具函数：上传 / 删除文件 ---------- */
async function uploadBlobToServer(
    blob: Blob,
    filename: string,
    formId: string,               // 绑定 ContentItem.id
) {
    const fd = new FormData();
    fd.append('module', 'dubbing');
    fd.append('form_id', formId);
    fd.append('file', new File([blob], filename, { type: blob.type || 'audio/mpeg' }));

    const res = await fetch('/api/files', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('上传文件失败');
    return res.json() as Promise<{ file_id: string; file_path: string; url: string }>;
}

async function deleteServerFile(fileId?: string | null) {
    if (!fileId) return;
    await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
    });
}

export default function DubbingContent({ selectedItem, onUpdateItem }: Props) {
    /* ───────── 供应商 / 模型 / 音色 ───────── */
    const [suppliers,  setSuppliers]  = useState<Supplier[]>([]);
    const [voiceTones, setVoiceTones] = useState<VoiceTone[]>([]);
    const [models,     setModels]     = useState<Model[]>([]);

    /* ───────── 全局参数（可编辑） ───────── */
    const [supplierId, setSupplierId] = useState('');
    const [model,      setModel]      = useState('');
    const [voiceId,    setVoiceId]    = useState('');
    const [format,     setFormat]     = useState<'mp3' | 'wav' | 'flac' | 'opus'>('mp3');
    const [speed,      setSpeed]      = useState(1.0);
    const [volume,     setVolume]     = useState(1.0);

    /* ───────── 标题 / 摘要 ───────── */
    const [title,   setTitle]   = useState(selectedItem.title   || '');
    const [summary, setSummary] = useState(selectedItem.summary || '');
    const [isEditing, setIsEditing] = useState(false);

    /* ───────── Case 行相关 ───────── */
    const [cases,       setCases]       = useState<DubCase[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [remaining,   setRemaining]   = useState(0);
    const [concurrency, setConcurrency] = useState(1);

    /* ───────── 修改检测 ───────── */
    const [dirty,    setDirty]    = useState(false);
    const [origBody, setOrigBody] = useState<DubbingBody>({ cases: [] });

    /* ① 只在首次渲染时拉取供应商 */
    useEffect(() => {
        fetch('/api/suppliers')
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: Supplier[]) => {
                setSuppliers(data);
                const def = data.find(s => s.isDefault) || data[0];
                if (def) setSupplierId(def.id);
            });
    }, []);

    /* ② 音色同样一次性拉取 */
    useEffect(() => {
        fetch('/api/suppliers/voice')
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: VoiceTone[]) => setVoiceTones(data));
    }, []);

    /* ③ 当 supplierId 变化时拉取对应模型 */
    useEffect(() => {
        if (!supplierId) return;
        fetch(`/api/suppliers/models?supplier_id=${supplierId}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: Model[]) => {
                const audio = data.filter(m => m.supportsAudioOutput);
                setModels(audio);
                const defM = audio.find(m => m.isDefault) || audio[0];
                if (defM) setModel(defM.name);
            });
    }, [supplierId]);

    /* ④ 当选中文档变化时，解析 body 初始化界面 */
    useEffect(() => {
        let body: DubbingBody = {};
        try { body = JSON.parse(selectedItem.body || '{}'); } catch {}

        setSupplierId(body.supplierId ?? supplierId);
        setModel     (body.model      ?? model);
        setFormat    ((body.responseFormat as any) ?? 'mp3');
        setSpeed     (body.speed  ?? 1.0);
        setVolume    (body.volume ?? 1.0);
        setCases(Array.isArray(body.cases) ? body.cases : []);
        setOrigBody(body);

        setSelectedIds([]);
        setRemaining(0);
        setTitle  (selectedItem.title   || '');
        setSummary(selectedItem.summary || '');
    }, [selectedItem.id]);

    /* ⑤ 检测是否有未保存修改 */
    useEffect(() => {
        const b = origBody;
        setDirty(
            title   !== selectedItem.title   ||
            summary !== selectedItem.summary ||
            supplierId !== b.supplierId      ||
            model      !== b.model           ||
            format     !== b.responseFormat  ||
            speed      !== (b.speed  ?? 1)   ||
            volume     !== (b.volume ?? 1)   ||
            JSON.stringify(cases) !== JSON.stringify(b.cases || []),
        );
    }, [title, summary, supplierId, model, format, speed, volume,
        cases, origBody, selectedItem.title, selectedItem.summary]);

    /* ⑥ 行操作函数 */
    const addCase    = () => setCases(p => [...p, { id: `case-${Date.now()}`, text: '' }]);
    const updateCase = (id: string, patch: Partial<DubCase>) =>
        setCases(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
    const removeCase = (id: string) => setCases(p => p.filter(c => c.id !== id));

    /* ⑦ 文件导入 / 导出 */
    const parseImportFile = async (f: File) => {
        if (f.name.endsWith('.csv')) {
            const lines = (await f.text()).split(/\r?\n/).slice(2);
            return lines.filter(Boolean).map((t, i) => ({ id: `${Date.now()}-${i}`, text: t.trim() }));
        }
        const sheets = await parseExcel(f);
        const first  = sheets[Object.keys(sheets)[0]];
        return first
            .filter((r: any) => (r['Case 文本'] || '').trim())
            .map((r: any, i: number) => ({ id: `${Date.now()}-${i}`, text: r['Case 文本'].trim() }));
    };
    const importCases     = (rows: any[]) => setCases(p => [...p, ...rows]);
    const exportTemplate  = () => generateCSV([['说明：编辑 Case 文本'], ['Case 文本']], [], 'template.csv');
    const exportWithData  = () => generateCSV([['说明：编辑 Case 文本'], ['Case 文本'], ...cases.map(c => [c.text])], [], 'template_with_data.csv');

    /* ⑧ 保存到后端 */
    const handleSave = async () => {
        if (!dirty) return;
        const fixed = cases.map(c => ({ ...c, voiceId: c.voiceId?.trim() ? c.voiceId : voiceId }));
        const body: DubbingBody = { supplierId, model, responseFormat: format, speed, volume, cases: fixed };
        await onUpdateItem(selectedItem, { title, summary, body: JSON.stringify(body) });
        setOrigBody(body);
        setDirty(false);
        setIsEditing(false);
    };

    /* ⑨ 生成单条音频：删除旧文件→生成 TTS→上传→更新行 */
    const generateOne = async (c: DubCase) => {
        const sup = suppliers.find(s => s.id === supplierId);
        if (!sup) return;

        // ① 删除旧文件
        await deleteServerFile(c.audioFileId);
        updateCase(c.id, { audioUrl: undefined, audioFileId: null, audioFilePath: null });

        // ② 选音色
        const usableVoice =
            c.voiceId?.trim() ? c.voiceId :
                voiceId.trim()    ? voiceId   :
                    (voiceTones.find(v => v.supplierId === supplierId)?.toneId || '');
        if (!usableVoice) { alert('请先选择音色！'); return; }

        // ③ 请求 TTS
        const ttsUrl = `${sup.apiUrl.replace(/\/$/, '')}/audio/speech`;
        updateCase(c.id, { connectAt: Date.now() });

        const ttsRes = await fetch(ttsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sup.apiKey}`,
            },
            body: JSON.stringify({
                model,
                voice: usableVoice,
                input: c.text,
                response_format: c.responseFormat || format,
                speed: c.speed ?? speed,
                volume: c.volume ?? volume,
            }),
        });

        if (!ttsRes.ok) {
            alert(`生成失败: ${ttsRes.status}`);
            updateCase(c.id, { doneAt: Date.now() });
            return;
        }
        const blob = await ttsRes.blob();

        // ④ 上传到文件服务
        const up = await uploadBlobToServer(blob, `${c.id}.${format}`, selectedItem.id);
        /* ⑤ 更新行（⚠️ audioUrl 自己拼） */
        const patchRow = {
            audioUrl: '/' + up.file_path,
            audioFileId: up.file_id,
            audioFilePath: up.file_path,
            doneAt: Date.now(),
        };
        updateCase(c.id, patchRow);
        /* ⑥ 再次写回 ContentItem（行内带新文件信息） */
        await onUpdateItem(selectedItem, {
            body: JSON.stringify({
                ...origBody,
                cases: cases.map(x => x.id === c.id ? { ...x, ...patchRow } : x),
            }),
        });
    };

    /* ⑩ 批量并发生成 */
    const batchGenerate = () => {
        const list = cases.filter(c => selectedIds.includes(c.id));
        setRemaining(list.length);

        let idx = 0;
        let running = 0;
        const launch = () => {
            if (idx >= list.length && running === 0) return; // 全部完成
            while (running < concurrency && idx < list.length) {
                const item = list[idx++];
                running++;
                generateOne(item).finally(() => {
                    running--;
                    setRemaining(r => r - 1);
                    launch();
                });
            }
        };
        launch();
    };

    /* ⑪ 渲染 */
    return (
        <div className="h-full flex flex-col">
            <DubbingHeader
                selectedItem      ={selectedItem}
                title             ={title}
                summary           ={summary}
                onTitleChange     ={setTitle}
                onSummaryChange   ={setSummary}
                suppliers         ={suppliers}
                models            ={models}
                voiceTones        ={voiceTones}
                supplierId        ={supplierId}
                model             ={model}
                voiceId           ={voiceId}
                responseFormat    ={format}
                speed             ={speed}
                volume            ={volume}
                dirty             ={dirty}
                onSupplierChange  ={setSupplierId}
                onModelChange     ={setModel}
                onVoiceChange     ={setVoiceId}
                onFormatChange    ={f => setFormat(f as any)}
                onSpeedChange     ={setSpeed}
                onVolumeChange    ={setVolume}
                onSave            ={handleSave}
                isEditing         ={isEditing}
                onToggleEdit      ={() => setIsEditing(e => !e)}
            />

            <DubbingTable
                cases                ={cases}
                selectedIds          ={selectedIds}
                remaining            ={remaining}
                batchConcurrency     ={concurrency}
                voiceTones           ={voiceTones}
                onImport             ={importCases}
                onAddCase            ={addCase}
                onBatchGenerate      ={batchGenerate}
                onConcurrencyChange  ={setConcurrency}
                onSelectIds          ={setSelectedIds}
                onUpdateCase         ={updateCase}
                onRemoveCase         ={removeCase}
                onGenerateCase       ={generateOne}
                globalVoiceId        ={voiceId}
                globalResponseFormat ={format}
                globalSpeed          ={speed}
                globalVolume         ={volume}
                globalSupplierId     ={supplierId}
                exportTemplate       ={exportTemplate}
                exportWithData       ={exportWithData}
                parseImportFile      ={parseImportFile}
            />
        </div>
    );
}