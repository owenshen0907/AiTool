import { NextRequest, NextResponse } from 'next/server';

/**
 * 高阶函数：统一处理用户鉴权，并注入 userId
 */
export function withUser(
    handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        const userId = req.headers.get('x-user-id');
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