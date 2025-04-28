// app/components/SupplierModelManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AddSupplierModal from './AddSupplierModal';
import AddModelModal from './AddModelModal';
import EditModelModal from './EditModelModal';
import type { Supplier, Model } from '@/lib/models/model';

interface Props {
  onClose: () => void;
}

export default function SupplierModelManagement({ onClose }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [showEditModel, setShowEditModel] = useState(false);

  // Connectivity test state
  const [chatModels, setChatModels] = useState<Model[]>([]);
  const [testModel, setTestModel] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);

  const maskKey = (key = ''): string => {
    if (key.length <= 8) return key.replace(/./g, '*');
    return `${key.slice(0,4)}*****${key.slice(-4)}`;
  };

  const fetchSuppliers = async () => {
    const res = await fetch('/api/suppliers');
    if (res.ok) setSuppliers(await res.json());
  };

  const fetchModels = async (supplierId: string) => {
    const res = await fetch(`/api/models?supplier_id=${supplierId}`);
    if (res.ok) {
      const data = await res.json();
      setModels(data);
      // filter chat models for connectivity test
      setChatModels(data.filter((m: Model) => m.modelType === 'chat'));
      // reset test state
      setTestModel('');
      setTestPassed(null);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);
  useEffect(() => {
    if (selectedSupplier) fetchModels(selectedSupplier.id);
    else setModels([]);
  }, [selectedSupplier]);

  const handleTestConnectivity = async () => {
    if (!selectedSupplier || !testModel) return;
    setTesting(true);
    setTestPassed(null);
    try {
      const res = await fetch(
        `${selectedSupplier.apiUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${selectedSupplier.apiKey}`,
          },
          body: JSON.stringify({
            model: testModel,
            stream: true,
            messages: [{ role: 'user', content: '测试下联通性' }],
          }),
        }
      );
      setTestPassed(res.status === 200);
    } catch {
      setTestPassed(false);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex"
        onClick={e => e.stopPropagation()}
      >
        {/* 左侧：供应商列表 */}
        <div className="w-1/4 bg-white p-6 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-700">供应商列表</h4>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition"
              onClick={() => setShowAddSupplier(true)}
            >新增</button>
          </div>
          <input
            type="text"
            placeholder="搜索供应商..."
            className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <ul className="space-y-2">
            {suppliers.map(s => (
              <li
                key={s.id}
                className={`px-4 py-2 rounded-lg cursor-pointer transition
${selectedSupplier?.id === s.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                onClick={() => setSelectedSupplier(s)}
              >{s.name}</li>
            ))}
          </ul>
        </div>

        {/* 右侧：详情与模型 */}
        <div className="flex-1 bg-white p-8 flex flex-col">
          {selectedSupplier ? (
            <>
              {/* 供应商信息 */}
              <section className="mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-3">供应商信息</h4>
                <div className="grid grid-cols-2 gap-6 text-gray-600 text-sm">
                  <div><span className="font-medium">名称：</span>{selectedSupplier.name}</div>
                  <div><span className="font-medium">简称：</span>{selectedSupplier.abbreviation}</div>
                  <div><span className="font-medium">API Key：</span>{maskKey(selectedSupplier.apiKey)}</div>
                  <div><span className="font-medium">地址：</span>{selectedSupplier.apiUrl}</div>
                </div>
              </section>

              {/* 联通性测试 */}
              <section className="mb-6">
                <h4 className="text-xl font-semibold text-gray-700 mb-2">联通性测试</h4>
                <div className="flex items-center space-x-4">
                  <select
                    value={testModel}
                    onChange={e => setTestModel(e.target.value)}
                    className="border rounded px-3 py-2"
                  >
                    <option value="">选择 chat 模型</option>
                    {chatModels.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    disabled={!testModel || testing}
                    onClick={handleTestConnectivity}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >{testing ? '测试中...' : '测试联通'}</button>
                  {testPassed !== null && (
                    <span className={`text-lg ${testPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {testPassed ? '✔️ 成功' : '❌ 失败'}
                    </span>
                  )}
                </div>
              </section>

              {/* 模型列表 */}
              <section className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-700">模型列表</h4>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg transition"
                    onClick={() => setShowAddModel(true)}
                  >新增模型</button>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full table-auto text-sm text-gray-700">
                    <thead><tr className="bg-gray-100">
                      {['名称','类型','图','视','音','JSON','Tool','Web','深度','操作'].map(col => (
                        <th key={col} className="px-4 py-2 font-medium">{col}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y">
                      {models.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-2">{m.name}</td>
                          <td className="px-4 py-2">{m.modelType}</td>
                          <td className="px-4 py-2 text-center">{m.supportsImageInput ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-center">{m.supportsVideoInput ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-center">{m.supportsAudioOutput ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-center">{m.supportsJsonMode ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-center">{m.supportsTool ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-center">{m.supportsWebSearch ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-center">{m.supportsDeepThinking ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => { setEditingModel(m); setShowEditModel(true); }}
                            >编辑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">请选择一个供应商查看详情</div>
          )}
        </div>

        {/* 弹框：新增/编辑 */}
        {showAddSupplier && <AddSupplierModal onClose={() => { setShowAddSupplier(false); fetchSuppliers(); }} />}
        {showAddModel && selectedSupplier && <AddModelModal supplierId={selectedSupplier.id} onClose={() => { setShowAddModel(false); fetchModels(selectedSupplier.id); }} />}
        {showEditModel && editingModel && <EditModelModal model={editingModel} onClose={() => setShowEditModel(false)} onSaved={() => { setShowEditModel(false); fetchModels(selectedSupplier!.id); }} />}
      </div>
    </div>
  );
}