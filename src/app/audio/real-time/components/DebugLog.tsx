// File: src/app/audio/real-time/components/DebugLog.tsx
'use client';

import React, { Dispatch, SetStateAction } from 'react';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import type { RealtimeEvent } from '@/lib';
import { formatTime } from '@/app/audio/real-time/utils/formatTime';

interface DebugLogProps {
    realtimeEvents: RealtimeEvent[];
    setRealtimeEvents: Dispatch<SetStateAction<RealtimeEvent[]>>;
    filterText: string;
    setFilterText: Dispatch<SetStateAction<string>>;
    filterSource: 'all' | 'server' | 'client';
    setFilterSource: Dispatch<SetStateAction<'all' | 'server' | 'client'>>;
    expandedEvents: Record<string, boolean>;
    setExpandedEvents: Dispatch<SetStateAction<Record<string, boolean>>>;
    eventsContainerRef: React.RefObject<HTMLDivElement>;
    startTime: string;
}

export default function DebugLog({
                                     realtimeEvents,
                                     setRealtimeEvents,
                                     filterText,
                                     setFilterText,
                                     filterSource,
                                     setFilterSource,
                                     expandedEvents,
                                     setExpandedEvents,
                                     eventsContainerRef,
                                     startTime,
                                 }: DebugLogProps) {
    // 过滤事件列表
    function filterEvents(events: RealtimeEvent[]) {
        if (!filterText && filterSource === 'all') return events;
        return events.filter(evt => {
            if (filterSource !== 'all' && evt.source !== filterSource) return false;
            if (filterText) {
                const lower = filterText.toLowerCase();
                return (
                    evt.event.type.toLowerCase().includes(lower) ||
                    JSON.stringify(evt.event).toLowerCase().includes(lower)
                );
            }
            return true;
        });
    }

    return (
        <div className="bg-base-100 rounded-box flex max-h-full min-h-0 w-1/3 min-w-72 flex-col overflow-hidden border border-slate-300/20 shadow-md dark:border-slate-500/40">
            <div className="flex h-12 items-center justify-between p-2">
                <h2 className="text-xl font-semibold">调试日志</h2>
                <div>
                    {realtimeEvents.length > 0 && (
                        <>
                            <button
                                className="btn btn-sm"
                                onClick={() => setExpandedEvents({})}
                            >
                                全部折叠
                            </button>
                            <button
                                className="btn btn-sm"
                                onClick={() => {
                                    setExpandedEvents({});
                                    // 清空 filterText，以便下次重新检索
                                    setFilterText('');
                                    setRealtimeEvents([]);
                                }}
                            >
                                清掉
                            </button>
                        </>
                    )}
                </div>
            </div>

            {realtimeEvents.length > 0 && (
                <div className="border-base-300 flex items-center gap-2 border-b p-2">
                    <select
                        className="select select-sm select-bordered w-32"
                        value={filterSource}
                        onChange={e => setFilterSource(e.target.value as 'all' | 'server' | 'client')}
                    >
                        <option value="all">全部来源</option>
                        <option value="server">服务器</option>
                        <option value="client">客户端</option>
                    </select>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full pr-8"
                            placeholder="输入关键词过滤日志"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                        />
                        {filterText && (
                            <button
                                className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-slate-200"
                                onClick={() => setFilterText('')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div
                className="min-h-0 flex-1 overflow-y-auto p-2 text-sm"
                ref={eventsContainerRef}
            >
                {realtimeEvents.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                        暂无调试日志
                    </div>
                ) : filterEvents(realtimeEvents).length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                        没有匹配的日志
                    </div>
                ) : (
                    filterEvents(realtimeEvents).map((event, i) => {
                        const key = `${event.time}-${i}`;
                        const isExpanded = !!expandedEvents[key];
                        return (
                            <div key={key} className="border-base-300/40 mb-1 border-b py-1">
                                <div
                                    className="flex cursor-pointer items-center justify-between"
                                    onClick={() =>
                                        setExpandedEvents((prev: Record<string, boolean>) => ({
                                            ...prev,
                                            [key]: !prev[key],
                                        }))
                                    }
                                >
                                    <div className="flex min-w-0 items-center">
                    <span className="mr-2 font-mono">
                      {formatTime(event.time, startTime)}
                    </span>
                                        <span
                                            className={`ml-2 font-medium ${
                                                event.source === 'server'
                                                    ? 'text-purple-600 dark:text-purple-400'
                                                    : 'text-blue-600 dark:text-blue-400'
                                            }`}
                                        >
                      {event.source}
                    </span>
                                        <span className="ml-2 max-w-2/3 truncate">
                      {event.event.type}
                    </span>
                                    </div>
                                    <div>
                                        {isExpanded ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <pre className="bg-base-200 mt-1 overflow-x-auto rounded p-2 text-xs">
                    {JSON.stringify(event.event, null, 2)}
                  </pre>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}