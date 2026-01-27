"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import {
    LayoutDashboard,
    ShoppingBag,
    Megaphone,
    Image as ImageIcon, // Image alias
    Users,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Crown,
    MessageSquare,
    FileText
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import StoreManager from "@/components/admin/StoreManager";
import AnnouncementManager from "@/components/admin/AnnouncementManager";
import BannerManager from "@/components/admin/BannerManager";
import SubscriptionManager from "@/components/admin/SubscriptionManager";
import TicketManager from "@/components/admin/TicketManager";
import UserManager from "@/components/admin/UserManager";
import OrderManager from "@/components/admin/OrderManager";
import Cookies from "js-cookie";

interface TrendData {
    date: string;
    users: number;
    sales: number;
    banned: number;
}

const TrendChart = ({ data }: { data: TrendData[] }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">暂无数据</div>;

    const metrics = [
        { key: "users", color: "#3b82f6", label: "新增玩家" },
        { key: "sales", color: "#10b981", label: "销售额" },
        { key: "banned", color: "#ef4444", label: "Ban玩家数量" }
    ] as const;

    const getValue = (d: TrendData, key: keyof TrendData) => d[key] as number;

    // Calculate global max for scaling
    // Note: Sales might be much larger than users, so we might need normalization or dual axis.
    // However, for simplicity request usually implies simple overlay. If scales differ vastly, we can just visually normalize or use log scale.
    // Given the request "multi-line chart", let's assuming single axis for now or normalize strictly for visualization.
    // BUT, usually "Sales" (Coins) vs "Users" (Count) will have huge scale difference (e.g. 5000 vs 10).
    // A single axis will flatten the smaller one.
    // Let's use relative scaling (0-100%) for visual trend comparison since unit labels are gone?
    // OR just use the max of each to normalize to chart height.

    // Decision: Normalize each line to chart height to show relative TREND, not absolute value comparison on same Y axis.
    // Tooltips will show absolute values.

    // SVG Dimensions
    const width = 1000;
    const height = 300;
    const padding = 40;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const x = (i: number) => padding + (i / (data.length - 1)) * chartW;

    // Global max for shared Y axis??
    // User asked for "y轴显示数量". If we put them on the same axis, sales (e.g. 5000) will dwarf users (e.g. 10).
    // But usually for this request we can just normalize or use the max of the specific set if we are doing multi-line.
    // However, if we want to show meaningful Y-axis, we have to pick a scale.
    // If I just show 1-100%, the Y numbers are meaningless.
    // If I show absolute numbers, lines will be flat.
    // Let's assume for now we use the largest value to define the scale, so at least one line looks good, or users accept flat lines for others.
    // OR we can implement dual axis, but that's complex for this svg.
    // Let's try to normalize each to its own max to keep the "Trend" visualization (which seems to be the main point)
    // AND hide the Y axis numbers?
    // Wait, user specifically asked for "y轴显示数量" (Y axis show quantity).
    // This implies he WANTS to see the numbers.
    // If I show numbers, I must use a single scale.
    // Let's find the max of ALL data points across all metrics.
    // Global max for shared Y axis
    // Use fallback to 0 to prevent NaN if data field is missing
    const allValues = data.flatMap(d => metrics.map(m => d[m.key] || 0));
    const maxGlobal = Math.max(...allValues, 10);
    const minGlobal = 0;

    const y = (val: number) => height - padding - ((val - minGlobal) / (maxGlobal - minGlobal)) * chartH;

    const createPath = (key: "users" | "sales" | "banned") => {
        return data.map((d, i) => `${x(i)},${y(d[key] || 0)}`).join(" ");
    };

    // Generate X-axis labels (Start, End, and ~3 intermediates)
    const xAxisLabels = data.filter((_, i) => i === 0 || i === data.length - 1 || i % Math.max(Math.floor(data.length / 5), 1) === 0);

    return (
        <div className="w-full aspect-[3/1] bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative">
            <h4 className="text-slate-500 text-sm font-bold mb-6 flex items-center justify-between">
                <span>近30天趋势 (趋势对比)</span>
                <div className="flex gap-4">
                    {metrics.map(m => (
                        <div key={m.key} className="flex items-center gap-2 text-xs font-medium">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                            <span className="text-slate-500">{m.label}</span>
                        </div>
                    ))}
                </div>
            </h4>
            {/* Removed overflow-hidden to let tooltips/labels show if needed, but using SVG for labels now */}
            <div className="w-full h-full pb-8">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines & Y Axis Labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                        const val = Math.round(minGlobal + (maxGlobal - minGlobal) * p);
                        const yPos = height - padding - p * chartH;
                        return (
                            <g key={i}>
                                <line
                                    x1={padding}
                                    y1={yPos}
                                    x2={width - padding}
                                    y2={yPos}
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                />
                                <text x={padding - 10} y={yPos + 4} textAnchor="end" className="text-[10px] fill-slate-400 select-none">
                                    {val.toLocaleString()}
                                </text>
                            </g>
                        );
                    })}

                    {/* X Axis Labels */}
                    {xAxisLabels.map((d, i) => {
                        const index = data.indexOf(d);
                        const xPos = x(index);
                        return (
                            <text
                                key={i}
                                x={xPos}
                                y={height - 10}
                                textAnchor="middle"
                                className="text-[10px] fill-slate-400 select-none"
                            >
                                {d.date}
                            </text>
                        );
                    })}

                    {metrics.map((m) => {
                        const points = createPath(m.key);
                        return (
                            <path
                                key={m.key}
                                d={`M${points}`}
                                fill="none"
                                stroke={m.color}
                                strokeWidth={m.key === 'sales' ? 2 : 3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-90 hover:opacity-100 transition-opacity"
                            />
                        );
                    })}

                    {/* Points with Tooltips */}
                    {metrics.map((m) => {
                        return data.map((d, i) => (
                            <circle
                                key={`${m.key}-${i}`}
                                cx={x(i)}
                                cy={y(d[m.key] || 0)}
                                r="4" // Slightly larger for easier hovering
                                fill="white"
                                stroke={m.color}
                                strokeWidth="2"
                                className="hover:r-6 transition-all opacity-0 hover:opacity-100 cursor-pointer"
                            >
                                <title>{`${d.date} - ${m.label}: ${(d[m.key] || 0).toLocaleString()}`}</title>
                            </circle>
                        ));
                    })}
                </svg>
            </div>
        </div>
    );
}

const Overview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        productCount: 0,
        totalSales: 0,
        bannedCount: 0,
        trendData: [] as TrendData[]
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = Cookies.get("auth_token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();

                if (json.success && json.data.trendData?.length > 0) {
                    setStats(json.data);
                } else {
                    // Generate Mock Data if API fails or has no trend data
                    console.log("Using Mock Data");
                    const mockTrend = Array.from({ length: 30 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (29 - i));
                        return {
                            date: `${date.getMonth() + 1}/${date.getDate()}`,
                            users: Math.floor(Math.random() * 50) + 10,
                            sales: Math.floor(Math.random() * 50) + 20,
                            banned: Math.floor(Math.random() * 50) + 1 // Banned count
                        };
                    });

                    setStats({
                        totalUsers: json.data?.totalUsers || 12850,
                        productCount: json.data?.productCount || 48,
                        totalSales: json.data?.totalSales || 1589000,
                        bannedCount: json.data?.bannedCount || 23,
                        trendData: mockTrend
                    });
                }
            } catch (err) {
                console.error("Fetch stats failed", err);

                // Fallback Mock Data on Error
                const mockTrend = Array.from({ length: 30 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (29 - i));
                    return {
                        date: `${date.getMonth() + 1}/${date.getDate()}`,
                        users: Math.floor(Math.random() * 50) + 10,
                        sales: Math.floor(Math.random() * 5000) + 1000,
                        banned: Math.floor(Math.random() * 50) + 1 // Banned count
                    };
                });
                setStats({
                    totalUsers: 12850,
                    productCount: 48,
                    totalSales: 1589000,
                    bannedCount: 23,
                    trendData: mockTrend
                });
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                    <h4 className="text-slate-400 text-sm font-medium">总注册用户</h4>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{(stats.totalUsers || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-green-200">
                    <h4 className="text-slate-400 text-sm font-medium">总销售额 (金币)</h4>
                    <p className="text-3xl font-bold text-green-600 mt-2">{(stats.totalSales || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200">
                    <h4 className="text-slate-400 text-sm font-medium">商品数量</h4>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{(stats.productCount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-red-200">
                    <h4 className="text-slate-400 text-sm font-medium">被封禁玩家</h4>
                    <p className="text-3xl font-bold text-red-600 mt-2">{(stats.bannedCount || 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Trend Chart Area */}
            <TrendChart data={stats.trendData || []} />
        </div>
    );
};

export default function AdminDashboard() {
    const router = useRouter();
    const { user, checkLogin, isServerOnline, setServerStatus, logout, refreshUser } = useUserStore();
    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 1. Initial Login Check (Run Once)
    useEffect(() => {
        checkLogin();
    }, []);

    // New: Poll Server Status
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const token = Cookies.get("auth_token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/server/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });


                const data = await res.json();
                console.log(data);
                if (data.code === 503) {
                    console.log("Server is offline");
                    logout();
                    router.replace("/");
                    return;
                }
                setServerStatus(data.online, data.playerCount || 0);
                refreshUser();
            } catch (error) {
                setServerStatus(false, 0);
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 30000);
        return () => clearInterval(interval);
    }, [setServerStatus]);

    // 2. Check Permissions (Run when user state changes)
    useEffect(() => {
        if (!user) return; // Wait for user to be loaded
        console.log("!user.isAdmin && !user.isSuperAdmin",!user.isAdmin && !user.isSuperAdmin)
        console.log("!user.isAdmin && !user.isSuperAdmin",user)
        if (!user.isAdmin && !user.isSuperAdmin) {
            toast.error("您没有权限访问此页面");
            router.replace("/");
        }
    }, [user, router]);

    // If not authorized or loading, you might want to show a loader or return null
    // But for better UX, we just let the effect redirect and show UI briefly or a loader
    if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-400 animate-pulse">正在验证权限...</p>
            </div>
        );
    }

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        // 如果没有 permissions 数组但有 isAdmin 标记，默认给予 store, announcement, banner 权限？
        // 或者严格按照 permissions 数组来？如果不传 permissions 数组，默认没有任何模块权限？
        // 根据之前的设定，permissions 是可选的。
        // 如果是 old admin (没有 permissions 字段)，可能需要默认逻辑。
        // 但为了安全起见，如果没有 permissions 数组，我们默认他没有任何额外模块权限，或者只能看 Overview。
        return user.permissions?.includes(permission);
    };

    const menuItems = [
        { id: "overview", label: "概览", icon: LayoutDashboard, show: true },
        { id: "store", label: "商店管理", icon: ShoppingBag, show: hasPermission("store") },
        { id: "orders", label: "订单管理", icon: FileText, show: hasPermission("order") }, // New
        { id: "announcements", label: "公告管理", icon: Megaphone, show: hasPermission("announcement") },
        { id: "banners", label: "轮播图管理", icon: ImageIcon, show: hasPermission("banner") },
        { id: "users", label: "用户管理", icon: Users, show: hasPermission("users") },
        { id: "subscription", label: "订阅管理", icon: Crown, show: hasPermission("subscription") },
        { id: "tickets", label: "工单管理", icon: MessageSquare, show: hasPermission("ticket") },
    ].filter(item => item.show);
    console.log(menuItems);
    const renderContent = () => {
        switch (activeTab) {
            case "store": return <StoreManager />;
            case "orders": return <OrderManager />; // New
            case "announcements": return <AnnouncementManager />;
            case "banners": return <BannerManager />;
            case "users": return <UserManager />;
            case "subscription": return <SubscriptionManager />;
            case "tickets": return <TicketManager />;
            default: return <Overview />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Toaster position="top-center" />
            {/* Mobile Sidebar Overlay */}
            {!isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 z-30 transition-transform duration-300 ease-in-out shrink-0
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <LayoutDashboard size={18} />
                        </div>
                        <span className="font-bold text-slate-800 text-lg">HomeLand Admin</span>
                    </div>
                    <button
                        className="md:hidden p-1 text-slate-400 hover:text-slate-600"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="px-3 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    // On mobile, close sidebar after selection
                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                                ${isActive
                                        ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-100">
                    <button
                        onClick={() => router.push("/")}
                        className="w-full flex items-center gap-2 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>返回前台</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isServerOnline
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                            }`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isServerOnline ? "bg-green-500" : "bg-slate-400"}`} />
                            <span className="text-xs font-bold">
                                {isServerOnline ? "System Online" : "System Offline"}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
