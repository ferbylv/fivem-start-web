"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Loader2, Search, Filter, ChevronLeft, ChevronRight, FileText, CheckCircle2, XCircle, Clock, ShoppingBag, Crown, PackageCheck, Package, PackageX } from "lucide-react";
import toast from "react-hot-toast";

interface Order {
    id: string;
    userId: number;
    userNickname: string;
    type: "subscription" | "product";
    itemName: string;
    amount: number;
    status: "completed" | "pending" | "failed";
    isDelivered?: boolean; // New field
    createdAt: string;
}

export default function OrderManager() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("auth_token");
            const query = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                search: searchTerm,
                status: statusFilter !== "all" ? statusFilter : ""
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders?${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.success) {
                setOrders(json.data.list);
                setTotalPages(json.data.totalPages || 1);
            } else {
                toast.error("加载订单失败");
            }
        } catch (err) {
            console.error(err);
            toast.error("网络请求错误");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]); // Refresh when page or filter changes

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) fetchOrders();
            else setPage(1); // will trigger above effect
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-green-100 text-green-700";
            case "pending": return "bg-amber-100 text-amber-700";
            case "failed": return "bg-red-100 text-red-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "completed": return "已完成";
            case "pending": return "待支付";
            case "failed": return "失败";
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">订单管理</h2>
                    <p className="text-slate-400 text-sm">查看全站交易记录</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm w-full md:w-64"
                            placeholder="搜索订单号或用户..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">全部状态</option>
                            <option value="completed">已完成</option>
                            <option value="pending">待支付</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">订单编号</th>
                                <th className="p-4 font-bold">用户</th>
                                <th className="p-4 font-bold">商品 / 类型</th>
                                <th className="p-4 font-bold">金额</th>
                                <th className="p-4 font-bold">状态</th>
                                <th className="p-4 font-bold">发货</th>
                                <th className="p-4 font-bold">时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <Loader2 className="animate-spin text-slate-300 mx-auto" size={32} />
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400">
                                        暂无订单记录
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-sm font-mono text-slate-600">#{order.id}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-sm">{order.userNickname}</span>
                                                <span className="text-[10px] text-slate-400">ID: {order.userId}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${order.type === 'subscription' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {order.type === 'subscription' ? <Crown size={14} /> : <ShoppingBag size={14} />}
                                                </div>
                                                <span className="text-sm text-slate-700 font-medium">{order.itemName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">
                                            {order.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">金币</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                {order.status === 'completed' && <CheckCircle2 size={12} />}
                                                {order.status === 'pending' && <Clock size={12} />}
                                                {order.status === 'failed' && <XCircle size={12} />}
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {/* Delivery Status */}
                                            {order.status === 'completed' ? (
                                                order.isDelivered ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-md">
                                                        <PackageCheck size={14} />
                                                        已发货
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium bg-slate-50 px-2 py-1 rounded-md">
                                                        <Package size={14} />
                                                        未发货
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {order.createdAt}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
                    <span className="text-xs text-slate-400">
                        第 {page} 页 / 共 {totalPages} 页
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
