// File: src/lib/api/auth.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * 高阶函数：优先从 header 里读 x-user-id（middleware 注入），fallback 读 cookie userId
 */
export function withUser(
    handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        // 1) header 优先
        let userId = req.headers.get('x-user-id');
        // 2) fallback 到 cookie
        if (!userId) {
            userId = req.cookies.get('userId')?.value ?? null;
        }
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        try {
            return await handler(req, userId);
        } catch (err) {
            console.error('withUser error', err);
            return new NextResponse('Internal Server Error', { status: 500 });
        }
    };
}