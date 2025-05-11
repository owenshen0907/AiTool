'use client';

import React from 'react';
import { Mic } from 'lucide-react';

export interface ChatVoiceInputProps {
    enableVoice?: boolean;
    listening: boolean;
    onStart: () => void;
    onStop: () => void;
}

export default function ChatVoiceInput({
                                           enableVoice = true,
                                           listening,
                                           onStart,
                                           onStop,
                                       }: ChatVoiceInputProps) {
    if (!enableVoice) return null;

    return (
        <button
            onClick={listening ? onStop : onStart}
            className={listening ? 'text-red-500 hover:text-red-700' : 'hover:text-gray-800'}
            title={listening ? '停止录音' : '语音输入'}
        >
            <Mic size={20} />
        </button>
    );
}