"use client";

import { useState, useEffect } from "react";
import { Search, Shield, Ban, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useUserStore } from "@/store/userStore";

export default function UserManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const { user: currentUser } = useUserStore();

    // Permission Modal State
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const PERMISSION_OPTIONS = [
        { key: "store", label: "商品管理" },
        { key: "announcement", label: "公告管理" },
        { key: "banner", label: "轮播图管理" },
        { key: "users", label: "用户管理" },
    ];

    const openPermissionModal = (user: any) => {
        setSelectedUser(user);
        // Load existing permissions if they exist, or default to empty
        setSelectedPermissions(user.permissions || []);
        setIsPermModalOpen(true);
    };

    const togglePermission = (key: string) => {
        if (selectedPermissions.includes(key)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== key));
        } else {
            setSelectedPermissions([...selectedPermissions, key]);
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;

        try {
            const token = Cookies.get("auth_token");
            // Determine endpoint based on whether we are granting or updating
            // Actually, we can reuse grant or use a new update endpoint. 
            // Let's use grant/update unified logic or specific.
            // Requirement said "Grant Admin" or "Revoke".
            // If user is NOT admin, we are Granting. If user IS admin, we are Updating.

            const endpoint = selectedUser.isAdmin
                ? `/admin/users/${selectedUser.id}/permissions`
                : `/admin/users/${selectedUser.id}/grant-admin`;

            const method = selectedUser.isAdmin ? "PUT" : "POST";

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ permissions: selectedPermissions })
            });
            const json = await res.json();

            if (json.success) {
                // Update local state
                setUsers(users.map(u => u.id === selectedUser.id ? {
                    ...u,
                    isAdmin: true, // Ensure they are admin now
                    permissions: selectedPermissions
                } : u));

                toast.success(selectedUser.isAdmin ? "权限已更新" : "已设为管理员");
                setIsPermModalOpen(false);
            } else {
                toast.error(json.message || "操作失败");
            }
        } catch (err) {
            toast.error("请求错误");
        }
    };

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

    const handleGrantAdmin = async (id: number) => {
        if (!confirm("确定要将该用户设为管理员吗？")) return;
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/grant-admin`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(users.map(u => u.id === id ? { ...u, isAdmin: true } : u));
                toast.success("已设为管理员");
            } else {
                toast.error(json.message || "操作失败");
            }
        } catch (err) {
            toast.error("请求错误");
        }
    };

    const handleRevokeAdmin = async (id: number) => {
        if (!confirm("确定要取消该用户的管理员权限吗？")) return;
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/revoke-admin`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(users.map(u => u.id === id ? { ...u, isAdmin: false } : u));
                toast.success("已取消管理员权限");
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
                                        {u.isSuperAdmin ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-600 rounded text-xs font-bold">
                                                <Shield size={10} /> 超级管理员
                                            </span>
                                        ) : u.isAdmin ? (
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
                                            {/* Only Super Admin (current user) can manage other admins */}
                                            {/* Super Admin accounts cannot be managed via UI */}
                                            {currentUser?.isSuperAdmin && !u.isSuperAdmin && (
                                                <>
                                                    {u.isAdmin ? (
                                                        <>
                                                            <button
                                                                onClick={() => openPermissionModal(u)}
                                                                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                            >
                                                                修改权限
                                                            </button>
                                                            <button
                                                                onClick={() => handleRevokeAdmin(u.id)}
                                                                className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors ml-2"
                                                            >
                                                                取消管理
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => openPermissionModal(u)}
                                                            className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                                                        >
                                                            设为管理
                                                        </button>
                                                    )}
                                                    <div className="w-px h-4 bg-slate-200 mx-1" />
                                                </>
                                            )}

                                            {/* User Status Actions */}
                                            {/* Logic: 
                                                1. Super Admin: Can ban anyone except themselves.
                                                2. Admin: Can only ban regular users (not other admins or super admins).
                                            */}
                                            {(() => {
                                                // Prevent self-ban
                                                if (currentUser?.userId === u.id) return null;

                                                // Determine if action is allowed
                                                // Note: u.id is generally a number, ensure type compatibility
                                                // If currentUser.userId is string, need conversion if matching.
                                                // Let's assume types are consistent or use loose equality if unsure.
                                                // Actually u.id is number in previous code usage.

                                                let canBan = false;
                                                if (currentUser?.isSuperAdmin) {
                                                    // Super Admin can ban anyone (except self, handled above)
                                                    canBan = true;
                                                } else if (currentUser?.isAdmin) {
                                                    // Regular Admin can only ban non-admins
                                                    if (!u.isAdmin && !u.isSuperAdmin) {
                                                        canBan = true;
                                                    }
                                                }

                                                if (!canBan) return null;

                                                return u.status === "active" ? (
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
                                                );
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Permission Modal */}
            {isPermModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPermModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {selectedUser.isAdmin ? "修改权限" : "设置管理员"}
                            </h3>
                            <button onClick={() => setIsPermModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-slate-500 mb-3">
                                请选择 <strong>{selectedUser.nickname}</strong> 可以访问的后台模块：
                            </p>
                            <div className="space-y-2">
                                {PERMISSION_OPTIONS.map(opt => (
                                    <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedPermissions.includes(opt.key)}
                                            onChange={() => togglePermission(opt.key)}
                                        />
                                        <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSavePermissions}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            保存设置
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
