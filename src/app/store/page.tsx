"use client";

import Navbar from "@/components/Navbar";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";
import { useUserStore } from "@/store/userStore";

export default function StorePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { user } = useUserStore();

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

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleBuy = async (product: any) => {
        if (product.stock <= 0) {
            toast.error("库存不足");
            return;
        }

        if (user && !user.isBound) {
            toast.error("请先绑定服务器角色后进行购买");
            return;
        }

        setProcessingId(product.id);

        try {
            const token = Cookies.get("auth_token");
            if (!token) {
                toast.error("请先登录");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/alipay/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "product",
                    productId: product.id,
                    quantity: 1
                })
            });
            const json = await res.json();

            if (json.success && json.data.payUrl) {
                toast.loading("正在跳转支付宝...");
                window.location.href = json.data.payUrl;
            } else {
                toast.error(json.message || "创建订单失败");
            }
        } catch (error) {
            console.error(error);
            toast.error("支付请求失败");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <div className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8">
                <Navbar />
                <Toaster position="top-center" />
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
                                    {/* Discount Badge */}
                                    {item.originalPrice > item.price && (
                                        <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] px-2 py-1 rounded-br-lg z-10 font-bold">
                                            -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {item.stock <= 0 && (
                                        <div className="absolute top-0 right-0 bg-slate-500 text-white text-xs px-2 py-1 rounded-bl-lg z-10 font-bold">
                                            售罄
                                        </div>
                                    )}

                                    <div className="aspect-square bg-white rounded-xl flex items-center justify-center text-gray-300 relative overflow-hidden p-2">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <ShoppingCart size={40} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-700 truncate">{item.name}</h3>
                                        {item.description && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[2.5em]">{item.description}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-1.5">
                                                    <p className="text-blue-500 font-bold text-lg">{item.price?.toLocaleString()} <span className="text-xs">金币</span></p>
                                                    {item.originalPrice > item.price && (
                                                        <p className="text-gray-400 text-xs line-through decoration-gray-400">{item.originalPrice?.toLocaleString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400">库存: {item.stock}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(item)}
                                        disabled={item.stock <= 0 || processingId === item.id}
                                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 ${item.stock > 0
                                            ? "bg-blue-500 text-white hover:bg-blue-600"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {processingId === item.id && <Loader2 size={14} className="animate-spin" />}
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