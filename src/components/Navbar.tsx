"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useState, useRef, useEffect } from "react";
import {
    Sparkles,
    ShoppingBag,
    Home,
    User,
    Package,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    LogOut,
    Copy,
    Loader2,
    Key,
    Lock,
    Download,
    Wifi,
    WifiOff // 新增图标用于显示在线状态
} from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/userStore";

// 定义 PWA 安装事件的类型接口 (解决 TS 报错)
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    // UI 状态
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isGettingCode, setIsGettingCode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // PWA 事件状态
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    // User Store
    const { user, logout, checkLogin, refreshUser, isServerOnline, playerCount, setServerStatus } = useUserStore();
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                // 调用第一步写的 API
                const token = Cookies.get("auth_token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/server/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });



                const data = await res.json();
                if (data.code === 503) {
                    logout();
                    router.replace("/");
                    return;
                }
                // 更新全局 Store
                setServerStatus(data.online, data.playerCount);
                refreshUser();
                // 可选：如果离线了，打印个日志或者做个轻微提示
                // if (!data.online) console.log("服务器离线中...");

            } catch (error) {
                setServerStatus(false, 0);
            }
        };

        // 1. 组件加载时立即检查一次
        checkServerStatus();

        // 2. 设置定时器，每 30 秒检查一次
        const interval = setInterval(checkServerStatus, 30000);

        return () => clearInterval(interval);
    }, [setServerStatus]);
    // 1. 初始化逻辑
    useEffect(() => {
        setIsMounted(true);
        checkLogin();
        // 静默刷新数据
        refreshUser();
    }, []);

    // 2. 监听 PWA 安装事件
    useEffect(() => {
        const handleInstallPrompt = (e: Event) => {
            // 阻止浏览器默认的底部横幅
            e.preventDefault();
            // 保存事件引用，用于后续触发
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            console.log("PWA 安装事件已捕获");
        };

        window.addEventListener('beforeinstallprompt', handleInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
        };
    }, []);

    // 3. 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- 动作：安装 PWA ---
    const handleInstallApp = async () => {
        if (!deferredPrompt) {
            toast.error("当前环境不支持安装或已安装");
            return;
        }

        try {
            // 触发弹窗
            await deferredPrompt.prompt();

            // 等待用户选择
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`用户选择: ${outcome}`);

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                toast.success("正在安装到桌面...");
            }
        } catch (err) {
            console.error("安装失败:", err);
        }
    };

    // --- 动作：退出登录 ---
    const handleLogout = () => {
        logout();
        router.replace("/");
        toast.success("已安全退出");
    };

    // --- 工具：复制文本 (兼容 HTTP) ---
    const copyText = (text: string) => {
        // 1. 尝试现代 API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => toast.success("已复制到剪贴板"))
                .catch(() => fallbackCopy(text));
        } else {
            // 2. 回退方案
            fallbackCopy(text);
        }
    };

    const fallbackCopy = (text: string) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) toast.success("已复制到剪贴板");
            else toast.error("复制失败，请手动复制");
        } catch (err) {
            console.error(err);
            toast.error("复制失败");
        }
    };

    // --- 动作：获取绑定码 ---
    const handleGetBindingCode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        setIsGettingCode(true);

        try {
            // 注意：这里使用了 fallback 或者是你环境变量里的 API
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.5:8000/api";

            const res = await fetch(`${apiUrl}/bind/get-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.userId })
            });
            const data = await res.json();

            if (data.success) {
                toast((t) => (
                    <div className="flex flex-col gap-3 min-w-[240px] py-1">
                        <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-2">
                            <Key size={18} className="text-blue-500" />
                            <span>获取成功</span>
                        </div>
                        <div className="text-xs text-gray-500">请在游戏内输入以下绑定码：</div>

                        <div
                            className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 group hover:border-blue-300 transition-colors cursor-pointer"
                            onClick={() => copyText(data.code)}
                        >
                            <span className="text-xl font-mono font-bold text-blue-600 tracking-widest select-all">
                                {data.code}
                            </span>
                            <button
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    copyText(data.code);
                                    toast.dismiss(t.id);
                                }}
                                className="p-1.5 bg-white rounded-md shadow-sm text-gray-400 hover:text-blue-500 hover:scale-105 transition-all active:scale-95"
                                title="复制"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <span className="text-[10px] text-red-400 text-center">注意：该验证码 5 分钟内有效</span>
                    </div>
                ), { duration: 6000, position: "top-center" });
            } else {
                toast.error(data.message || "获取失败");
            }
        } catch (err) {
            console.error(err);
            toast.error("网络请求错误");
        } finally {
            setIsGettingCode(false);
        }
    };

    // 辅助函数
    const maskPhone = (phone: string) => phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : "";

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        return `flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm md:text-base ${isActive ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`;
    };

    return (
        <div className="flex items-center justify-between mb-6 relative z-50">
            {/* 左侧 Logo + 导航 */}
            <div className="flex items-center gap-4 md:gap-12">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/home')}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-400 to-green-300 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Sparkles size={20} />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 tracking-tight hidden md:block">
                        Home Land
                    </span>
                </div>

                <div className="flex items-center bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                    <Link href="/home" className={getLinkClass("/home")}>
                        <Home size={18} /><span>首页</span>
                    </Link>
                    <Link href="/store" className={getLinkClass("/store")}>
                        <ShoppingBag size={18} /><span>商店</span>
                    </Link>
                </div>
            </div>

            {/* 右侧 用户区域 */}
            <div className="relative" ref={menuRef}>
                {(!isMounted || !user) ? (
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-colors"
                    >
                        去登录
                    </button>
                ) : (
                    <>
                        {/* 头像区域 */}
                        <div
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`flex items-center gap-2 pl-1 pr-1 md:pr-3 py-1 rounded-full border transition-all cursor-pointer select-none ${isMenuOpen ? "bg-white border-blue-200 ring-4 ring-blue-50 shadow-md" : "bg-white border-gray-200 hover:border-blue-300"
                                }`}
                        >
                            <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400">
                                <User size={20} />
                            </div>
                            <div className="hidden md:flex items-center gap-1 text-xs font-medium text-gray-600">
                                <span>{maskPhone(user.phone)}</span>
                                <ChevronDown size={14} className={`transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`} />
                            </div>
                        </div>

                        {/* 下拉菜单 */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className={`text-[10px] text-center py-1 font-bold tracking-wider flex items-center justify-center gap-1
                    ${isServerOnline ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}
                `}>
                                    {isServerOnline ? (
                                        <><Wifi size={10} /> 服务器在线 | {playerCount} 人游玩中</>
                                    ) : (
                                        <><WifiOff size={10} /> 服务器离线维护中</>
                                    )}
                                </div>
                                {/* 顶部：用户信息与绑定状态 */}
                                <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                                    <p className="text-xs text-gray-400 mb-1">当前登录</p>
                                    <p className="text-lg font-bold text-gray-800 font-mono tracking-wide">
                                        {maskPhone(user.phone)}
                                    </p>

                                    <div className="mt-2 flex items-center gap-2">
                                        {user.isBound ? (
                                            <div className="w-full flex items-center justify-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-md border border-green-100">
                                                <CheckCircle2 size={12} /><span>已绑定账号</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-red-50 text-red-500 text-xs font-bold rounded-md border border-red-100 whitespace-nowrap">
                                                    <AlertCircle size={12} /><span>未绑定</span>
                                                </div>
                                                <button
                                                    onClick={handleGetBindingCode}
                                                    disabled={isGettingCode}
                                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${isGettingCode
                                                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-wait"
                                                        : "bg-blue-500 text-white border-blue-600 shadow-sm shadow-blue-200 hover:bg-blue-600 hover:shadow-md"
                                                        }`}
                                                >
                                                    {isGettingCode ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                                                    <span>{isGettingCode ? "获取中" : "获取绑定码"}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 菜单项：管理后台 (仅管理员可见) */}
                                {(user.isAdmin || user.isSuperAdmin) && (
                                    <div className="p-2 pb-0">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL || '/admin/dashboard'}`;
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 text-gray-700 hover:text-slate-800 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                                    <Lock size={18} />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-bold text-sm">管理后台</span>
                                                    <span className="text-[10px] text-gray-400 font-normal">系统与用户管理</span>
                                                </div>
                                            </div>
                                            <span className="text-gray-300 group-hover:text-slate-400">→</span>
                                        </button>
                                    </div>
                                )}

                                {/* 菜单项：我的资源 */}
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            // 1. 优先检查服务器是否在线
                                            if (!isServerOnline) {
                                                toast.error("服务器当前处于离线状态，无法查看资源", {
                                                    icon: '🚫',
                                                    style: { borderRadius: '10px', background: '#333', color: '#fff' },
                                                });
                                                return; // 阻止跳转
                                            }
                                            if (!user.isBound) {
                                                toast.error("请先绑定游戏账号才能查看资源", {
                                                    icon: '🔒',
                                                    style: { borderRadius: '10px', background: '#333', color: '#fff' },
                                                });
                                                return;
                                            }
                                            setIsMenuOpen(false);
                                            router.push("/mysource");
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors group ${!isServerOnline
                                            ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-70"
                                            : user.isBound
                                                ? "hover:bg-blue-50 text-gray-700 hover:text-blue-600 cursor-pointer"
                                                : "bg-gray-50 text-gray-400 cursor-not-allowed opacity-80"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* 图标容器 */}
                                            <div className={`p-2 rounded-lg transition-colors ${!isServerOnline
                                                ? "bg-gray-200 text-gray-400" // 离线样式
                                                : user.isBound
                                                    ? "bg-blue-100 text-blue-500 group-hover:bg-blue-500 group-hover:text-white"
                                                    : "bg-gray-200 text-gray-500"
                                                }`}>
                                                {user.isBound && isServerOnline ? <Package size={18} /> : <Lock size={18} />}
                                            </div>

                                            <div className="flex flex-col items-start">
                                                <span className="font-bold text-sm">我的资源</span>
                                                {/* 状态提示文字 */}
                                                {!isServerOnline ? (
                                                    <span className="text-[10px] text-red-400 font-bold">服务器维护中</span>
                                                ) : !user.isBound && (
                                                    <span className="text-[10px] text-gray-400 font-normal">需绑定账号</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* 箭头 */}
                                        {isServerOnline && user.isBound && <span className="text-gray-300 group-hover:text-blue-400">→</span>}
                                    </button>
                                </div>

                                {/* 菜单项：安装到桌面 (仅当浏览器支持且触发事件后显示) */}
                                {deferredPrompt && (
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleInstallApp();
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 text-purple-500 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                                    <Download size={18} />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-bold text-sm">安装到桌面</span>
                                                    <span className="text-[10px] text-gray-400 font-normal">原生应用体验</span>
                                                </div>
                                            </div>
                                            <span className="text-gray-300 group-hover:text-purple-400 text-lg leading-none">+</span>
                                        </button>
                                    </div>
                                )}

                                {/* 菜单项：退出登录 */}
                                <div className="p-2 border-t border-gray-50">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-red-500 py-2 transition-colors hover:bg-red-50 rounded-lg"
                                    >
                                        <LogOut size={14} /> 退出登录
                                    </button>
                                </div>

                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}