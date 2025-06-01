// File: src/app/audio/real-time/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@/app/globals.css';

import Header from './components/Header';
import ConversationArea from './components/ConversationArea';
import DebugLog from './components/DebugLog';
import Modals from './components/Modals';

import { useCustomVoices } from './hooks/useCustomVoices';
import { useRealtimeClient } from './hooks/useRealtimeClient';
import { formatTime } from './utils/formatTime';

import type { RealtimeEvent } from '@/lib';
import { availableModels as rawModels, defaultInstruction, voices } from '@/lib';
import { debounce } from '@/lib';

const availableModels = [...rawModels];

export default function RealTimePage() {
    // 👇 封装一个安全读取的小工具
    function getLS(key: string, fallback = '') {
        if (typeof window === 'undefined') return fallback;          // SSR 阶段
        try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    }
    /* ——— 顶层状态 ——— */
    // const [wsUrl, setWsUrl] = useState<string>(() =>
    //     localStorage.getItem('wsUrl') ?? 'wss://api.stepfun.com/v1/realtime'
    // );
    // const [modelName, setModelName] = useState<string>(() =>
    //     localStorage.getItem('modelName') ?? availableModels[0]
    // );
    // const [apiKey, setApiKey] = useState<string>(() =>
    //     localStorage.getItem('apiKey') ?? ''
    // );
    /* ——— 顶层状态 ——— */
    const [wsUrl, setWsUrl]       = useState(() => getLS('wsUrl',       'wss://api.stepfun.com/v1/realtime'));
    const [modelName, setModelName] = useState(() => getLS('modelName', availableModels[0]));
    const [apiKey, setApiKey]     = useState(() => getLS('apiKey'));

    const [items, setItems] = useState<any[]>([]);
    const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
    const [filterText, setFilterText] = useState('');
    const [filterSource, setFilterSource] = useState<'all' | 'server' | 'client'>('all');
    const [audioPlayers, setAudioPlayers] = useState<Record<string, any>>({});

    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [startTime, setStartTime] = useState(new Date().toISOString());
    const [connectionError, setConnectionError] = useState('');

    const [selectedVoice, setSelectedVoice] = useState(voices[0]);
    const [instructions, setInstructions] = useState(defaultInstruction);
    const [newInstruction, setNewInstruction] = useState(defaultInstruction);
    const [temperature, setTemperature] = useState(0.8);
    const [conversationalMode, setConversationalMode] =
        useState<'manual' | 'realtime'>('manual');

    const eventsContainerRef = useRef<HTMLDivElement>(null);

    /* ——— 自定义 Hook：系统 + 自定义音色 ——— */
    const allVoices = useCustomVoices(wsUrl, apiKey);

    /* ——— 核心实时逻辑 Hook ——— */
    const {
        connectConversation,
        disconnectConversation,
        startRecording,
        stopRecording,
        toggleVAD,
        changeVoice,
        changeInstructions,
        initWaveSurfer,
        downloadAudio,
        togglePlay,
        audioPlayersRef,
    } = useRealtimeClient({
        wsUrl,
        modelName,
        apiKey,
        selectedVoice,
        setIsAISpeaking,
        setConnectionError,
        setRealtimeEvents,
        setItems,
        setIsConnected,
        setIsRecording,
        setAudioPlayers, // 让 Hook 把音频播放器状态同步回父组件
    });

    /* ——— 同步 localStorage ——— */
    useEffect(() => {
        localStorage.setItem('wsUrl', wsUrl);
        localStorage.setItem('modelName', modelName);
        localStorage.setItem('apiKey', apiKey);
    }, [wsUrl, modelName, apiKey]);

    /* ——— 页面 ——— */
    return (
        <div className="flex h-screen flex-col p-4">
            {/* 1. Header */}
            <Header
                isConnected={isConnected}
                connectionError={connectionError}
                onOpenSettings={() =>
                    (document.getElementById('settingsModal') as HTMLDialogElement)?.showModal()
                }
                onOpenInstructions={() =>
                    (document.getElementById('instructionsModal') as HTMLDialogElement)?.showModal()
                }
                // 点击连接时，把当前 conversationalMode 传进去
                onConnect={() => {
                    void debounce(() => connectConversation(conversationalMode), 300)();
                }}
                onDisconnect={() => void debounce(disconnectConversation, 300)()}
                conversationalMode={conversationalMode}
                availableModels={availableModels}
                modelName={modelName}
                onModelChange={setModelName}
                wsUrl={wsUrl}
                onWsUrlChange={setWsUrl}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                temperature={temperature}
                onTemperatureChange={setTemperature}
                allVoices={allVoices}
                selectedVoice={selectedVoice}
                onVoiceChange={(val) => {
                    setSelectedVoice(allVoices.find((v) => v.value === val) || allVoices[0]);
                    void changeVoice(val);
                }}
                onToggleVAD={() => {
                    const newMode = conversationalMode === 'manual' ? 'realtime' : 'manual';
                    setConversationalMode(newMode);
                    void toggleVAD(newMode);
                }}
            />

            <div className="flex h-full min-h-0 gap-2">
                {/* 2. ConversationArea */}
                <ConversationArea
                    items={items}
                    audioPlayers={audioPlayers}
                    isConnected={isConnected}
                    isRecording={isRecording}
                    isAISpeaking={isAISpeaking}
                    conversationalMode={conversationalMode}
                    togglePlay={togglePlay}
                    startRecording={() => {
                        setIsRecording(true);
                        void startRecording();
                    }}
                    stopRecording={() => {
                        setIsRecording(false);
                        void stopRecording();
                    }}
                    formatTime={(t) => formatTime(t, startTime)}
                    initWaveSurfer={initWaveSurfer}
                    downloadAudio={downloadAudio}
                    eventsContainerRef={eventsContainerRef}
                />

                {/* 3. 调试日志 */}
                <DebugLog
                    realtimeEvents={realtimeEvents}
                    setRealtimeEvents={setRealtimeEvents}
                    filterText={filterText}
                    setFilterText={setFilterText}
                    filterSource={filterSource}
                    setFilterSource={setFilterSource}
                    expandedEvents={expandedEvents}
                    setExpandedEvents={setExpandedEvents}
                    startTime={startTime}
                    eventsContainerRef={eventsContainerRef}
                />
            </div>

            {/* 4. 模态框 */}
            <Modals
                wsUrl={wsUrl}
                onWsUrlChange={setWsUrl}
                modelName={modelName}
                onModelChange={setModelName}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                availableModels={availableModels}
                instructions={instructions}
                newInstruction={newInstruction}
                setNewInstruction={setNewInstruction}
                onChangeInstructions={() => {
                    setInstructions(newInstruction);
                    void changeInstructions(newInstruction);
                }}
                onCloseSettings={() =>
                    (document.getElementById('settingsModal') as HTMLDialogElement)?.close()
                }
                onCloseInstructions={() =>
                    (document.getElementById('instructionsModal') as HTMLDialogElement)?.close()
                }
            />
        </div>
    );
}