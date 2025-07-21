// File: src/app/agent/image/right/CacheBar.tsx
'use client';

import React from 'react';

interface CacheItem {
    id: string;
    key: string;
    title: string;
    suggestion: string;
    content: string;
}

interface Props {
    items: CacheItem[];
    onClick: (item: CacheItem) => void;
    onRemove: (id: string) => void;
}

const colors = [
    'bg-gradient-to-r from-red-300 to-pink-300',
    'bg-gradient-to-r from-green-300 to-lime-300',
    'bg-gradient-to-r from-blue-300 to-cyan-300',
    'bg-gradient-to-r from-yellow-300 to-orange-300',
    'bg-gradient-to-r from-indigo-300 to-purple-300',
    'bg-gradient-to-r from-pink-300 to-red-300',
    'bg-gradient-to-r from-purple-300 to-indigo-300',
    'bg-gradient-to-r from-teal-300 to-blue-300'
];

export default function CacheBar({ items, onClick, onRemove }: Props) {
    if (!items.length) return null;
    return (
        <div className="mt-4 mb-4 flex flex-wrap gap-2">
            {items.map((item, idx) => (
                <div key={item.id} className="relative">
                    <button
                        onClick={() => onClick(item)}
                        className={`${colors[idx % colors.length]} px-2 py-1 rounded text-sm`}
                    >
                        {item.title}
                    </button>
                    <span
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full cursor-pointer"
                        onClick={() => onRemove(item.id)}
                    >
            ×
          </span>
                </div>
            ))}
        </div>
    );
}