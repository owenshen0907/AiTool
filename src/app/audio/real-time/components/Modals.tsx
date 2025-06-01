// File: src/app/audio/real-time/components/Modals.tsx
'use client';

import React, { Dispatch, SetStateAction } from 'react';

interface ModalsProps {
    wsUrl: string;
    onWsUrlChange: Dispatch<SetStateAction<string>>;
    modelName: string;
    onModelChange: Dispatch<SetStateAction<string>>;
    apiKey: string;
    onApiKeyChange: Dispatch<SetStateAction<string>>;
    availableModels: string[];
    instructions: string;            // 当前已保存的“人设”
    newInstruction: string;          // 用于 textarea 临时写入
    setNewInstruction: Dispatch<SetStateAction<string>>;
    onChangeInstructions: () => void;  // 父组件保存并调用后端
    onCloseInstructions: () => void;   // 只是关闭对话框
    onCloseSettings: () => void;
}

export default function Modals({
                                   wsUrl,
                                   onWsUrlChange,
                                   modelName,
                                   onModelChange,
                                   apiKey,
                                   onApiKeyChange,
                                   availableModels,
                                   instructions,
                                   newInstruction,
                                   setNewInstruction,
                                   onChangeInstructions,
                                   onCloseInstructions,
                                   onCloseSettings,
                               }: ModalsProps) {
    return (
        <>
            {/* 修改人设模态框 */}
            <dialog id="instructionsModal" className="modal">
                <form method="dialog" className="modal-box">
                    <h2 className="mb-4 text-lg font-semibold">修改人设</h2>
                    <textarea
                        value={newInstruction}
                        onChange={e => setNewInstruction(e.target.value)}
                        className="border-base-300 rounded-box mb-4 h-64 w-full border p-2"
                    />
                    <div className="modal-action">
                        <button
                            type="button"
                            onClick={onCloseInstructions}
                            className="btn rounded-box"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary rounded-box"
                            onClick={() => {
                                onChangeInstructions();
                                onCloseInstructions();   // 保存完毕后一定要手动 close
                            }}
                        >
                            确定
                        </button>
                    </div>
                </form>
            </dialog>

            {/* 服务器设置模态框 */}
            <dialog id="settingsModal" className="modal">
                <form method="dialog" className="modal-box">
                    <h2 className="mb-4 text-lg font-semibold">服务器设置</h2>
                    <div className="space-y-4">
                        <label className="input rounded-box w-full flex items-center">
                            <span className="label w-32">服务器 URL</span>
                            <input
                                type="text"
                                placeholder="服务器地址"
                                value={wsUrl}
                                onChange={e => onWsUrlChange(e.target.value)}
                                className="input input-bordered flex-1"
                            />
                        </label>

                        <label className="select rounded-box w-full flex items-center">
                            <span className="label w-32">模型</span>
                            <select
                                value={modelName}
                                onChange={e => onModelChange(e.target.value)}
                                className="select select-bordered flex-1"
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="input rounded-box w-full flex items-center">
                            <span className="label w-32">API Key</span>
                            <input
                                type="text"
                                placeholder="API Key"
                                value={apiKey}
                                onChange={e => onApiKeyChange(e.target.value)}
                                className="input input-bordered flex-1"
                            />
                        </label>
                    </div>

                    <div className="modal-action">
                        <button
                            type="submit"
                            onClick={onCloseSettings}
                            className="btn rounded-box"
                        >
                            确定
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    );
}