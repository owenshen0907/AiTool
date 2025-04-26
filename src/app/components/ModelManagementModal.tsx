// app/components/ModelManagementModal.tsx
'use client';

import React, { MouseEvent, useMemo, useState, useEffect } from 'react';

// 掩码正则：保留末四位，其他置 '*'
const maskRegex = /.(?=.{8})/g;

export interface Model {
    id: string;
    name: string;
    url: string;
    apiKey: string;
    isDefault: boolean;
    supplier: 'StepFun' | 'OpenAI' | 'DeepSeek' | 'Zhipu' | 'Azure' | 'Other';
    modelType:
        | 'text'
        | 'vision'
        | 'asr'
        | 'tts'
        | 'streaming_asr'
        | 'streaming_tts'
        | 'real-time';
    notes?: string;
    // passedTest: boolean;
}

interface Props {
    onClose: () => void;
}

export default function ModelManagementModal({ onClose }: Props) {
    const stop = (e: MouseEvent) => e.stopPropagation();

    const [models, setModels] = useState<Model[]>([]);
    const [newModel, setNewModel] = useState<Omit<Model, 'id'>>({
        name: '',
        url: '',
        apiKey: '',
        isDefault: false,
        supplier: 'StepFun',
        modelType: 'text',
        notes: '',
        // passedTest: false,
    });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [loading, setLoading] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, boolean>>({});

    // 拉取列表
    const fetchModels = async () => {
        const res = await fetch('/api/models');
        if (res.ok) {
            const data: Model[] = await res.json();
            setModels(data);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    // 添加
    const handleAdd = async () => {
        if (!newModel.name.trim() || !newModel.url.trim()) return;
        setLoading(true);
        const res = await fetch('/api/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newModel),
        });
        if (res.ok) {
            setNewModel({
                name: '', url: '', apiKey: '', isDefault: false,
                supplier: 'StepFun', modelType: 'text', notes: '',
            });
            await fetchModels();
        }
        setLoading(false);
    };

    // 删除
    const handleDelete = async (id: string) => {
        setLoading(true);
        const res = await fetch(`/api/models?id=${id}`, { method: 'DELETE' });
        if (res.ok) await fetchModels();
        setLoading(false);
    };

    // 更新
    const handleUpdate = async (id: string, upd: Partial<Model>) => {
        setLoading(true);
        const res = await fetch('/api/models', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...upd }),
        });
        if (res.ok) await fetchModels();
        setLoading(false);
    };

    // 测试
    const testModel = async (m: Model) => {
        setTestingId(m.id);

        try {
            const res = await fetch(m.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${m.apiKey}`,
                },
                body: JSON.stringify({
                    model: m.name,
                    messages: [{ role: 'user', content: '请输出1到10的十个数字' }],
                }),
            });

            const ok = res.ok;
            // 先更新后端
            // await handleUpdate(m.id, { passedTest: ok });

            // 再在本地更新列表状态（乐观更新）
            // setModels((prev) =>
            //     prev.map((x) => (x.id === m.id ? { ...x, passedTest: ok } : x))
            // );
            setTestResults(prev => ({ ...prev, [m.id]: ok }));
        } catch {
            // await handleUpdate(m.id, { passedTest: false });
            setTestResults(prev => ({ ...prev, [m.id]: false }));
        } finally {
            setTestingId(null);
        }
    };

    // 过滤 & 分页
    const filtered = useMemo(
        () => models.filter((m) =>
            [m.name, m.supplier, m.notes ?? '']
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase()),
        ), [models, search],
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageModels = filtered.slice((page - 1) * pageSize, page * pageSize);

    // 掩码 API Key
    const maskKey = (k: string = '') => k.replace(maskRegex, '*');

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-xl p-6 flex flex-col"
                onClick={stop}
            >
                <h3 className="text-xl font-semibold mb-6">模型管理</h3>

                {/* 新增表单 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <input
                        value={newModel.name}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="模型名称"
                        className="border rounded px-3 py-2"
                    />
                    <input
                        value={newModel.url}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, url: e.target.value }))}
                        placeholder="模型地址"
                        className="border rounded px-3 py-2"
                    />
                    <input
                        value={newModel.apiKey}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="API Key"
                        className="border rounded px-3 py-2"
                    />
                    <select
                        value={newModel.supplier}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, supplier: e.target.value as any }))}
                        className="border rounded px-3 py-2"
                    >
                        {['StepFun', 'OpenAI', 'DeepSeek', 'Zhipu', 'Azure', 'Other'].map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <select
                        value={newModel.modelType}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, modelType: e.target.value as any }))}
                        className="border rounded px-3 py-2"
                    >
                        {['text', 'vision', 'asr', 'tts', 'streaming_asr', 'streaming_tts', 'real-time'].map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                    <input
                        value={newModel.notes}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="备注"
                        className="border rounded px-3 py-2"
                    />
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={newModel.isDefault}
                            onChange={(e) => setNewModel((prev) => ({ ...prev, isDefault: e.target.checked }))}
                            className="mr-2"
                        />
                        默认
                    </label>
                    <button
                        onClick={handleAdd}
                        disabled={loading}
                        className="col-span-1 sm:col-span-2 lg:col-span-3 bg-blue-600 text-white rounded py-2 disabled:opacity-50"
                    >
                        {loading ? '处理中…' : '添加模型'}
                    </button>
                </div>

                {/* 搜索 */}
                <div className="mb-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="搜索模型…"
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                {/* 模型列表 */}
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="px-2 py-1">操作</th>
                            <th className="px-2 py-1">默认</th>
                            <th className="px-2 py-1">名称</th>
                            <th className="px-2 py-1">供应商</th>
                            <th className="px-2 py-1">类型</th>
                            <th className="px-2 py-1">测试</th>
                            <th className="px-2 py-1">备注</th>
                            <th className="px-2 py-1">Key (掩码)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pageModels.map((m) => (
                            <tr key={m.id} className="border-b hover:bg-gray-50">
                                <td className="px-2 py-1 space-x-2 whitespace-nowrap">
                                    <button onClick={() => handleDelete(m.id)} className="text-red-500">删</button>
                                    <button onClick={() => testModel(m)} disabled={testingId === m.id} className="text-blue-600 disabled:opacity-50">{testingId === m.id ? '测试中…' : testResults[m.id] ? '重测' : '测试'}</button>
                                </td>
                                <td className="px-2 py-1">
                                    <input type="radio" checked={m.isDefault} onChange={() => handleUpdate(m.id, { isDefault: true })} />
                                </td>
                                <td className="px-2 py-1">{m.name}</td>
                                <td className="px-2 py-1">{m.supplier}</td>
                                <td className="px-2 py-1">{m.modelType}</td>
                                {/*<td className="px-2 py-1">{m.passedTest ? '✅' : '❌'}</td>*/}
                                <td className="px-2 py-1">
                                  {testResults[m.id] ? '✅' : '❌'}
                                </td>
                                <td className="px-2 py-1">{m.notes}</td>
                                <td className="px-2 py-1">{maskKey(m.apiKey)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span>共 {filtered.length} 条 | 第 {page} / {totalPages} 页</span>
                    <div className="space-x-2">
                        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-40">上一页</button>
                        <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-40">下一页</button>
                    </div>
                </div>

                {/* 关闭 */}
                <button onClick={onClose} className="mt-6 w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700">关闭</button>
            </div>
        </div>
    );
}