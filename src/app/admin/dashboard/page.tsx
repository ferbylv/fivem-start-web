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
    ChevronRight
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import StoreManager from "@/components/admin/StoreManager";
import AnnouncementManager from "@/components/admin/AnnouncementManager";
import BannerManager from "@/components/admin/BannerManager";
import UserManager from "@/components/admin/UserManager";
import Cookies from "js-cookie";

const Overview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        totalSales: 0,
        onlineCount: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = Cookies.get("auth_token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) setStats(json.data);
            } catch (err) {
                console.error("Fetch stats failed", err);
                toast.error("无法加载仪表盘数据");
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-slate-400 text-sm font-medium">总注册用户</h4>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-slate-400 text-sm font-medium">今日活跃</h4>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activeToday.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-slate-400 text-sm font-medium">总销售额 (金币)</h4>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-slate-400 text-sm font-medium">当前在线</h4>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.onlineCount.toLocaleString()}</p>
            </div>
            <div className="col-span-full bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center text-blue-800">
                欢迎回到管理后台！请从左侧菜单选择要管理的项目。
            </div>
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

        if (user.isAdmin !== true && user.isSuperAdmin !== true) {
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
        { id: "announcements", label: "公告管理", icon: Megaphone, show: hasPermission("announcement") },
        { id: "banners", label: "轮播图管理", icon: ImageIcon, show: hasPermission("banner") },
        { id: "users", label: "用户管理", icon: Users, show: hasPermission("users") },
    ].filter(item => item.show);
    console.log(menuItems);
    const renderContent = () => {
        switch (activeTab) {
            case "store": return <StoreManager />;
            case "announcements": return <AnnouncementManager />;
            case "banners": return <BannerManager />;
            case "users": return <UserManager />;
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
                        <span className="font-bold text-slate-800 text-lg">More Admin</span>
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
