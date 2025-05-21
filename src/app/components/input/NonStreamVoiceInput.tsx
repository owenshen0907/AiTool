// File: app/components/input/NonStreamVoiceInput.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Mic2 } from 'lucide-react';

export interface NonStreamVoiceInputProps {
    enableVoice?: boolean;
    onTranscription: (text: string) => void;
}

export default function NonStreamVoiceInput({
                                                enableVoice = true,
                                                onTranscription,
                                            }: NonStreamVoiceInputProps) {
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        if (!enableVoice) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
            audioChunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            // 上传到非流式转写接口
            const formData = new FormData();
            formData.append('file', blob, 'audio.webm');
            try {
                const res = await fetch('/api/audio/transcriptions', {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                if (data.text) {
                    onTranscription(data.text);
                }
            } catch (err) {
                console.error('Non-stream transcription error:', err);
            }
            // 停止所有音轨
            stream.getTracks().forEach(t => t.stop());
            setRecording(false);
        };

        recorder.start();
        setRecording(true);
    }, [enableVoice, onTranscription]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
        }
    }, [recording]);

    const handleClick = () => {
        if (recording) stopRecording();
        else startRecording();
    };

    if (!enableVoice) return null;
    return (
        <div className="relative group inline-block">
            <button
                onClick={handleClick}
                className={`p-2 rounded focus:outline-none ${recording ? 'text-red-500 animate-pulse' : 'hover:text-gray-800'}`}
                title={recording ? '停止录音并转写' : '开始单次录音'}
            >
                <Mic2 size={20} />
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {recording ? '点击停止并转写' : '单次录音'}
            </div>
        </div>
    );
}
