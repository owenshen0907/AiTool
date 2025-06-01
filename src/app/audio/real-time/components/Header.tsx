// File: src/app/audio/real-time/components/Header.tsx
'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface VoiceOption {
    name: string;
    value: string;
}

interface HeaderProps {
    isConnected: boolean;
    connectionError: string;
    onOpenSettings: () => void;
    onOpenInstructions: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
    conversationalMode: 'manual' | 'realtime';
    availableModels: string[];
    modelName: string;
    onModelChange: Dispatch<SetStateAction<string>>;
    wsUrl: string;
    onWsUrlChange: Dispatch<SetStateAction<string>>;
    apiKey: string;
    onApiKeyChange: Dispatch<SetStateAction<string>>;
    temperature: number;
    onTemperatureChange: (temp: number) => void;
    allVoices: VoiceOption[];
    selectedVoice: VoiceOption;
    onVoiceChange: (voiceVal: string) => void;
    onToggleVAD: () => void;
}

export default function Header({
                                   isConnected,
                                   connectionError,
                                   onOpenSettings,
                                   onOpenInstructions,
                                   onConnect,
                                   onDisconnect,
                                   conversationalMode,
                                   availableModels,
                                   modelName,
                                   onModelChange,
                                   wsUrl,
                                   onWsUrlChange,
                                   apiKey,
                                   onApiKeyChange,
                                   temperature,
                                   onTemperatureChange,
                                   allVoices,
                                   selectedVoice,
                                   onVoiceChange,
                                   onToggleVAD,
                               }: HeaderProps) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Stepfun Realtime 实时对话体验</h1>
            <div className="flex items-center justify-end space-x-2">
                {connectionError && (
                    <div className="text-error ml-2 whitespace-nowrap">{connectionError}</div>
                )}

                {!isConnected ? (
                    <>
                        <button
                            onClick={onOpenSettings}
                            className="btn rounded-box mr-2"
                        >
                            <Settings size={16} />
                            服务器设置
                        </button>
                        <button
                            onClick={onConnect}
                            className="btn btn-primary rounded-box"
                        >
                            点击连接
                        </button>
                    </>
                ) : (
                    <>
                        {/* 切换音色：移除 disabled，使连接后也能改 */}
                        <label className="select rounded-box mr-2 w-60">
                            <span className="label">切换音色</span>
                            <select
                                value={selectedVoice.value}
                                onChange={e => onVoiceChange(e.target.value)}
                                className="select select-bordered"
                            >
                                {allVoices.map((voice) => (
                                    <option key={voice.value} value={voice.value}>
                                        {voice.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* 切换对话模式 */}
                        <label className="select rounded-box mr-2 w-48">
                            <span className="label">对话模式</span>
                            <select
                                value={conversationalMode}
                                onChange={() => onToggleVAD()}
                                className="select select-bordered"
                            >
                                <option value="manual">手动对话</option>
                                <option value="realtime">实时对话</option>
                            </select>
                        </label>

                        {/* 设定温度：移除 disabled，使连接后可改 */}
                        <label className="input rounded-box mr-2 w-48">
                            <span className="label">温度</span>
                            <input
                                type="number"
                                step="0.1"
                                max={1.0}
                                min={0.0}
                                value={temperature}
                                onChange={e => onTemperatureChange(parseFloat(e.target.value))}
                                className="input input-bordered"
                                placeholder="修改温度"
                            />
                        </label>

                        <button
                            onClick={onOpenInstructions}
                            className="btn rounded-box mr-2"
                        >
                            修改人设
                        </button>

                        <button
                            onClick={onDisconnect}
                            className="btn rounded-box bg-rose-500 text-slate-50"
                        >
                            点击断开连接
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}