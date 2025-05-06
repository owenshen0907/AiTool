// File: middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CASDOOR_CONFIG } from '@/config'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    console.log('Middleware 被调用，当前路径：', path)

    // 放行首页、静态资源，以及 OAuth 回调/登出接口
    if (
        path === '/' ||
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path.startsWith('/public') ||
        path.startsWith('/api/auth/callback') ||
        path === '/api/auth/logout'
    ) {
        return NextResponse.next()
    }

    // 读取 sessionToken
    const token = request.cookies.get('sessionToken')?.value
    if (token) {
        try {
            // Edge 环境下一段简单的 JWT 解码
            const [, payloadB64] = token.split('.')
            const payloadJson = decodeURIComponent(
                atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
                    .split('')
                    .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join('')
            )
            const payload = JSON.parse(payloadJson)
            const userId = payload.sub || payload.username

            // 将 x-user-id 注入到后续请求头
            const headers = new Headers(request.headers)
            headers.set('x-user-id', userId)
            return NextResponse.next({ request: { headers } })
        } catch (e) {
            console.error('JWT 解码失败', e)
            // 解析失败就当作未登录，走后面跳转逻辑
        }
    }

    // 未携带 token，统一跳转到 Casdoor 登录
    const loginUrl = new URL(`${CASDOOR_CONFIG.endpoint}/login/oauth/authorize`)
    loginUrl.searchParams.set('client_id', CASDOOR_CONFIG.clientId)
    loginUrl.searchParams.set('response_type', 'code')
    loginUrl.searchParams.set('redirect_uri', CASDOOR_CONFIG.redirectUri)
    loginUrl.searchParams.set('scope', 'read')
    loginUrl.searchParams.set('state', 'casdoor')
    loginUrl.searchParams.set('app_name', CASDOOR_CONFIG.appName)
    loginUrl.searchParams.set('org_name', CASDOOR_CONFIG.orgName)
    console.log('Redirecting to login: ', loginUrl.toString())
    return NextResponse.redirect(loginUrl)
}

export const config = {
    // 只对除去 callback、logout、静态等之外的所有路径生效
    matcher: [
        /*
          匹配所有以 / 开头的路径，
          但排除以 /_next、/favicon.ico、/public、/api/auth/callback、/api/auth/logout 开头的
        */
        '/((?!_next/|favicon.ico|public/|api/auth/callback|api/auth/logout).*)'
    ]
}