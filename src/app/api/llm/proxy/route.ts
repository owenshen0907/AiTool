import { NextRequest, NextResponse } from 'next/server';

interface ProxyBody {
    url: string;
    apiKey: string;
    payload: any;
}

export async function POST(req: NextRequest) {
    try {
        const { url, apiKey, payload } = (await req.json()) as ProxyBody;

        const upstream = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        return new NextResponse(await upstream.text(), { status: upstream.status });
    } catch (err) {
        return NextResponse.json(
            { error: 'proxy failed', detail: String(err) },
            { status: 500 },
        );
    }
}