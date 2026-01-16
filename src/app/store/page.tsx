"use client";

import Navbar from "@/components/Navbar";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function StorePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Assuming public endpoint doesn't need auth token, or it uses same as admin if publicly accessible
                // Usually store is public.
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/products`);
                const json = await res.json();
                if (json.success) {
                    setProducts(json.data);
                } else {
                    toast.error("加载商品失败");
                }
            } catch (err) {
                console.error(err);
                toast.error("无法连接到商店服务器");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleBuy = (product: any) => {
        if (product.stock <= 0) {
            toast.error("库存不足");
            return;
        }
        // Placeholder for purchase logic
        toast.success(`即将购买: ${product.name}`);
    };

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <div className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8">
                <Navbar />

                <div className="mt-8 space-y-6">
                    <h1 className="text-3xl font-bold text-gray-800">游戏商店</h1>
                    <p className="text-gray-500">这里是用金币兑换道具的地方...</p>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {products.map((item) => (
                                <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
                                    {/* Stock Badge */}
                                    {item.stock <= 0 && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg z-10 font-bold">
                                            售罄
                                        </div>
                                    )}

                                    <div className="aspect-square bg-white rounded-xl flex items-center justify-center text-gray-300 relative overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ShoppingCart size={40} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-700 truncate">{item.name}</h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-blue-500 font-bold text-sm">{item.price?.toLocaleString()} 金币</p>
                                            <p className="text-xs text-slate-400">库存: {item.stock}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(item)}
                                        disabled={item.stock <= 0}
                                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${item.stock > 0
                                            ? "bg-blue-500 text-white hover:bg-blue-600"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {item.stock > 0 ? "购买" : "缺货"}
                                    </button>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="col-span-full text-center py-20 text-gray-400">
                                    暂无商品上架
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}