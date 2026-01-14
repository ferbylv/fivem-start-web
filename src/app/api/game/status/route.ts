import { NextResponse } from 'next/server';

// 建议将这些配置放在 .env 文件中
// const SERVER_IP = process.env.NEXT_PUBLIC_FIVEM_SERVER || "127.0.0.1";

const TIMEOUT_MS = 2000;

export async function GET() {
    const infoUrl = `http://${process.env.NEXT_PUBLIC_FIVEM_SERVER_TCP}/info.json`;
    const playersUrl = `http://${process.env.NEXT_PUBLIC_FIVEM_SERVER_TCP}players.json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        // 1. 请求 info.json 检查在线状态
        const response = await fetch(infoUrl, {
            signal: controller.signal,
            cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            // 2. 尝试获取在线人数 (可选)
            let playerCount = 0;
            try {
                const playersRes = await fetch(playersUrl, {
                    next: { revalidate: 10 },
                    signal: AbortSignal.timeout(2000) // 这里其实不能重用已abort的signal，如果不传也没事，或者新建一个
                });
                if (playersRes.ok) {
                    const playersData = await playersRes.json();
                    playerCount = Array.isArray(playersData) ? playersData.length : 0;
                }
            } catch (e) {
                // 获取人数失败不影响在线判定
            }

            return NextResponse.json({
                online: true,
                playerCount: playerCount
            });
        } else {
            throw new Error('Server returned non-200 status');
        }

    } catch (error) {
        return NextResponse.json({
            online: false,
            playerCount: 0,
            error: 'Timeout or Network Error'
        }, { status: 200 }); // 注意：这里返回 200 是为了前端好处理，内容里的 online: false 才是关键
    }
}