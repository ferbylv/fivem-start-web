import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 1. 获取当前访问的路径
    const path = request.nextUrl.pathname

    // 2. 从 Cookie 中读取 Token (我们在 userStore 里存的名字是 auth_token)
    const token = request.cookies.get('auth_token')?.value

    // ============================================================
    //  场景 A: 用户已登录 (有Token) 但访问了 登录页 (/)
    //  -> 直接把他踢到 /home，防止重复登录
    // ============================================================
    if (path === '/' && token) {
        return NextResponse.redirect(new URL('/home', request.url))
    }

    // ============================================================
    //  场景 B: 用户未登录 (无Token) 但访问了 受保护页面
    //  -> 除了登录页(/)和静态资源，其他都要拦截
    // ============================================================

    // 定义白名单：不需要登录也能访问的路径
    // 包括: 登录页(/), 接口(/api), Next.js静态资源(/_next), 图片文件(.png/.jpg等)
    const isPublicPath =
        path === '/' ||
        path.startsWith('/api/') ||     // 接口通常由后端自己鉴权，或者允许公开调用(如发送验证码)
        path.startsWith('/_next/') ||   // 系统文件
        path.startsWith('/static/') ||  // 静态文件夹
        path.includes('.')              // 文件资源 (如 logo.png)

    if (!isPublicPath && !token) {
        // 如果不是公开路径，且没有 token，重定向回登录页
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 放行
    return NextResponse.next()
}

// 配置匹配规则 (为了性能，过滤掉不必要的请求)
export const config = {
    // 匹配所有路径，除了 api, _next/static, _next/image, favicon.ico
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
        '/' // 显式包含根路径
    ],
}