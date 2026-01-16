"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { MessageSquare, Plus, Clock, CheckCircle2, XCircle, Search, ChevronLeft, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/userStore";

import Navbar from "@/components/Navbar";

interface Ticket {
    id: number;
    title: string;
    status: "open" | "replied" | "closed";
    type: string;
    createdAt: string;
}

interface TicketMessage {
    sender: "user" | "admin";
    content: string;
    time: string;
}

interface TicketDetail extends Ticket {
    messages: TicketMessage[];
}

export default function TicketPage() {
    const router = useRouter();
    const { user } = useUserStore();

    // States
    const [view, setView] = useState<"list" | "detail">("list");
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: "", type: "bug", content: "" });
    const [creating, setCreating] = useState(false);

    // Detail View
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [replying, setReplying] = useState(false);

    // Fetch Lists
    const fetchTickets = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticket/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setTickets(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.userId) fetchTickets();
    }, [user?.userId]);

    // Create Ticket
    const handleCreateTicket = async () => {
        if (!newTicket.title || !newTicket.content) return toast.error("请填写完整信息");
        setCreating(true);
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticket/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newTicket)
            });
            const json = await res.json();
            if (json.success) {
                toast.success("工单已提交");
                setIsCreateModalOpen(false);
                setNewTicket({ title: "", type: "bug", content: "" });
                fetchTickets();
            } else {
                toast.error(json.message || "提交失败");
            }
        } catch (err) {
            toast.error("请求错误");
        } finally {
            setCreating(false);
        }
    };

    // Load Detail
    const openTicket = async (id: number) => {
        setSelectedTicketId(id);
        setView("detail");
        setDetailLoading(true);
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticket/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setTicketDetail(json.data);
            else toast.error("无法加载详情");
        } catch (err) {
            toast.error("加载失败");
        } finally {
            setDetailLoading(false);
        }
    };

    // Reply
    const handleReply = async () => {
        if (!replyContent.trim() || !selectedTicketId) return;
        setReplying(true);
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticket/${selectedTicketId}/reply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: replyContent })
            });
            const json = await res.json();
            if (json.success) {
                toast.success("回复成功");
                setReplyContent("");
                // Refresh detail
                openTicket(selectedTicketId);
            } else {
                toast.error(json.message || "回复失败");
            }
        } catch (err) {
            toast.error("请求错误");
        } finally {
            setReplying(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 text-white rounded-lg">去登录</button>
            </div>
        );
    }



    // ...

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <div className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8 flex flex-col gap-6">
                <Navbar />

                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className="text-blue-500" />
                            工单支持
                        </h1>
                        <p className="text-slate-500">遇到问题？提交工单联系管理员</p>
                    </div>
                    {view === "list" && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-colors font-bold text-sm active:scale-95"
                        >
                            <Plus size={18} />
                            <span>提交工单</span>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div>
                    {view === "list" ? (
                        // --- List View ---
                        loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 bg-gray-50 rounded-[24px] border border-gray-100 border-dashed">
                                暂无工单记录
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => openTicket(t.id)}
                                        className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${t.status === "open" ? "bg-green-100 text-green-700" :
                                                    t.status === "replied" ? "bg-blue-100 text-blue-700" :
                                                        "bg-gray-100 text-gray-500"
                                                    }`}>
                                                    {t.status === "open" && <CheckCircle2 size={12} />}
                                                    {t.status === "open" ? "待处理" : t.status === "replied" ? "已回复" : "已关闭"}
                                                </span>
                                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                                                    {t.title}
                                                </h3>
                                            </div>
                                            <div className="text-xs text-slate-400 flex items-center gap-3">
                                                <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">#{t.id}</span>
                                                <span>•</span>
                                                <span>类型: {t.type}</span>
                                                <span>•</span>
                                                <span>{t.createdAt}</span>
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <ChevronLeft size={20} className="rotate-180" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // --- Detail View ---
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[650px]">
                            {/* Detail Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                                <button onClick={() => setView("list")} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 transition-all">
                                    <ChevronLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        {detailLoading ? "加载中..." : ticketDetail?.title}
                                    </h2>
                                    <p className="text-xs text-slate-400">工单编号 #{selectedTicketId}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticketDetail?.status === "open" ? "bg-green-100 text-green-600" : "bg-gray-100 text-slate-500"
                                        }`}>
                                        {ticketDetail?.status === "open" ? "待处理" : ticketDetail?.status === "replied" ? "已回复" : "已关闭"}
                                    </span>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                                {detailLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                                ) : (
                                    ticketDetail?.messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                            <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                                                <div className={`rounded-2xl p-4 shadow-sm ${msg.sender === "user"
                                                    ? "bg-blue-600 text-white rounded-tr-none"
                                                    : "bg-gray-50 text-slate-700 border border-gray-100 rounded-tl-none"
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                                <span className="text-[10px] text-slate-300 mt-1.5 px-1">{msg.time}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Reply Input */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="输入回复内容..."
                                        disabled={replying || ticketDetail?.status === "closed"}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-blue-400 focus:bg-white transition-all text-sm"
                                        onKeyDown={(e) => e.key === "Enter" && handleReply()}
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={replying || !replyContent.trim() || ticketDetail?.status === "closed"}
                                        className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-100"
                                    >
                                        {replying ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">提交工单</h3>
                                <p className="text-slate-400 text-sm mt-1">我们将尽快回复您的疑问</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 -mr-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                                <XCircle size={28} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">标题</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                                    placeholder="简要描述问题..."
                                    value={newTicket.title}
                                    onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">问题类型</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none font-medium"
                                        value={newTicket.type}
                                        onChange={e => setNewTicket({ ...newTicket, type: e.target.value })}
                                    >
                                        <option value="bug">🐛 漏洞反馈 (Bug)</option>
                                        <option value="account">👤 账号问题</option>
                                        <option value="payment">💎 充值问题</option>
                                        <option value="other">📝 其他建议</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronLeft size={16} className="-rotate-90" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">详细描述</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[140px] font-medium resize-none"
                                    placeholder="请详细描述您遇到的问题..."
                                    value={newTicket.content}
                                    onChange={e => setNewTicket({ ...newTicket, content: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleCreateTicket}
                                disabled={creating}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                <span>提交反馈</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
