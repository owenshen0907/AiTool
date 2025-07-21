'use client';
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAgentConfig } from './useAgentConfig';
import { useSupplierModels } from './useSupplierModels'; // 若没有请参考你之前的实现
import SceneModelPicker from './SceneModelPicker';

interface Props {
    onClose: () => void;
}

export default function AgentManagement({ onClose }: Props) {
    const {
        agentMetas,
        useAgent,
        ensureLoaded,
        updateSupplier,
        updateModel,
        saveAgent,
        syncModelIds
    } = useAgentConfig();

    const [currentAgentId, setCurrentAgentId] = useState(
        agentMetas[0]?.agentId || ''
    );

    const {
        suppliers,
        suppliersLoading,
        suppliersError,
        modelsCache,
        modelLoadingIds,
        modelErrors,
        loadModelsFor
    } = useSupplierModels(true);

    // 当切换 agent 时如果没有加载则拉取
    useEffect(() => {
        if (currentAgentId) ensureLoaded(currentAgentId);
    }, [currentAgentId, ensureLoaded]);

    const currentCfg = useAgent(currentAgentId);
    const currentMeta = agentMetas.find(a => a.agentId === currentAgentId);

    const handleLoadModels = async (supplierId: string) => {
        await loadModelsFor(supplierId);
        const models = modelsCache[supplierId];
        if (models) {
            syncModelIds(supplierId, models.map(m => ({ id: m.id, name: m.name })), currentAgentId);
        }
    };

    const handleSave = async () => {
        if (!currentAgentId) return;
        try {
            await saveAgent(currentAgentId, { prune: true });
        } catch (e) {
            // 错误已在 hook 内部状态标记，可选 toast
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
            <div className="bg-white w-[940px] h-[600px] rounded shadow flex flex-col">
                {/* Header */}
                <div className="h-12 flex items-center justify-between border-b px-4">
                    <span className="font-semibold">Agent 管理</span>
                    <button
                        className="p-1 rounded hover:bg-gray-100"
                        onClick={onClose}
                        aria-label="关闭"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* 左侧 agent 列表 */}
                    <div className="w-56 border-r bg-gray-50 overflow-auto">
                        <div className="p-2 text-xs font-medium text-gray-600">
                            Agents
                        </div>
                        <ul>
                            {agentMetas.map(a => {
                                const active = a.agentId === currentAgentId;
                                return (
                                    <li
                                        key={a.agentId}
                                        onClick={() => setCurrentAgentId(a.agentId)}
                                        className={`px-3 py-2 cursor-pointer text-sm hover:bg-white truncate ${
                                            active
                                                ? 'bg-white font-semibold border-l-4 border-blue-500'
                                                : ''
                                        }`}
                                    >
                                        {a.name}
                                        <div className="text-[11px] text-gray-400">
                                            {a.agentId}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* 右侧内容 */}
                    <div className="flex-1 p-4 overflow-auto">
                        {!currentMeta && (
                            <div className="text-sm text-gray-500">未找到 Agent 元数据。</div>
                        )}
                        {currentMeta && (
                            <>
                                <h2 className="text-lg font-semibold mb-1">
                                    {currentMeta.name}
                                </h2>
                                <p className="text-xs text-gray-500 mb-4">
                                    {currentMeta.description}
                                </p>

                                {!currentCfg || currentCfg.loading ? (
                                    <div className="text-sm text-gray-500">加载中...</div>
                                ) : (
                                    <>
                                        {currentCfg.error && (
                                            <div className="text-xs text-red-500 mb-2">
                                                加载错误：{currentCfg.error}
                                            </div>
                                        )}

                                        <table className="w-full text-sm border">
                                            <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-left w-40">场景</th>
                                                <th className="p-2 text-left">描述</th>
                                                <th className="p-2 w-72">供应商 & 模型</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {currentMeta.scenes.map(scene => {
                                                const row = currentCfg.scenes.find(
                                                    s => s.sceneKey === scene.sceneKey
                                                );
                                                if (!row) return null;
                                                const supplierId = row.supplierId || '';
                                                const models = supplierId
                                                    ? modelsCache[supplierId]
                                                    : undefined;
                                                const modelLoading = modelLoadingIds.has(supplierId);
                                                const modelError = modelErrors[supplierId] || null;

                                                return (
                                                    <tr key={scene.sceneKey} className="border-t align-top">
                                                        <td className="p-2 font-medium">
                                                            {scene.label}
                                                        </td>
                                                        <td className="p-2 text-gray-500">
                                                            {scene.desc}
                                                        </td>
                                                        <td className="p-2">
                                                            <SceneModelPicker
                                                                supplierId={row.supplierId}
                                                                modelName={row.modelName}
                                                                suppliers={suppliers}
                                                                supplierLoading={suppliersLoading}
                                                                supplierError={suppliersError}
                                                                models={models}
                                                                modelLoading={modelLoading}
                                                                modelError={modelError}
                                                                onSupplierChange={sid => {
                                                                    updateSupplier(currentCfg.agentId, scene.sceneKey, sid);
                                                                    handleLoadModels(sid);
                                                                }}
                                                                onModelChange={(modelName, modelId) =>
                                                                    updateModel(
                                                                        currentCfg.agentId,
                                                                        scene.sceneKey,
                                                                        supplierId,
                                                                        modelName,
                                                                        modelId
                                                                    )
                                                                }
                                                                requestModels={(sid) => handleLoadModels(sid)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="h-12 border-t flex items-center justify-end px-4 gap-3">
                    {currentCfg?.dirty && (
                        <div className="text-xs text-orange-500">
                            有未保存的修改。
                        </div>
                    )}
                    {currentCfg?.error && (
                        <div className="text-xs text-red-500">
                            {currentCfg.error}
                        </div>
                    )}
                    <button
                        className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
                        onClick={onClose}
                    >
                        关闭
                    </button>
                    <button
                        disabled={!currentCfg || currentCfg.saving}
                        onClick={handleSave}
                        className="px-5 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {currentCfg?.saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}