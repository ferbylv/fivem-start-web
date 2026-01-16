
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function BannerManager() {
    const [banners, setBanners] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ title: "", desc: "", src: "", link: "" });

    const fetchBanners = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/banners`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setBanners(json.data);
        } catch (err) {
            console.error(err);
            toast.error("无法加载轮播图");
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("确认删除此轮播图？")) return;

        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/banners/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setBanners(banners.filter(b => b.id !== id));
                toast.success("已移除");
            } else {
                toast.error(json.message || "删除失败");
            }
        } catch (err) {
            toast.error("操作失误");
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/banners`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (json.success) {
                // Only update local state if data is returned, otherwise rely on fetchBanners
                if (json.data) {
                    setBanners(prev => [...prev, json.data]);
                } else {
                    fetchBanners();
                }

                setIsAdding(false);
                setFormData({ title: "", desc: "", src: "", link: "" });
                toast.success("轮播图添加成功");
            } else {
                toast.error(json.message || "添加失败");
            }
        } catch (err) {
            toast.error("网络请求错误");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">首页轮播图</h3>
                    <p className="text-slate-500 text-sm">配置首页顶部的 HeroBanner 区域</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 text-sm font-bold"
                >
                    <Plus size={18} /> {isAdding ? "取消添加" : "添加轮播图"}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-md animate-in slide-in-from-top-2">
                    <h4 className="font-bold text-slate-800 mb-4">添加新图</h4>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">标题</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">描述</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">图片 URL</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={formData.src} onChange={e => setFormData({ ...formData, src: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">跳转链接</label>
                            <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 pt-2">
                            <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800">确认添加</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-4">
                {banners.map((banner, index) => {
                    if (!banner) return null; // Safety check
                    return (
                        <div key={banner.id || index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center group">
                            <div className="text-slate-300 cursor-move hover:text-slate-500"><GripVertical size={20} /></div>

                            {/* Preview Image */}
                            <div className="w-full md:w-48 aspect-video bg-slate-50 rounded-lg overflow-hidden relative shrink-0 border border-slate-100">
                                <img src={banner.src} alt={banner.title} className="w-full h-full object-contain"
                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Error'}
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 w-full text-center md:text-left">
                                <h4 className="font-bold text-slate-800">{banner.title}</h4>
                                <p className="text-sm text-slate-500 mb-1">{banner.desc}</p>
                                <a href={banner.link} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center justify-center md:justify-start gap-1">
                                    {banner.link} <ExternalLink size={10} />
                                </a>
                            </div>

                            {/* Action */}
                            <button
                                onClick={() => handleDelete(banner.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
