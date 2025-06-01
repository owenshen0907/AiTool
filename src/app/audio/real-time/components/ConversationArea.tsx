// File: src/app/audio/real-time/components/ConversationArea.tsx
'use client';

import React from 'react';
import clsx from 'clsx';
import { Pause, Play, Mic, ArrowUp, Download, Info } from 'lucide-react';

interface ConversationAreaProps {
    items: any[];
    audioPlayers: Record<string, any>;
    isConnected: boolean;
    isRecording: boolean;
    isAISpeaking: boolean;
    conversationalMode: 'manual' | 'realtime';
    startRecording: () => void;
    stopRecording: () => void;
    initWaveSurfer: (node: HTMLDivElement | null, id: string, url: string) => void;
    downloadAudio: (url: string, filename: string) => void;
    togglePlay: (id: string) => void;
    formatTime: (ts: string) => string;
    eventsContainerRef: React.RefObject<HTMLDivElement>;
}

export default function ConversationArea({
                                             items,
                                             audioPlayers,
                                             isConnected,
                                             isRecording,
                                             isAISpeaking,
                                             conversationalMode,
                                             startRecording,
                                             stopRecording,
                                             initWaveSurfer,
                                             downloadAudio,
                                             togglePlay,
                                             eventsContainerRef,
                                         }: ConversationAreaProps) {
    console.debug('[ConversationArea] audioPlayers =', audioPlayers);

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {!isConnected ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
                    <div className="mb-8 flex items-center justify-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">开始实时对话体验</h3>
                    </div>
                    <ol className="list-inside list-decimal text-left max-w-md space-y-2">
                        <li>
                            <span className="font-semibold">设置服务器信息：</span>
                            点击 “服务器设置” 按钮，填写服务器地址、模型和 API Key。
                        </li>
                        <li>
                            <span className="font-semibold">连接到服务器：</span>
                            点击 “点击连接” 按钮，即可开始实时对话。
                        </li>
                    </ol>
                </div>
            ) : (
                <>
                    {/* 1. AI 圆圈 */}
                    <div className="flex flex-col items-center justify-center p-8">
                        <div
                            className={clsx(
                                'relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-tr shadow-lg transition-all duration-300',
                                isAISpeaking
                                    ? 'from-pink-500 to-rose-500 animate-pulse scale-105'
                                    : isRecording
                                        ? 'from-blue-500 to-rose-500'
                                        : 'from-pink-300 to-rose-400'
                            )}
                        >
              <span className="text-lg font-medium text-white">
                {isRecording ? 'Listening...' : isAISpeaking ? 'Speaking' : 'AI'}
              </span>
                        </div>
                    </div>

                    {/* 2. 历史消息 列表 */}
                    <div
                        className="flex-1 space-y-4 overflow-y-auto p-2"
                        ref={eventsContainerRef}
                    >
                        {items.map((item) =>
                            item.formatted?.transcript ? (
                                <div
                                    key={item.id}
                                    className={clsx(
                                        'rounded-box flex flex-col p-2 min-h-18 max-w-[80%]',
                                        item.role === 'user'
                                            ? 'dark:bg-base-200 ml-auto bg-blue-100'
                                            : 'bg-base-200 mr-auto'
                                    )}
                                >
                                    {/* 头像 + 波形 */}
                                    <div
                                        className={clsx(
                                            'mb-1 font-semibold',
                                            item.role === 'user'
                                                ? 'text-blue-700 dark:text-blue-400'
                                                : 'text-rose-400'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{item.role === 'user' ? 'You' : 'AI'}</span>

                                            {item.formatted?.file?.url && (
                                                <div className="bg-base-300/80 flex h-6 w-48 items-center gap-2 overflow-hidden rounded-lg px-2 transition-all duration-200 hover:shadow group">
                                                    {/* 播放／暂停 */}
                                                    <button
                                                        className="transition-colors duration-200 hover:scale-110 hover:cursor-pointer"
                                                        onClick={() => togglePlay(item.id)}
                                                        title={audioPlayers[item.id]?.isPlaying ? '暂停' : '播放'}
                                                        disabled={
                                                            audioPlayers[item.id]?.isLoading ||
                                                            audioPlayers[item.id]?.hasError
                                                        }
                                                    >
                                                        {audioPlayers[item.id]?.isLoading ? (
                                                            <div className="loading loading-spinner loading-xs" />
                                                        ) : audioPlayers[item.id]?.isPlaying ? (
                                                            <Pause size={14} />
                                                        ) : (
                                                            <Play size={14} />
                                                        )}
                                                    </button>

                                                    {/* 波形：仅当 audioPlayers[item.id] 还未创建时，才初始化一次 */}
                                                    <div
                                                        id={`waveform-${item.id}`}
                                                        className={clsx(
                                                            'flex-1 overflow-hidden rounded-lg',
                                                            audioPlayers[item.id]?.hasError && 'opacity-50'
                                                        )}
                                                        ref={(el) => {
                                                            if (el && audioPlayers[item.id] === undefined) {
                                                                console.log(
                                                                    `[ConversationArea] initWaveSurfer called, id=${item.id}, url=`,
                                                                    item.formatted.file.url.slice(0, 30) + '…'
                                                                );
                                                                initWaveSurfer(el, item.id, item.formatted.file.url);
                                                            }
                                                        }}
                                                    />

                                                    {/* 下载 */}
                                                    <button
                                                        className="transition-colors duration-200 hover:scale-110 hover:cursor-pointer opacity-0 group-hover:opacity-100"
                                                        onClick={() =>
                                                            downloadAudio(item.formatted.file.url, `audio-${item.id}.wav`)
                                                        }
                                                        title="下载音频"
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 文本 */}
                                    <p>{item.formatted.transcript}</p>
                                </div>
                            ) : null
                        )}
                    </div>

                    {/* 3. 录音 按钮 */}
                    <div className="border-base-300/50 border-t p-2">
                        {conversationalMode === 'manual' ? (
                            <div className="flex flex-col items-center">
                                <button
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onMouseLeave={isRecording ? stopRecording : undefined}
                                    className={clsx(
                                        'flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-colors hover:opacity-90 focus:outline-none',
                                        isRecording ? 'bg-emerald-500' : 'bg-blue-500'
                                    )}
                                >
                                    {isRecording ? <ArrowUp /> : <Mic />}
                                </button>
                                <div className="mt-2 text-center text-sm">
                                    {isRecording ? '松手发送' : '按住说话'}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">实时对话中…</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}