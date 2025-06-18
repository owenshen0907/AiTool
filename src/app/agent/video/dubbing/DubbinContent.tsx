'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import type { Supplier, Model } from '@/lib/models/model';
import { generateCSV, parseExcel } from '@/lib/utils/fileUtils';
import voices from './voices.json';

import DubbingHeader, { DubCase } from './DubbingHeader';
import DubbingTable                from './DubbingTable';

/* ---------- 存库 body ---------- */
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

/* ─────────────────────────────────────────── */
export default function DubbingContent({ selectedItem, onUpdateItem }: Props) {
    /* 页面级状态 -------------------------------------------------------- */
    const [supplierId, setSupplierId] = useState('');
    const [model,     setModel]       = useState('');
    const [voiceId,   setVoiceId]     = useState('');
    const [format,    setFormat]      = useState<'mp3'|'wav'|'flac'|'opus'>('mp3');
    const [speed,     setSpeed]       = useState(1.0);
    const [volume,    setVolume]      = useState(1.0);

    const [title,   setTitle]   = useState(selectedItem.title   || '');
    const [summary, setSummary] = useState(selectedItem.summary || '');
    const [isEditing, setIsEditing] = useState(false);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [models,    setModels]    = useState<Model[]>([]);
    const [cases,     setCases]     = useState<DubCase[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [remaining,   setRemaining]   = useState(0);
    const [concurrency, setConcurrency] = useState(1);
    const [dirty, setDirty] = useState(false);
    const [origBody, setOrigBody] = useState<DubbingBody>({ cases: [] });

    /* ① 拉供应商 ------------------------------------------------------- */
    useEffect(() => {
        fetch('/api/suppliers')
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: Supplier[]) => {
                setSuppliers(data);
                const def = data.find(s => s.isDefault) || data[0];
                if (def) {
                    setSupplierId(def.id);
                    const firstVoice = voices.find(v => v.supplierId === def.id);
                    setVoiceId(firstVoice?.voiceId || '');
                }
            });
    }, []);

    /* ② 拉模型 (依赖 supplierId) ---------------------------------------- */
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

    /* ③ 解析 body ------------------------------------------------------ */
    useEffect(() => {
        let body: DubbingBody = {};
        try { body = JSON.parse(selectedItem.body || '{}'); } catch {}
        setSupplierId(body.supplierId ?? supplierId);
        setModel      (body.model      ?? model);
        setFormat     ((body.responseFormat as any) ?? 'mp3');
        setSpeed      (body.speed  ?? 1.0);
        setVolume     (body.volume ?? 1.0);
        setCases(Array.isArray(body.cases) ? body.cases : []);
        setOrigBody(body);
        setSelectedIds([]);
        setRemaining(0);
        setTitle  (selectedItem.title   || '');
        setSummary(selectedItem.summary || '');
    }, [selectedItem.id]);

    /* ④ 监测修改 ------------------------------------------------------- */
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
            JSON.stringify(cases) !== JSON.stringify(b.cases || [])
        );
    }, [
        title, summary,
        supplierId, model, format, speed, volume,
        cases, origBody,
        selectedItem.title, selectedItem.summary,
    ]);

    /* ⑤ 行操作 --------------------------------------------------------- */
    const addCase    = () => setCases(p => [...p, { id:`case-${Date.now()}`, text:'' }]);
    const updateCase = (id:string, patch:Partial<DubCase>) => setCases(p => p.map(c => c.id===id?{...c,...patch}:c));
    const removeCase = (id:string) => setCases(p => p.filter(c => c.id!==id));

    /* ⑥ 导入/解析/导出 -------------------------------------------------- */
    const parseImportFile = async (f: File) : Promise<{id:string;text:string}[]> => {
        if (f.name.endsWith('.csv')) {
            const lines = (await f.text()).split(/\r?\n/).slice(2);
            return lines.filter(Boolean).map((t,i)=>({ id:`${Date.now()}-${i}`, text:t.trim() }));
        }
        const sheets = await parseExcel(f);
        const first  = sheets[Object.keys(sheets)[0]];
        return first
            .filter((r:any)=>(r['Case 文本']||'').trim())
            .map((r:any,i:number)=>({ id:`${Date.now()}-${i}`, text:r['Case 文本'].trim() }));
    };
    const importCases = (rows:{id:string;text:string}[]) =>
        setCases(p => [...p, ...rows.map(r => ({ id:r.id, text:r.text }))]);

    const exportTemplate = () =>
        generateCSV([['说明：编辑 Case 文本'],['Case 文本']],[], 'template.csv');
    const exportWithData = () =>
        generateCSV([['说明：编辑 Case 文本'],['Case 文本'], ...cases.map(c=>[c.text])],[], 'template_with_data.csv');

    /* ⑦ 保存 ----------------------------------------------------------- */
    const handleSave = async () => {
        if (!dirty) return;
        const fixedCases = cases.map(c => ({
            ...c,
            voiceId: c.voiceId?.trim() ? c.voiceId : voiceId,
        }));
        const body: DubbingBody = {
            supplierId, model,
            responseFormat: format,
            speed, volume,
            cases: fixedCases,
        };
        await onUpdateItem(selectedItem, {
            title,
            summary,
            body: JSON.stringify(body),
        });
        setOrigBody(body);
        setDirty(false);
        setIsEditing(false);
    };

    /* ⑧ 单条生成 ------------------------------------------------------- */
    const generateOne = async (c: DubCase) => {
        const sup = suppliers.find(s => s.id === supplierId);
        if (!sup) return;

        const usableVoice =
            c.voiceId?.trim() ? c.voiceId :
                voiceId.trim()   ? voiceId   :
                    voices.find(v => v.supplierId === supplierId)?.voiceId || '';

        if (!usableVoice) { alert('请先选择音色！'); return; }

        const url = `${sup.apiUrl.replace(/\/$/, '')}/audio/speech`;
        updateCase(c.id, { connectAt: Date.now() });

        const res = await fetch(url, {
            method:'POST',
            headers:{'Content-Type':'application/json', Authorization:`Bearer ${sup.apiKey}` },
            body: JSON.stringify({
                model,
                voice: usableVoice,
                input: c.text,
                response_format: c.responseFormat || format,
                speed: c.speed ?? speed,
                volume: c.volume ?? volume,
            }),
        });
        const blob = await res.blob();
        updateCase(c.id, { audioUrl: URL.createObjectURL(blob), doneAt: Date.now() });
    };

    /* ⑨ 批量并发 ------------------------------------------------------- */
    const batchGenerate = () => {
        const list = cases.filter(c => selectedIds.includes(c.id));
        setRemaining(list.length);
        let idx=0, running=0;
        const launch = () => {
            if (idx>=list.length && running===0) return;
            while (running<concurrency && idx<list.length) {
                const item=list[idx++]; running++;
                generateOne(item).finally(()=>{running--; setRemaining(r=>r-1); launch();});
            }
        };
        launch();
    };

    /* ⑩ 渲染 ----------------------------------------------------------- */
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
                supplierId        ={supplierId}
                model             ={model}
                voiceId           ={voiceId}
                responseFormat    ={format}
                speed             ={speed}
                volume            ={volume}
                dirty             ={dirty}
                onSupplierChange  ={id => {
                    setSupplierId(id);
                    const first = voices.find(v => v.supplierId===id);
                    setVoiceId(first?.voiceId||'');
                }}
                onModelChange     ={setModel}
                onVoiceChange     ={setVoiceId}
                onFormatChange    ={f=>setFormat(f as any)}
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