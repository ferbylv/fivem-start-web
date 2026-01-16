"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, ShoppingCart, X } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function StoreManager() {
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form Stats
    const [formData, setFormData] = useState({ name: "", price: "", description: "", image: "", stock: 100, isActive: true });

    // 1. Fetch Items
    const fetchItems = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/store/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setItems(json.data);
        } catch (err) {
            console.error(err);
            toast.error("加载商品失败");
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleOpenModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                price: item.price,
                description: item.description,
                image: item.image || "",
                stock: item.stock || 0,
                isActive: item.isActive ?? true
            });
        } else {
            setEditingItem(null);
            setFormData({ name: "", price: "", description: "", image: "", stock: 100, isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确定要删除这个商品吗？")) return;

        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/store/products/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setItems(items.filter(i => i.id !== id));
                toast.success("商品已删除");
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
        const url = editingItem
            ? `${process.env.NEXT_PUBLIC_API_URL}/admin/store/products/${editingItem.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/admin/store/products`;
        const method = editingItem ? "PUT" : "POST";

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
                    stock: Number(formData.stock)
                })
            });
            const json = await res.json();

            if (json.success) {
                toast.success(editingItem ? "商品更新成功" : "商品发布成功");
                setIsModalOpen(false);
                fetchItems(); // Refresh List
            } else {
                toast.error(json.message || "操作失败");
            }
        } catch (err) {
            toast.error("网络请求错误");
        }
    };

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">商品管理</h3>
                    <p className="text-slate-500 text-sm">管理游戏商店内的道具与服务</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 text-sm font-bold"
                >
                    <Plus size={18} /> 发布商品
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <Search size={20} className="text-slate-400 ml-2" />
                <input
                    type="text"
                    placeholder="搜索商品名称..."
                    className="flex-1 outline-none text-sm p-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : <ShoppingCart size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-blue-600 font-bold text-sm">$ {item.price?.toLocaleString()}</p>
                                    {item.isActive ? (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">上架</span>
                                    ) : (
                                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">下架</span>
                                    )}
                                </div>
                                <p className="text-slate-500 text-xs mt-1">库存: {item.stock ?? 0}</p>
                                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleOpenModal(item)}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 shadow-sm"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">{editingItem ? "编辑商品信息" : "发布新商品"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">商品名称</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">图片链接 (可选)</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">库存</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-slate-700">上架销售</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">商品描述</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-slate-800 placeholder:text-slate-400"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                                {editingItem ? "保存修改" : "确认发布"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
