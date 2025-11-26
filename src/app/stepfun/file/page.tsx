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

const ERROR_HINTS: Record<number, string> = {
  400: [
    '原因：请求参数格式不正确，可能原因如下：',
    '1. 图片无法下载',
    '2. 图片数量超过限制',
    '3. 该模型不支持视频输入',
    '4. 模型不存在或无权限',
    '5. 参数值不合法',
    '解决方案：请参照文档正确传递参数信息',
  ].join('\n'),
  401: '原因：认证无效\n解决方案：确保使用正确的 API 密钥',
  402: '原因：余额不足\n解决方案：确保账户里面有足够余额',
  404: '原因：请求路径不正确\n解决方案：请参照文档修复请求路径信息',
  429: '原因：请求的资源超限，可能原因是你发送请求太快，超过了速率限制\n解决方案：请稍候重试您的请求',
  451: '原因：请求内容或者响应内容未审核通过\n解决方案：修改请求信息后再重试',
  500: '原因：我们服务器上的问题\n解决方案：稍等片刻后重试请求，如果问题仍然存在，请联系我们',
  503: '原因：目前服务器负载过高\n解决方案：请稍候重试您的请求',
};

export default function FilePage() {
  const [apiKey, setApiKey] = useState(''); // 用户输入的 API Key（开发者工具场景）
  const [usage, setUsage] = useState(''); // 文件用途筛选，可为空
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'selected' | 'all' | null>(null);
  const [deleteProgress, setDeleteProgress] = useState({ total: 0, remaining: 0 });
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(files.length / itemsPerPage) || 1;
  const pageFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  async function handleSearch() {
    if (!apiKey) return alert('请输入 API Key');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (usage) params.set('purpose', usage); // 仅在有值时附加

      const res = await fetch(`/api/stepfun/files?${params.toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const hint = ERROR_HINTS[res.status];
        const msg = hint ? `请求失败（${res.status}）\n${hint}` : `请求失败：${res.status}`;
        alert(msg);
        return;
      }
      const json = await res.json();
      setFiles(Array.isArray(json.data) ? json.data : []);
      setSelectedIds(new Set());
      setCurrentPage(1);
    } catch (err) {
      console.error('[Error] 搜索文件失败', err);
      alert('搜索文件失败，请查看控制台日志');
    } finally {
      setLoading(false);
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
        const r = await fetch('/api/stepfun/files', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ id }),
        });
        if (!r.ok) console.error('[Error] 删除失败', id, r.status);
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
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-semibold">文件管理</h1>
        <a
            href="https://owenshen.top/upload/stepfun%E6%96%87%E4%BB%B6%E5%88%A0%E9%99%A4%E7%AE%A1%E7%90%86.mp4"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 underline text-sm"
        >
          操作指引
        </a>
      </div>

      {/* 顶部控制区 */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          className="border rounded px-2 py-1 flex-1 min-w-[260px]"
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
        <button
          onClick={handleSearch}
          disabled={loading || !apiKey}
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
        >
          {loading ? '搜索中…' : '搜索'}
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
                <td className="p-2 border text-sm break-all">{file.id}</td>
                <td className="p-2 border break-all">{file.filename}</td>
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
