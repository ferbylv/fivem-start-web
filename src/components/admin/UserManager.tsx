"use client";

import { useState, useEffect } from "react";
import { Search, Shield, Ban, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function UserManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?q=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setUsers(json.data);
        } catch (err) {
            console.error(err);
            toast.error("无法加载用户列表");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleBan = async (id: number) => {
        if (!confirm("确定要封禁该用户吗？")) return;
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/ban`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(users.map(u => u.id === id ? { ...u, status: "banned" } : u));
                toast.success("用户已封禁");
            } else {
                toast.error(json.message || "操作失败");
            }
        } catch (err) {
            toast.error("请求错误");
        }
    };

    const handleUnban = async (id: number) => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/unban`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(users.map(u => u.id === id ? { ...u, status: "active" } : u));
                toast.success("用户已解封");
            } else {
                toast.error(json.message || "操作失败");
            }
        } catch (err) {
            toast.error("请求错误");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">用户管理</h3>
                    <p className="text-slate-500 text-sm">查看注册用户与权限管理</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <Search size={20} className="text-slate-400 ml-2" />
                <input
                    type="text"
                    placeholder="搜索手机号或昵称..."
                    className="flex-1 outline-none text-sm p-2 bg-transparent text-slate-800 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">用户信息</th>
                                <th className="px-6 py-4">权限</th>
                                <th className="px-6 py-4">状态</th>
                                <th className="px-6 py-4">注册时间</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-400">#{u.id}</td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-slate-800">{u.nickname}</p>
                                            <p className="text-xs text-slate-400">{u.phone}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.isAdmin ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs font-bold">
                                                <Shield size={10} /> 管理员
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 text-xs">普通用户</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.status === "active" ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                                                <CheckCircle2 size={10} /> 正常
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                                                <Ban size={10} /> 封禁
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{u.joinDate}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {u.status === "active" ? (
                                                <button
                                                    onClick={() => handleBan(u.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="封禁"
                                                >
                                                    <Ban size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnban(u.id)}
                                                    className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                                                    title="解封"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
