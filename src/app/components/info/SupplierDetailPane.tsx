// File: src/app/components/SupplierDetailPane.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { Supplier, Model } from '@/lib/models/model';

interface DetailProps {
    supplier: Supplier | null;
    models: Model[];
    onEditSupplier: (s: Supplier) => void;
    onAddModel: () => void;
    onEditModel: (m: Model) => void;
}

type ModelType = Model['modelType'];
const TABS: Array<{ key: ModelType; title: string }> = [
    { key: 'chat', title: 'Chat 模型' },
    { key: 'audio', title: 'Audio 模型' },
    { key: 'image', title: 'Image 模型' },
    { key: 'video', title: 'Video 模型' },
    { key: 'other', title: 'Other 模型' },
];

export default function SupplierDetailPane({ supplier, models, onEditSupplier, onAddModel, onEditModel }: DetailProps) {
    const [activeTab, setActiveTab] = useState<ModelType>('chat');
    const [testModel, setTestModel] = useState<string>('');
    const [testing, setTesting] = useState(false);
    const [testPassed, setTestPassed] = useState<boolean | null>(null);

    // 用于联通性测试的 chat 模型列表
    const chatModels = models.filter(m => m.modelType === 'chat');

    // 初始或更新 chat 模型下拉
    useEffect(() => {
        if (chatModels.length > 0) {
            const def = chatModels.find(m => m.isDefault) || chatModels[0];
            setTestModel(def.name);
        } else {
            setTestModel('');
        }
        setTestPassed(null);
    }, [chatModels]);

    const maskKey = (key = ''): string => {
        if (key.length <= 8) return '*'.repeat(key.length);
        return `${key.slice(0,4)}*****${key.slice(-4)}`;
    };

    const handleTestConnectivity = async () => {
        if (!supplier || !testModel) return;
        setTesting(true);
        try {
            const res = await fetch(
                `${supplier.apiUrl}/chat/completions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${supplier.apiKey}`,
                    },
                    body: JSON.stringify({ model: testModel, stream: true, messages: [{ role: 'user', content: '测试连通性' }] }),
                }
            );
            if (res.ok) {
                setTestPassed(true);
                alert('联通性测试成功');
            } else {
                setTestPassed(false);
                alert('联通性测试失败');
            }
        } catch {
            setTestPassed(false);
            alert('联通性测试失败');
        } finally {
            setTesting(false);
        }
    };

    const renderTable = (items: Model[], type: ModelType) => {
        if (!items.length) return <div className="text-gray-500">暂无模型</div>;
        let cols: Array<{ label: string; value: (m: Model) => boolean }> = [];
        switch (type) {
            case 'chat': cols=[
                { label: '音频输入', value: m => m.supportsAudioInput },
                { label: '图片输入', value: m => m.supportsImageInput },
                { label: '视频输入', value: m => m.supportsVideoInput },
                { label: 'JSON 模式', value: m => m.supportsJsonMode },
                { label: 'Tool', value: m => m.supportsTool },
                { label: 'Web Search', value: m => m.supportsWebSearch },
                { label: '深度思考', value: m => m.supportsDeepThinking },
            ]; break;
            case 'audio': cols=[
                { label: '音频输入', value: m => m.supportsAudioInput },
                { label: '音频输出', value: m => m.supportsAudioOutput },
                { label: 'WebSocket 支持', value: m => m.supportsWebsocket },
            ]; break;
            case 'image': cols=[
                { label: '图片输出', value: m => m.supportsImageOutput },
            ]; break;
            case 'video': cols=[
                { label: '视频输出', value: m => m.supportsVideoOutput },
            ]; break;
            case 'other': cols=[
                { label: '音频输入', value: m => m.supportsAudioInput },
                { label: '图片输入', value: m => m.supportsImageInput },
                { label: '视频输入', value: m => m.supportsVideoInput },
                { label: '音频输出', value: m => m.supportsAudioOutput },
                { label: '图片输出', value: m => m.supportsImageOutput },
                { label: '视频输出', value: m => m.supportsVideoOutput },
                { label: 'JSON 模式', value: m => m.supportsJsonMode },
                { label: 'Tool', value: m => m.supportsTool },
                { label: 'Web Search', value: m => m.supportsWebSearch },
                { label: '深度思考', value: m => m.supportsDeepThinking },
                { label: 'WebSocket 支持', value: m => m.supportsWebsocket },
            ]; break;
        }
        return (
            <table className="w-full text-sm text-gray-700 table-auto border-collapse">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border px-2 py-1">名称</th>
                    {cols.map(c => <th key={c.label} className="border px-2 py-1 text-center">{c.label}</th>)}
                    <th className="border px-2 py-1 text-center">默认</th>
                    <th className="border px-2 py-1">操作</th>
                </tr>
                </thead>
                <tbody>
                {items.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">{m.name}</td>
                        {cols.map(c => <td key={c.label} className="border px-2 py-1 text-center">{c.value(m)?'✅':'❌'}</td>)}
                        <td className="border px-2 py-1 text-center">{m.isDefault?'✅':'❌'}</td>
                        <td className="border px-2 py-1 text-center"><button className="text-blue-600 hover:underline" onClick={()=>onEditModel(m)}>编辑</button></td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="flex-1 bg-white p-6 flex flex-col overflow-auto">
            {supplier ? (
                <>
                    <div className="mb-6">
                        <h4 className="text-2xl font-semibold mb-2">供应商信息</h4>
                        <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
                            <div><strong>名称：</strong>{supplier.name}</div>
                            <div><strong>简称：</strong>{supplier.abbreviation}</div>
                            <div><strong>API Key：</strong>{maskKey(supplier.apiKey)}</div>
                            <div><strong>地址：</strong>{supplier.apiUrl}</div>
                            <div><strong>WSS URL：</strong>{supplier.wssUrl||'-'}</div>
                        </div>
                        <button className="mt-2 text-sm text-blue-600 hover:underline" onClick={()=>onEditSupplier(supplier)}>编辑供应商</button>
                    </div>
                    <div className="mb-6">
                        <h4 className="text-xl font-semibold mb-2">联通性测试</h4>
                        <div className="flex items-center space-x-3">
                            <select
                                value={testModel}
                                onChange={e=>setTestModel(e.target.value)}
                                className="border rounded px-2 py-1"
                            >
                                {chatModels.length > 0 ? chatModels.map(m=><option key={m.id} value={m.name}>{m.name}</option>) : <option value="">无可用 Chat 模型</option>}
                            </select>
                            <button disabled={!testModel||testing} onClick={handleTestConnectivity} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">{testing?'测试中...':'测试联通'}</button>
                        </div>
                    </div>
                    <div className="flex space-x-4 border-b mb-4">
                        {TABS.map(tab=>(<button key={tab.key} onClick={()=>setActiveTab(tab.key)} className={`px-3 py-1 ${activeTab===tab.key?'border-b-2 border-blue-600 text-blue-600':'text-gray-600 hover:text-gray-800'}`}>{tab.title}</button>))}
                    </div>
                    <div className="flex-1 overflow-auto">{renderTable(models.filter(m=>m.modelType===activeTab), activeTab)}</div>
                    <div className="flex justify-end mt-4"><button onClick={onAddModel} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">新增模型</button></div>
                </>
            ) : (<div className="flex-1 flex items-center justify-center text-gray-400">请选择一个供应商查看详情</div>)}
        </div>
    );
}
