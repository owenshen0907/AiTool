// src/app/components/info/agentConfig/AgentList.tsx
'use client';
import React from 'react';
import type { AgentMeta } from './types';

interface Props {
    agents: AgentMeta[];
    current: string | null;
    onSelect: (id: string) => void;
}

export default function AgentList({ agents, current, onSelect }: Props) {
    return (
        <div className="w-60 border-r bg-gray-50 h-full overflow-auto">
            <div className="p-3 font-semibold text-gray-700">Agents</div>
            <ul>
                {agents.map(a => {
                    const active = a.agentId === current;
                    return (
                        <li
                            key={a.agentId}
                            className={`px-3 py-2 cursor-pointer text-sm hover:bg-white transition ${active ? 'bg-white font-medium border-l-4 border-blue-500' : ''}`}
                            onClick={() => onSelect(a.agentId)}
                            title={a.description}
                        >
                            <div className="truncate">{a.name}</div>
                            <div className="text-xs text-gray-400 truncate">{a.agentId}</div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}