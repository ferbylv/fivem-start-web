/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Crown, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function SubscriptionManager() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    // Form Stats
    const [formData, setFormData] = useState({ name: "", price: "", duration: "", description: "" });

    // Fetch Plans
    const fetchPlans = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subscription/plans`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setPlans(json.data);
        } catch (err) {
            console.error(err);
            toast.error("加载订阅方案失败");
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (plan?: any) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                price: plan.price,
                duration: plan.duration,
                description: plan.description
            });
        } else {
            setEditingPlan(null);
            setFormData({ name: "", price: "", duration: "30", description: "" });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确定要删除这个订阅方案吗？")) return;

        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/subscription/plans/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setPlans(plans.filter(p => p.id !== id));
                toast.success("方案已删除");
            } else {
                toast.error(json.message || "删除失败");
            }
        } catch (err) {
            toast.error("操作失败");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = Cookies.get("auth_token");
        const url = editingPlan
            ? `${process.env.NEXT_PUBLIC_API_URL}/admin/subscription/plans/${editingPlan.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/admin/subscription/plans`;
        const method = editingPlan ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    duration: Number(formData.duration)
                })
            });
            const json = await res.json();

            if (json.success) {
                toast.success(editingPlan ? "方案更新成功" : "方案创建成功");
                setIsModalOpen(false);
                fetchPlans(); // Refresh List
            } else {
                toast.error(json.message || "操作失败");
            }
        } catch (err) {
            toast.error("网络请求错误");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">订阅管理</h3>
                    <p className="text-slate-500 text-sm">管理会员订阅方案与价格</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 text-sm font-bold"
                >
                    <Plus size={18} /> 新增方案
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                                <Crown size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-slate-800">{plan.price}</p>
                                <p className="text-xs text-slate-400">金币 / {plan.duration}天</p>
                            </div>
                        </div>

                        <h4 className="font-bold text-lg text-slate-800 mb-2">{plan.name}</h4>
                        <div className="text-slate-500 text-sm flex-1 prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: plan.description }} />

                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleOpenModal(plan)}
                                className="p-2 bg-slate-50 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="p-2 bg-slate-50 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-xl font-bold">{editingPlan ? "编辑方案" : "新增订阅方案"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">方案名称</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="例如：月度会员"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">价格 (金币)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">时长 (天)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-[300px]">
                                <label className="block text-sm font-medium text-slate-700 mb-1">权益描述 (富文本)</label>
                                <div className="flex-1 bg-white">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.description}
                                        onChange={(value) => setFormData({ ...formData, description: value })}
                                        className="h-full flex flex-col min-h-[300px]"
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, false] }],
                                                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                                                ['link', 'clean']
                                            ],
                                        }}
                                    />
                                </div>
                                <style jsx global>{`
                                    .quill {
                                        display: flex;
                                        flex-direction: column;
                                        height: 100%;
                                    }
                                    .ql-container {
                                        flex: 1;
                                        overflow-y: auto;
                                        font-size: 1rem;
                                        border-bottom-left-radius: 0.75rem;
                                        border-bottom-right-radius: 0.75rem;
                                    }
                                    .ql-toolbar {
                                        border-top-left-radius: 0.75rem;
                                        border-top-right-radius: 0.75rem;
                                    }
                                `}</style>
                            </div>
                        </form>
                        <div className="pt-4 border-t border-slate-100 shrink-0">
                            <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                                {editingPlan ? "保存修改" : "立即创建"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
