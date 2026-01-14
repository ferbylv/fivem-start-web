"use client"; // 需要使用客户端特性(虽然这里主要是CSS，但保持一致性)

import Image from "next/image";
import {
    Gamepad2,
    BookOpen,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Sparkles,
    X, // 引入关闭图标
    Download, // 引入下载图标
    ExternalLink

} from "lucide-react";
import {useState, useEffect} from "react";
import BookmarkHint from "@/components/BookmarkHint";
import { useRouter } from "next/navigation"; // 1. 引入路由钩子
import Navbar from "@/components/Navbar";
import { toast, Toaster } from "react-hot-toast";
import { useUserStore } from "@/store/userStore";
import {encryptData} from "@/utils/crypto";
// --- 1. 定义轮播图数据 ---
const BANNER_IMAGES = [
    {
        id: 1,
        // 图片地址：可以是本地路径，也可以是 https:// 开头的网络图片
        src: "banner1.jpg",
        link: "https://www.google.com", // 点击跳转地址
        title: "探索电竞新纪元",
        desc: "点击前往 Google 搜索更多内容"
    },
    {
        id: 2,
        src: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
        link: "/store", // 支持站内路由跳转
        title: "全新皮肤上架",
        desc: "限时五折优惠，点击进入商店"
    },
    {
        id: 3,
        src: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2165&auto=format&fit=crop",
        link: "https://fivem.net/",
        title: "社区活动开启",
        desc: "下载客户端参与周末狂欢"
    },
];

export default function HomePage() {
    // --- 2. 轮播图状态 ---
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovering, setIsHovering] = useState(false); // 鼠标悬停状态
    const router = useRouter();
    const { user } = useUserStore();
    // --- 3. 自动轮播逻辑 ---
    useEffect(() => {
        // 如果鼠标悬停，就不自动播放
        if (isHovering) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % BANNER_IMAGES.length);
        }, 5000); // 5秒切换一次

        return () => clearInterval(timer);
    }, [isHovering]); // 依赖 isHovering，状态变了会重置定时器

    // --- 手动切换函数 ---
    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + BANNER_IMAGES.length) % BANNER_IMAGES.length);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % BANNER_IMAGES.length);
    };

    // --- 处理点击开始游戏 ---
    const handleStartGame = () => {
        // 点击后，打开模态框
        setShowModal(true);
    };
    // --- 处理跳转下载/官网 ---
    const handleGoToDownload = () => {
        // 这里填入 FiveM 官网或你的下载地址
        window.open("https://fivem.net/", "_blank");
        setShowModal(false); // 点击后关闭弹窗
    };
    const handleStart = async () => {
        // 1. 如果没登录，弹窗提示
        console.log("start");
        if (!user) {
            toast.error("请先登录");
            return;
        }
        console.log(user);
        // 2. 调用后台进行 IP 预授权
        try {
            // 构建要传给后台的数据 (可以只传个 token，这里为了演示传 phone)
            const rawPayload = { phone: user.phone, timestamp: Date.now() };
            const encrypted = encryptData(rawPayload);

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/game/pre-auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: encrypted })
            });

            // 3. 无论后台成功与否，都尝试拉起游戏 (用户体验优先)
            // 替换你的服务器连接地址
            window.location.href = `${process.env.NEXT_PUBLIC_FIVEM_SERVER}`;

        } catch (e) {
            console.error("预授权失败", e);
            // 降级处理：直接拉起游戏
            window.location.href = `${process.env.NEXT_PUBLIC_FIVEM_SERVER}`;
        }
    };
    // 2. 定义模态框显示
    // 状态
    const [showModal, setShowModal] = useState(false);
    return (
        // 修改点 1: 移除 flex center 和 gray 背景，改为纯白全屏布局
        <div className="min-h-screen bg-white text-gray-800">
            <BookmarkHint />
            <Toaster position="top-center" />
            {/* 添加全局样式用于跑马灯动画 */}
            <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        /* 当鼠标悬停时暂停滚动，方便用户阅读 */
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

            {/* 内容容器：在手机上铺满，在大屏上限制最大宽度并居中 */}
            <div className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8 flex flex-col gap-6">
                {/* =========================================================
          模态框 (Modal) 代码块
         ========================================================= */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                        {/* 1. 黑色半透明背景遮罩 (点击背景关闭) */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
                            onClick={() => setShowModal(false)}
                        />

                        {/* 2. 弹窗主体内容 */}
                        <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-6 md:p-8 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">

                            {/* 关闭按钮 */}
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {/* 图标/插画 */}
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shadow-inner">
                                <Download size={40} />
                            </div>

                            {/* 文字提示 */}
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-800">
                                    准备开始游戏
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    如您尚未安装或打开 <span className="font-bold text-gray-700">FiveM</span> 客户端，<br/>
                                    请点击下方按钮前往下载。
                                </p>
                            </div>

                            {/* 按钮组 */}
                            <div className="w-full space-y-3">
                                {/* 下载/跳转按钮 */}
                                <button
                                    onClick={handleGoToDownload}
                                    className="w-full bg-[#5DA9E9] hover:bg-[#4B93D1] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    <span>前往下载 / 官网</span>
                                    <ExternalLink size={18} />
                                </button>

                                {/* 如果用户已经安装了，提供一个直接启动的按钮 (可选) */}
                                <button
                                    onClick={handleStart}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3.5 rounded-xl transition-colors text-sm"
                                >
                                    我已经安装，直接启动
                                </button>
                            </div>

                        </div>
                    </div>
                )}
                {/* --- 1. 顶部导航栏 --- */}
                {/*<div className="flex items-center justify-between">*/}
                {/*    <div className="flex items-center gap-2">*/}
                {/*        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-400 to-green-300 flex items-center justify-center text-white shadow-lg shadow-blue-200">*/}
                {/*            <Sparkles size={20} />*/}
                {/*        </div>*/}
                {/*        <span className="text-2xl font-bold text-gray-800 tracking-tight">Soft & Fresh</span>*/}
                {/*    </div>*/}

                {/*    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">*/}
                {/*        <Image*/}
                {/*            src="/avatar-placeholder.jpg" // 请确保有这张图，或者删掉Image用图标*/}
                {/*            alt="User"*/}
                {/*            width={40}*/}
                {/*            height={40}*/}
                {/*            className="object-cover"*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*</div>*/}
                <Navbar />
                {/* --- 2. 公告栏 (修改点：移到上方 + 宽度铺满 + 滚动特效) --- */}

                <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 bg-blue-500 p-1.5 rounded-full text-white shadow-md z-10">
                        <Megaphone size={16} />
                    </div>

                    <div className="flex-1 overflow-hidden relative h-6">
                        <div className="absolute top-0 left-0 whitespace-nowrap animate-marquee text-blue-600 font-medium leading-6">
                            欢迎来到我们的社区！新版本即将发布，请留意系统通知。这是演示文本...
                        </div>
                    </div>
                </div>

                {/* --- 3. 轮播图区域 (Hero Section) --- */}
                {/* 修改点：宽度 w-full 撑满容器 */}
                {/* =========================================================
            3. 轮播图区域 (支持点击跳转 + 网络图片)
           ========================================================= */}
                <div
                    className="relative group w-full aspect-[16/9] md:aspect-[21/9] rounded-[30px] overflow-hidden shadow-xl bg-gray-100 cursor-pointer" // 增加 cursor-pointer
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    {BANNER_IMAGES.map((banner, index) => (
                        <div
                            key={banner.id} // 使用唯一 id
                            onClick={() => {
                                // 判断逻辑：如果是 http 开头则新标签页打开，否则站内跳转
                                if (banner.link.startsWith("http")) {
                                    window.open(banner.link, "_blank");
                                } else {
                                    router.push(banner.link);
                                }
                            }}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out
                ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}
              `}
                        >
                            <Image
                                src={banner.src}
                                alt={banner.title}
                                fill
                                className="object-cover"
                                priority={index === 0}
                                // 【重要】开启此选项，允许加载任意域名的网络图片，而无需配置 next.config.js
                                // 如果你以后有了固定的图片存储域名（如阿里云OSS），建议关掉这个并在 config 里配置域名以获得更好的性能
                                unoptimized
                            />

                            {/* 遮罩层 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                            {/* 文字内容 */}
                            <div className={`absolute bottom-8 left-8 text-white transition-all duration-700 transform pointer-events-none
                  ${index === currentSlide ? "translate-y-0 opacity-100 delay-300" : "translate-y-4 opacity-0"}
              `}>
                                <h3 className="text-2xl md:text-4xl font-bold mb-2 drop-shadow-md flex items-center gap-2">
                                    {banner.title}
                                    {/* 可选：显示一个小箭头提示可以点击 */}
                                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/30 font-normal">
                    点击查看 &rarr;
                  </span>
                                </h3>
                                <p className="text-white/90 text-sm md:text-lg font-medium drop-shadow-sm">{banner.desc}</p>
                            </div>
                        </div>
                    ))}

                    {/* ... 下面的箭头和指示器代码保持不变 ... */}
                    {/* 左箭头 */}
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }} // stopPropagation 防止触发图片点击
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-blue-500 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/20 z-20 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* 右箭头 */}
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }} // stopPropagation 防止触发图片点击
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-blue-500 rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/20 z-20 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* 底部指示器 (Dots) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20" onClick={(e) => e.stopPropagation()}>
                        {BANNER_IMAGES.map((_, index) => (
                            <div
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full cursor-pointer transition-all shadow-sm
                  ${index === currentSlide
                                    ? "bg-white w-6 md:w-8"
                                    : "bg-white/50 hover:bg-white/80"}
                `}
                            />
                        ))}
                    </div>
                </div>

                {/* --- 4. 底部功能区 (Action Grid) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">

                    {/* Must Read */}
                    <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-6 flex items-center justify-between md:flex-col md:justify-center md:gap-4 shadow-sm hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group h-24 md:h-44">
                        <div className="flex items-center gap-4 md:flex-col md:gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform text-blue-500">
                                <BookOpen size={24} className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <span className="font-bold text-gray-700 text-lg">玩家必看</span>
                        </div>
                        {/* 手机端显示的箭头 */}
                        <ChevronRight className="md:hidden text-gray-300" />
                    </div>

                    {/* Rules */}
                    <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-6 flex items-center justify-between md:flex-col md:justify-center md:gap-4 shadow-sm hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group h-24 md:h-44">
                        <div className="flex items-center gap-4 md:flex-col md:gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform text-purple-500">
                                <ShieldAlert size={24} className="w-6 h-6 md:w-8 md:h-8"/>
                            </div>
                            <span className="font-bold text-gray-700 text-lg">规则</span>
                        </div>
                        <ChevronRight className="md:hidden text-gray-300" />
                    </div>

                    {/* START GAME */}
                    <div onClick={handleStartGame}  className="relative overflow-hidden rounded-[24px] p-6 flex items-center justify-center gap-3 shadow-lg shadow-blue-200 cursor-pointer group h-24 md:h-44 hover:-translate-y-1 transition-transform">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />

                        <div className="relative z-10 flex items-center gap-3 md:flex-col">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                                <Gamepad2 size={28} className="text-white" />
                            </div>
                            <span className="font-black text-white text-xl tracking-wider uppercase">开始游戏</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}