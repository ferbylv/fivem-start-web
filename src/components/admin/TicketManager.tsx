"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Search, CheckCircle2, Circle, Loader2, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function TicketManager() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [ticketDetail, setTicketDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [replying, setReplying] = useState(false);

    // Fetch Tickets
    const fetchTickets = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setTickets(json.data);
        } catch (err) {
            console.error(err);
            toast.error("加载工单失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Load Detail
    const openTicket = async (id: number) => {
        setSelectedTicketId(id);
        setDetailLoading(true);
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${id}`, {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${selectedTicketId}/reply`, {
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
                openTicket(selectedTicketId); // Refresh detail
                fetchTickets(); // Refresh list status
            } else {
                toast.error(json.message || "回复失败");
            }
        } catch (err) {
            toast.error("请求错误");
        } finally {
            setReplying(false);
        }
    };

    // Close Ticket
    // Close Ticket
    const handleCloseTicket = () => {
        if (!selectedTicketId) return;

        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-800">确认要关闭此工单吗？</span>
                <span className="text-xs text-slate-500">关闭后将无法继续回复</span>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const token = Cookies.get("auth_token");
                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${selectedTicketId}/close`, {
                                    method: "POST",
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                const json = await res.json();
                                if (json.success) {
                                    toast.success("工单已关闭");
                                    openTicket(selectedTicketId);
                                    fetchTickets();
                                } else {
                                    toast.error("操作失败");
                                }
                            } catch (err) {
                                toast.error("请求错误");
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600"
                    >
                        确认关闭
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200"
                    >
                        取消
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: "top-center"
        });
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
            {/* List Sidebar */}
            <div className="w-full md:w-1/3 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">工单列表</h3>
                    <p className="text-xs text-slate-400">共 {tickets.length} 个工单</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {tickets.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => openTicket(t.id)}
                                    className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${selectedTicketId === t.id ? "bg-blue-50/50 border-l-4 border-blue-500" : "border-l-4 border-transparent"}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-medium text-sm line-clamp-1 ${selectedTicketId === t.id ? "text-blue-700" : "text-slate-800"}`}>{t.title}</h4>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${t.status === "open" ? "bg-green-100 text-green-600" :
                                            t.status === "replied" ? "bg-amber-100 text-amber-600" :
                                                "bg-gray-100 text-slate-400"
                                            }`}>
                                            {t.status === "open" ? "待处理" : t.status === "replied" ? "已回复" : "已关闭"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                                        <span>User #{t.userId}</span>
                                        <span>{t.createdAt}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail View */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
                {selectedTicketId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800">{ticketDetail?.title}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{ticketDetail?.type}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    用户: {ticketDetail?.userNickname} (ID: {ticketDetail?.userId}) • 时间: {ticketDetail?.createdAt}
                                </p>
                            </div>
                            {ticketDetail?.status !== "closed" && (
                                <button
                                    onClick={handleCloseTicket}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:border-red-200 hover:text-red-500 transition-colors"
                                >
                                    关闭工单
                                </button>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                            {detailLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : (
                                ticketDetail?.messages?.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                                        <div className={`flex flex-col ${msg.sender === "admin" ? "items-end" : "items-start"} max-w-[85%]`}>
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className="text-xs font-bold text-slate-400">
                                                    {msg.sender === "admin" ? "管理员" : ticketDetail?.userNickname}
                                                </span>
                                                <span className="text-[10px] text-slate-300">{msg.time}</span>
                                            </div>
                                            <div className={`rounded-2xl p-4 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === "admin"
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Reply Input */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="输入回复内容..."
                                    disabled={replying || ticketDetail?.status === "closed"}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                                    onKeyDown={(e) => e.key === "Enter" && handleReply()}
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={replying || !replyContent.trim() || ticketDetail?.status === "closed"}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-100 flex items-center gap-2 font-bold text-sm"
                                >
                                    {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    回复
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare size={48} className="mb-4 text-slate-200" />
                        <p>请选择左侧工单查看详情</p>
                    </div>
                )}
            </div>
        </div>
    );
}
