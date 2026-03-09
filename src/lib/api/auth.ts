// File: lib/api/auth.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * 高阶函数，保护 API 并注入 userId。
 * 优先读 x-user-id header，header 不在就从 cookies 里读 userId。
 */
export function withUser<TRest extends any[] = []>(
    handler: (req: NextRequest, userId: string, ...rest: TRest) => Promise<NextResponse>
) {
    return async (req: NextRequest, ...rest: TRest) => {
        let userId = req.headers.get('x-user-id');
        if (!userId) {
            userId = req.cookies.get('userId')?.value ?? null;
        }
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        try {
            return await handler(req, userId, ...rest);
        } catch (err) {
            console.error('withUser error', err);
            return new NextResponse('Internal Server Error', { status: 500 });
        }
    };
}
