// File: src/app/agent/image/ContentRight.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ContentItem } from '@/lib/models/content';
import type { Template      } from './right/TemplateSelectorModal';
import type { ImageEntry    } from './types';

import GenerateSection      from './right/GenerateSection';
import ImageUploader        from './right/ImageUploader';
import CacheBar             from './right/CacheBar';
import ConfirmOverrideModal from './right/ConfirmOverrideModal';

import { useAgentScenes }     from 'src/hooks/useAgentScenes';
import { useIntentExtraction, type IntentItem  } from './right/hooks/useIntentExtraction';
import { extractIntentsBlock, upsertIntentsBlock } from './utils/mdIntents';

const CACHE_KEY        = 'optimize_previews';
const MAX_CACHE        = 10;
const SCENE_PROMPT_GEN = 'img_prompt_generate';

/* ---------- 本地缓存项 ---------- */
interface CacheItem {
    id: string;
    key: string;
    title: string;
    suggestion: string;
    content: string;
}

interface Props {
    feature:                   string;
    formId:                    string;
    selectedItem:              ContentItem | null;
    existingBody:              string;
    onChangeBody:              (body: string) => void;
    onUpdateItem:              (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>; // 透传给 CardView
    onPromptGeneratingChange?: (f: boolean) => void;
}

function parseIntentsBlock(markdown: string): IntentItem[] | null {
    const m = markdown.match(
        /<!--\s*INTENTS START\s*-->\s*```json\s*([\s\S]*?)\s*```[\s\S]*?<!--\s*INTENTS END\s*-->/,
    );
    if (!m) return null;
    try {
        const arr: any[] = JSON.parse(m[1].trim());
        return arr.map((i) => ({
            id: i.id || i.category_subtype || 'UNKNOWN',
            title: i.title || i.id || '未命名意图',
            jlpt_level: i.jlpt_level,
            category_level1: i.category_level1,
            category_subtype: i.category_subtype,
            core_explanation: i.core_explanation,
        }));
    } catch {
        console.warn('INTENTS JSON 解析失败');
        return null;
    }
}

/* =================================================================== */
export default function ContentRight({
                                         feature,
                                         formId,
                                         selectedItem,
                                         existingBody,
                                         onChangeBody,
                                         onUpdateItem,
                                         onPromptGeneratingChange
                                     }: Props) {
    /* ---------- 基础 state ---------- */
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [noteRequest, setNoteRequest]           = useState('');
    const [forceBase64, setForceBase64]           = useState(false);
    const [images, setImages]                     = useState<ImageEntry[]>([]);

    /* ---------- 意图抽取 ---------- */
    const {
        loading: intentsLoading,
        intents,
        setIntents,
        selectedIntentId,
        setSelectedIntentId,
        extract
    } = useIntentExtraction();

    /* ---------- 本地生成记录 ---------- */
    const [generatedIntentMap, setGeneratedIntentMap] = useState<
        Record<string, { lastContent: string; updatedAt: string; count: number }>
    >({});
    const [generateLoading,      setGenerateLoading]      = useState(false);
    const [lastGeneratedIntentId, setLastGeneratedIntentId] = useState<string | null>(null);

    /* ---------- 覆盖确认 ---------- */
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [extraNote,        setExtraNote]        = useState('');

    /* ---------- 浏览器缓存 ---------- */
    const [cacheList, setCacheList] = useState<CacheItem[]>([]);

    /* ---------- 场景 ---------- */
    const { scenes, loading: loadingConfig, getScene } = useAgentScenes(feature);

    /* ================================================================ */
    /* 1. 加载历史图片（保持不变） */
    useEffect(() => {
        if (!formId) { setImages([]); return; }
        (async () => {
            try {
                const res = await fetch(`/api/files?form_id=${formId}`);
                if (!res.ok) throw new Error('接口错误');
                const files: Array<{ file_id: string; file_path: string; created_at: string }> = await res.json();
                files.sort((a,b)=>+new Date(a.created_at)-+new Date(b.created_at));
                setImages(files.map(f=>({
                    id:f.file_id, url:`${location.origin}/${f.file_path}`,
                    status:'success' as const, file_id:f.file_id
                })));
            } catch (e) { console.error('加载历史图片失败:', e); }
        })();
    },[formId]);

    /* 2. 本地 cache 加载 */
    useEffect(()=>{
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return;
        try {
            const list:CacheItem[] = JSON.parse(raw);
            setCacheList(list.map(i=>({...i,title:i.title||i.suggestion})));
        } catch {/* empty */}
    },[]);
    // ② 回显 useEffect
    useEffect(() => {
        if (intents.length > 0) return;           // 已经有了 → 不覆盖
        const parsed = parseIntentsBlock(existingBody);
        if (parsed?.length) {
            setIntents(parsed);
            setSelectedIntentId(parsed[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingBody, selectedItem?.id]);

    const saveCache = (list:CacheItem[])=>{
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        setCacheList(list);
    };

    const upsertCache = (title:string, content:string)=>{
        if (!selectedItem) return;
        const key = selectedItem.id;
        const idx = cacheList.findIndex(i=>i.key===key && i.suggestion===noteRequest);
        if (idx>=0){
            const next=[...cacheList];
            next[idx]={...next[idx],title,content};
            saveCache(next);
        } else {
            const item:CacheItem={id:Date.now().toString(),key,title,suggestion:noteRequest,content};
            const same  = cacheList.filter(i=>i.key===key);
            const other = cacheList.filter(i=>i.key!==key);
            saveCache([...other,item,...same].slice(0,MAX_CACHE));
        }
    };

    const filteredCache = useMemo(
        ()=> selectedItem ? cacheList.filter(i=>i.key===selectedItem.id) : [],
        [cacheList, selectedItem]
    );

    const hasContent = Boolean(existingBody.trim());

    /* ================================================================ */
    /** —— 只提取意图，不保存 —— */
    /** 抽取意图 —— 提取完后直接写入 body 并保存 */
    const handleExtractIntents = async () => {
        try {
            const intentItems: IntentItem[] = await extract({
                template: selectedTemplate,
                noteRequest,
                images,
                scenes,
                forceBase64
            });

            if (!selectedItem || intentItems.length === 0) return;

            // ① 拼 Markdown 区块
            const intentBlock =
                '\n\n<!-- INTENTS START -->\n```json\n' +
                JSON.stringify(intentItems, null, 2) +
                '\n```\n<!-- INTENTS END -->\n';

            // ② 更新正文
            // const newBody = existingBody + intentBlock;
            const newBody = upsertIntentsBlock(existingBody, intentBlock);
            onChangeBody(newBody);

            // ③ 立即持久化
            await onUpdateItem(selectedItem, { body: newBody });
            console.debug('✅ 意图已保存到 DB');
        } catch (err: any) {
            console.error(err);
            alert(err.message || '意图抽取失败');
        }
    };

    /* -- 生成插画提示（左侧自动保存） -- */
    const requestGenerate = () => {
        if (!selectedIntentId) { alert('请选择意图'); return; }
        if (hasContent && lastGeneratedIntentId === selectedIntentId) {
            setExtraNote(''); setShowConfirmModal(true); return;
        }
        handleGenerate();
    };

    /** helper：调用 API → 返回完整内容 */
    const callModel = async (prompt: any[], apiUrl:string, apiKey:string, modelName:string) => {
        const res = await fetch(`${apiUrl}/chat/completions`,{
            method:'POST',
            headers:{'Content-Type':'application/json', Authorization:`Bearer ${apiKey}`},
            body:JSON.stringify({ model:modelName, stream:true, messages:prompt })
        });
        if (!res.ok || !res.body) throw new Error('生成接口调用失败');
        const reader = res.body.getReader(); const dec = new TextDecoder();
        let buf=''; let full='';
        while(true){
            const {value,done}=await reader.read(); if(done) break;
            buf += dec.decode(value,{stream:true});
            const lines = buf.split('\n'); buf = lines.pop()!;
            for(const l of lines){
                if(!l.startsWith('data:')) continue;
                const js = l.replace(/^data:\s*/,'').trim();
                if(js==='[DONE]'){ reader.cancel(); break; }
                let p:any; try{ p=JSON.parse(js);}catch{continue;}
                const delta = p.choices?.[0]?.delta?.content ?? p.choices?.[0]?.message?.content;
                if(delta) full += delta;
            }
        }
        return full.trim();
    };

    const handleGenerate = async (extra?:string) => {
        onPromptGeneratingChange?.(true);

        const scene = getScene(SCENE_PROMPT_GEN);
        if (!scene || !selectedTemplate?.prompts?.image_prompt || !selectedIntentId) {
            alert('生成前置条件缺失'); onPromptGeneratingChange?.(false); return;
        }
        const chosen = intents.find(i=>i.id===selectedIntentId);
        if (!chosen){ alert('意图不存在'); onPromptGeneratingChange?.(false); return; }

        setGenerateLoading(true);
        try{
            const { apiUrl, apiKey } = scene.supplier;
            const modelName          = scene.model.name;
            const prev               = generatedIntentMap[chosen.id];

            const userTxt =
                `【选中意图】\nID:${chosen.id}\n标题:${chosen.title}\n`+
                (chosen.jlpt_level? `JLPT:${chosen.jlpt_level}\n`:'') +
                (chosen.core_explanation?`说明:${chosen.core_explanation}\n`:'') +
                (extra?.trim()?`\n【补充说明】\n${extra.trim()}`:'');

            const prompt:any[]=[
                { role:'system', content:selectedTemplate.prompts.image_prompt },
                ...(prev?.lastContent ? [{role:'assistant',content:prev.lastContent}] : []),
                { role:'user', content:[{type:'text',text:userTxt}] }
            ];

            const full = await callModel(prompt, apiUrl, apiKey, modelName);
            if (full){
                // onChangeBody(full);                 // 左侧监听到变化→自动保存
                const intentsBlk = extractIntentsBlock(existingBody) ?? '';
                onChangeBody(full + '\n\n' + intentsBlk);
                upsertCache(chosen.title || '(意图生成)', full);
                setLastGeneratedIntentId(chosen.id);
                setGeneratedIntentMap(prev=>({
                    ...prev,
                    [chosen.id]:{
                        lastContent: full,
                        updatedAt:   new Date().toISOString(),
                        count:       (prev[chosen.id]?.count||0)+1
                    }
                }));
            }
        }catch(e:any){
            console.error(e);
            alert(e.message || '生成失败');
        }finally{
            setGenerateLoading(false);
            onPromptGeneratingChange?.(false);
        }
    };

    const confirmOverride = () => { setShowConfirmModal(false); handleGenerate(extraNote); };
    const cancelOverride  = () => { setShowConfirmModal(false); setExtraNote(''); };

    /* ==================== 渲染 ==================== */
    return (
        <div className="w-1/3 h-full border-l p-4 flex flex-col relative">
            <GenerateSection
                feature={feature}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                noteRequest={noteRequest}
                setNoteRequest={setNoteRequest}
                forceBase64={forceBase64}
                setForceBase64={setForceBase64}
                imagesCount={images.length}
                loadingConfig={loadingConfig}
                loadingIntent={intentsLoading}
                onExtractIntent={handleExtractIntents}
                intents={intents}
                selectedIntentId={selectedIntentId}
                setSelectedIntentId={id=>setSelectedIntentId(id)}
                generatedIntentMap={generatedIntentMap}
                loadingGenerate={generateLoading}
                onGenerate={requestGenerate}
            />

            <CacheBar
                items={filteredCache}
                onClick={item=>{
                    setNoteRequest(item.suggestion);
                    onChangeBody(item.content);
                }}
                onRemove={id=> saveCache(cacheList.filter(i=>i.id!==id))}
            />

            <div className="flex-1 overflow-auto mt-2">
                <ImageUploader
                    feature={feature}
                    formId={formId}
                    images={images}
                    setImages={setImages}
                />
            </div>

            <ConfirmOverrideModal
                open={showConfirmModal}
                onCancel={cancelOverride}
                onConfirm={confirmOverride}
                extraNote={extraNote}
                onChangeExtraNote={setExtraNote}
                intentTitle={intents.find(i=>i.id===selectedIntentId)?.title}
            />
        </div>
    );
}