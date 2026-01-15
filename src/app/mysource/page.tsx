/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import toast from "react-hot-toast";
import {
    Wallet, CreditCard, Car, Package, Link as LinkIcon,
    Loader2, Bitcoin, IdCard, Smartphone, AlertTriangle, Info
} from "lucide-react";
import { encryptData, decryptData } from "@/utils/crypto";
import Cookies from "js-cookie";

// --- 类型定义 ---
interface FiveMItem {
    name: string;
    label: string;
    amount: number;
    description: string;
    image_url: string;
    slot: number;
    info: any;
}

interface UserAssetsData {
    license: string;
    citizenid: string;
    is_online: boolean;
    charinfo: {
        firstname: string;
        lastname: string;
        birthdate: string;
        nationality: string;
        phone: string;
        account: string;
    };
    money: {
        cash: number;
        bank: number;
        crypto: number;
    };
    items: FiveMItem[];
    vehicles: any[];
}

// 默认空数据 (用于未绑定或加载失败时撑开页面结构，保持UI不塌陷)
const DEFAULT_ASSETS: UserAssetsData = {
    license: "",
    citizenid: "Unknown",
    is_online: false,
    charinfo: {
        firstname: "游客",
        lastname: "(未绑定)",
        birthdate: "--",
        nationality: "--",
        phone: "--",
        account: "--"
    },
    money: {
        cash: 0,
        bank: 0,
        crypto: 0
    },
    items: [],
    vehicles: []
};

// 游戏服接口配置
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}`;

export default function MySourcePage() {
    const router = useRouter();
    const { user, checkLogin } = useUserStore();
    const [activeTab, setActiveTab] = useState<'vehicles' | 'items'>('vehicles');
    const [isLoading, setIsLoading] = useState(true);

    // 默认为 null，但在渲染时我们会回退到 DEFAULT_ASSETS
    const [assets, setAssets] = useState<UserAssetsData | null>(null);

    useEffect(() => {
        checkLogin();
    }, []);

    useEffect(() => {
        const fetchAssets = async () => {
            // 1. 如果没有登录，或者登录了但没绑定 license
            if (!user || !user.license) {
                setIsLoading(false);
                // 不做 return，让它继续向下运行，从而使用默认空数据渲染页面
                return;
            }

            try {
                const token = Cookies.get('auth_token');
                const res = await fetch(`${API_BASE_URL}/user/assets`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error("API Error");
                const json = await res.json();
                console.log(json);
                if (json.success) {
                    const decryptedData = decryptData(json.data);
                    setAssets(decryptedData);
                    toast.success("资产同步成功");
                } else {
                    toast.error("未找到角色数据");
                }
            } catch (error) {
                console.error("请求失败:", error);
                // 请求失败也不要让页面白屏，保持结构
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchAssets();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    // 计算最终用于渲染的数据
    const displayAssets = assets || DEFAULT_ASSETS;
    // 判断是否真的未绑定 (用于显示提示条)
    const isUnbound = !user?.license || !assets;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                <p>正在同步 FiveM 角色数据...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
            {/* ★★★ 关键修改：导航栏对齐修复 ★★★
         我们将 Navbar 包裹在 container 中，并添加 pt-4 px-4
         这样它就能和下面的卡片完美左对齐，复刻“图二”的效果
      */}
            {/*<div className="container mx-auto px-4 pt-4 max-w-5xl">*/}
            {/*    */}
            {/*</div>*/}
            {/*<div className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8 flex flex-col gap-6">*/}

            <main className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8 flex flex-col gap-6">
                <Navbar />
                {/* 未绑定提示横幅 (插在内容上方，不遮挡主体) */}
                {isUnbound && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 text-amber-800">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">未检测到游戏数据</p>
                                <p className="text-xs opacity-80">请在首页绑定游戏账号以查看实时资产，当前显示为预览模式。</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/home')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-amber-200"
                        >
                            <LinkIcon size={14} /> 去绑定
                        </button>
                    </div>
                )}

                {/* 顶部：用户信息 (即使是空数据也显示框架) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            {displayAssets.charinfo.firstname} {displayAssets.charinfo.lastname}
                            {displayAssets.is_online ? (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-bold border border-green-200">ONLINE</span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-xs font-bold border border-gray-300">OFFLINE</span>
                            )}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <IdCard size={14} /> CID: <span className="font-mono font-bold text-gray-700">{displayAssets.citizenid}</span>
                            <span className="text-gray-300">|</span>
                            <Smartphone size={14} /> {displayAssets.charinfo.phone}
                        </p>
                    </div>

                    <div className="flex gap-2 text-sm opacity-70">
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-400">出生日期</p>
                            <p className="font-medium text-gray-700">{displayAssets.charinfo.birthdate}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-400">国籍</p>
                            <p className="font-medium text-gray-700">{displayAssets.charinfo.nationality}</p>
                        </div>
                    </div>
                </div>

                {/* 1. 资产卡片区域 (显示 0 或 真实数据) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* 现金 */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 transition-transform hover:scale-[1.02]">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 opacity-80 mb-2 text-sm font-medium">
                                <Wallet size={18} /> 随身现金
                            </div>
                            <div className="text-3xl font-bold tracking-tight">
                                $ {displayAssets.money.cash.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* 银行 */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 transition-transform hover:scale-[1.02]">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 opacity-80 mb-2 text-sm font-medium">
                                    <CreditCard size={18} /> 银行存款
                                </div>
                                <span className="text-[10px] border border-white/30 px-1.5 py-0.5 rounded opacity-80">
                                    {displayAssets.charinfo.account !== "--" ? `ACC: ${displayAssets.charinfo.account}` : 'No Account'}
                                </span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight">
                                $ {displayAssets.money.bank.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* 加密货币 */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-200 transition-transform hover:scale-[1.02]">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 opacity-80 mb-2 text-sm font-medium">
                                <Bitcoin size={18} /> 加密货币
                            </div>
                            <div className="text-3xl font-bold tracking-tight font-mono">
                                {displayAssets.money.crypto.toLocaleString()} <span className="text-lg">QBit</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 标签页切换 */}
                <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-1">
                    <button
                        onClick={() => setActiveTab('vehicles')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative
              ${activeTab === 'vehicles' ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}
            `}
                    >
                        <Car size={18} /> 我的车库
                        {activeTab === 'vehicles' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('items')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative
              ${activeTab === 'items' ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}
            `}
                    >
                        <Package size={18} /> 我的背包
                        <span className="ml-1 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md text-[10px]">
                            {displayAssets.items.length}
                        </span>
                        {activeTab === 'items' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                        )}
                    </button>
                </div>

                {/* 3. 内容展示区域 */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* === 车辆列表 === */}
                    {/* === 车辆列表 === */}
                    {activeTab === 'vehicles' && (
                        displayAssets.vehicles.length > 0 ? (
                            // ★★★ 修改 1: 增加列数，让卡片变小 (2列 -> 3列 -> 4列 -> 5列) ★★★
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {displayAssets.vehicles.map((v: any, index: number) => (
                                    // ★★★ 修改 2: 减小内边距 p-4 -> p-2.5 ★★★
                                    <div key={index} className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm hover:shadow-md transition-all group hover:border-blue-200">
                                        {/* 图片容器 */}
                                        <div className="aspect-video bg-gray-50 rounded-lg mb-2.5 flex items-center justify-center text-gray-300 group-hover:bg-blue-50/50 transition-colors">
                                            {/* 如果有车辆图片 URL 可以在这里加 img，没有就显示图标 */}
                                            <Car size={28} className="group-hover:text-blue-400 transition-colors" />
                                        </div>

                                        {/* 车名 */}
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="font-bold text-gray-700 text-xs truncate" title={v.vehicle}>
                                                {v.vehicle}
                                            </h3>
                                        </div>

                                        {/* 底部信息：车牌 + 状态 */}
                                        <div className="flex justify-between items-center">
                                            {/* 车牌样式优化：模拟真实车牌颜色 */}
                                            <span className="bg-yellow-50 text-yellow-600 border border-yellow-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight">
                                                {v.plate}
                                            </span>

                                            {/* 状态显示 */}
                                            <span className={`text-[10px] font-medium ${v.state > 80 ? "text-green-500" : v.state > 50 ? "text-yellow-500" : "text-red-500"
                                                }`}>
                                                {v.state}%
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* 补齐空格子 (可选，为了布局对齐) */}
                                {/*{Array.from({ length: Math.max(0, 5 - (displayAssets.vehicles.length % 5)) }).map((_, i) => (*/}
                                {/*    <div key={`empty-car-${i}`} className="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 aspect-[4/3] opacity-50"></div>*/}
                                {/*))}*/}
                            </div>
                        ) : (
                            // 空状态保持一致
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                                <div className="p-3 bg-gray-50 rounded-full mb-3 text-gray-300">
                                    <Car size={24} />
                                </div>
                                <p className="text-gray-400 font-medium text-sm">暂无车辆数据</p>
                                {isUnbound && <p className="text-xs text-amber-500 mt-1">绑定后即可查看</p>}
                            </div>
                        )
                    )}

                    {/* === 物品背包 === */}
                    {/* === 物品背包 === */}
                    {activeTab === 'items' && (
                        displayAssets.items.length > 0 ? (
                            // ★★★ 修改点 1：调整 grid-cols，增加列数让格子变小 ★★★
                            // grid-cols-3 (手机一行3个) -> md:grid-cols-6 (平板一行6个) -> lg:grid-cols-8 (电脑一行8个)
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {displayAssets.items.map((item, index) => {
                                    const hasInfo = item.info && !Array.isArray(item.info) && Object.keys(item.info).length > 0;

                                    return (
                                        // ★★★ 修改点 2：减小内边距 p-3 -> p-2 ★★★
                                        <div key={index} className="group relative bg-white rounded-xl p-2 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-help">
                                            {/* 数量角标 (稍微调小一点字体) */}
                                            <div className="absolute top-1.5 right-1.5 bg-gray-50 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-100 z-10">
                                                x{item.amount}
                                            </div>

                                            {/* 图片 (保持宽高比，但因为容器小了，图也会自然变小) */}
                                            <div className="w-full aspect-square bg-gray-50/50 rounded-lg mb-2 flex items-center justify-center p-1.5 group-hover:bg-blue-50/30 transition-colors overflow-hidden">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Item";
                                                    }}
                                                />
                                            </div>

                                            {/* 物品名称 (字体改小一点) */}
                                            <div className="text-center h-4 flex items-center justify-center">
                                                <p className="font-bold text-[10px] text-gray-700 truncate w-full">{item.label}</p>
                                            </div>

                                            {/* 悬浮 Tooltip (保持不变) */}
                                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900/95 backdrop-blur-sm text-white text-[10px] p-3 rounded-xl shadow-xl
                                     bottom-[95%] left-1/2 -translate-x-1/2 pointer-events-none w-48 z-50 mb-2 border border-gray-700">
                                                {hasInfo ? (
                                                    <div className="space-y-1.5">
                                                        <div className="border-b border-gray-700 pb-1 mb-1 font-bold text-blue-400 text-xs flex items-center gap-1">
                                                            <Info size={10} /> 详细信息
                                                        </div>
                                                        {Object.entries(item.info).map(([key, value]) => (
                                                            <div key={key} className="flex justify-between items-start gap-2 leading-tight">
                                                                <span className="text-gray-400 capitalize shrink-0">{key.replace(/_/g, ' ')}:</span>
                                                                <span className="text-gray-100 font-mono text-right break-all">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-300 leading-relaxed text-center">{item.description || "暂无描述"}</p>
                                                )}
                                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-r border-b border-gray-700 rotate-45 transform"></div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* ★★★ 修改点 3：补齐空格子逻辑，模数改为 8 (对应 lg:grid-cols-8) ★★★ */}
                                {/*{Array.from({ length: Math.max(0, 8 - (displayAssets.items.length % 8)) }).map((_, i) => (*/}
                                {/*    // 这里的 aspect-square 确保空格子也是正方形*/}
                                {/*    <div key={`empty-${i}`} className="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 aspect-square"></div>*/}
                                {/*))}*/}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                                <div className="p-3 bg-gray-50 rounded-full mb-3 text-gray-300"><Package size={24} /></div>
                                <p className="text-gray-400 font-medium text-sm">背包是空的</p>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}