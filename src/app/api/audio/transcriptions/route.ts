// File: src/app/api/audio/transcriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';

// 非流式音频转写处理函数
async function handler(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
        }

        const apiUrl = `${process.env.STEP_API_URL}/audio/transcriptions`;
        const apiKey = process.env.STEP_API_KEY;
        if (!apiUrl || !apiKey) {
            return NextResponse.json({ error: 'Missing STEP_API_URL or STEP_API_KEY' }, { status: 500 });
        }

        const apiForm = new FormData();
        apiForm.append('model', 'step-asr');
        apiForm.append('response_format', 'text');
        apiForm.append('file', file, 'audio.wav');

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: apiForm,
        });

        if (!res.ok) {
            const errMsg = await res.text();
            console.error('StepFun API error:', res.status, errMsg);
            return NextResponse.json({ error: errMsg }, { status: res.status });
        }

        const transcript = await res.text();
        return NextResponse.json({ text: transcript.trim() }, { status: 200 });
    } catch (err: any) {
        console.error('Transcription error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}

// 使用 withUser 包装，验证用户身份
export const POST = withUser(handler);
