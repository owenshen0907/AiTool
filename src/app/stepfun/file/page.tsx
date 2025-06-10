'use client';

import React, { useState } from 'react';

interface FileItem {
    id: string;
    object: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    status: string;
}

export default function FilePage() {
    const [apiKey, setApiKey] = useState('');
    const [usage, setUsage] = useState('');  // 文件用途，可选
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteMode, setDeleteMode] = useState<'selected' | 'all' | null>(null);
    const [deleteProgress, setDeleteProgress] = useState({ total: 0, remaining: 0 });

    const totalPages = Math.ceil(files.length / itemsPerPage) || 1;
    const pageFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 搜索文件
    async function handleSearch() {
        if (!apiKey) return alert('请输入 API Key');
        // 构造查询参数：usage 可为空
        const params = new URLSearchParams();
        params.append('purpose', usage);
        const url = `https://api.stepfun.com/v1/files?${params.toString()}`;
        console.log('[Debug] Fetching files from', url);
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!res.ok) throw new Error(`请求失败：${res.status}`);
            const json = await res.json();
            setFiles(json.data || []);
            setSelectedIds(new Set());
            setCurrentPage(1);
        } catch (err) {
            console.error('[Error] 搜索文件失败', err);
            alert('搜索文件失败，请查看控制台日志');
        }
    }

    function toggleSelect(id: string) {
        setSelectedIds(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    }

    function openDelete(mode: 'selected' | 'all') {
        const count = mode === 'all' ? files.length : selectedIds.size;
        if (count === 0) return;
        setDeleteMode(mode);
        setDeleteProgress({ total: count, remaining: count });
        setShowDeleteModal(true);
    }

    async function confirmDelete() {
        const ids = deleteMode === 'all' ? files.map(f => f.id) : Array.from(selectedIds);
        for (const id of ids) {
            try {
                await fetch(`https://api.stepfun.com/v1/files/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
            } catch (e) {
                console.error('[Error] 删除失败', id, e);
            }
            setDeleteProgress(prev => ({ total: prev.total, remaining: prev.remaining - 1 }));
        }
        setFiles(prev => (deleteMode === 'all' ? [] : prev.filter(f => !selectedIds.has(f.id))));
        setSelectedIds(new Set());
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">文件管理</h1>

            {/* API Key & 文件用途 */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input
                    type="text"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="border rounded px-2 py-1 flex-1 min-w-[200px]"
                />
                <select
                    value={usage}
                    onChange={e => setUsage(e.target.value)}
                    className="border rounded px-2 py-1"
                >
                    <option value="">全部文件</option>
                    <option value="file-extract">chat推理</option>
                    <option value="retrieval-text">文本知识库</option>
                    <option value="retrieval-image">图片知识库</option>
                    <option value="storage">存储/理解功能</option>
                </select>
                <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-1 rounded">
                    搜索
                </button>
                <button
                    onClick={() => openDelete('selected')}
                    disabled={selectedIds.size === 0}
                    className="bg-red-500 text-white px-4 py-1 rounded disabled:opacity-50"
                >
                    删除已选
                </button>
                <button
                    onClick={() => openDelete('all')}
                    disabled={files.length === 0}
                    className="bg-red-700 text-white px-4 py-1 rounded disabled:opacity-50"
                >
                    删除全部
                </button>
            </div>

            {/* 每页条数 */}
            <div className="flex items-center gap-2 mb-2">
                <span>每页显示：</span>
                <select
                    value={itemsPerPage}
                    onChange={e => setItemsPerPage(Number(e.target.value))}
                    className="border rounded px-2 py-1"
                >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>

            {/* 文件表格 */}
            <div className="overflow-x-auto">
                <table className="min-w-full border">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border">
                            <input
                                type="checkbox"
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setSelectedIds(new Set(checked ? pageFiles.map(f => f.id) : []));
                                }}
                            />
                        </th>
                        <th className="p-2 border">ID</th>
                        <th className="p-2 border">文件名</th>
                        <th className="p-2 border">大小(bytes)</th>
                        <th className="p-2 border">创建时间</th>
                        <th className="p-2 border">用途</th>
                        <th className="p-2 border">状态</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pageFiles.map(file => (
                        <tr key={file.id} className="hover:bg-gray-50">
                            <td className="p-2 border text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(file.id)}
                                    onChange={() => toggleSelect(file.id)}
                                />
                            </td>
                            <td className="p-2 border text-sm">{file.id}</td>
                            <td className="p-2 border">{file.filename}</td>
                            <td className="p-2 border">{file.bytes}</td>
                            <td className="p-2 border">{new Date(file.created_at * 1000).toLocaleString()}</td>
                            <td className="p-2 border">{file.purpose}</td>
                            <td className="p-2 border">{file.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* 分页控制 */}
            <div className="flex justify-between items-center mt-3">
                <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >上一页</button>
                <span>第 {currentPage} / {totalPages} 页</span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >下一页</button>
            </div>

            {/* 删除确认弹框 */}
            {showDeleteModal && deleteMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-80">
                        <h2 className="text-lg font-medium mb-4">
                            确认删除 {deleteMode === 'all' ? files.length : deleteProgress.total} 个文件？
                        </h2>
                        {deleteProgress.remaining < deleteProgress.total && (
                            <p className="mb-4">剩余 {deleteProgress.remaining} 个</p>
                        )}
                        <div className="flex justify-end gap-2">
                            {deleteProgress.remaining === deleteProgress.total ? (
                                <>
                                    <button
                                        onClick={confirmDelete}
                                        className="bg-red-600 text-white px-3 py-1 rounded"
                                    >确定</button>
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-3 py-1 border rounded"
                                    >取消</button>
                                </>
                            ) : deleteProgress.remaining > 0 ? (
                                <p>删除中...</p>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded"
                                >完成</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}