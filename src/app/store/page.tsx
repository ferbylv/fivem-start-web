"use client";

import Navbar from "@/components/Navbar"; // 1. 引入刚才写的导航栏
import { ShoppingCart } from "lucide-react";

export default function StorePage() {
    return (
        <div className="min-h-screen bg-white text-gray-800">
            <div className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8">

                {/* 2. 使用导航栏组件 */}
                <Navbar />

                {/* 商店内容区域 */}
                <div className="mt-8 space-y-6">
                    <h1 className="text-3xl font-bold text-gray-800">游戏商店</h1>
                    <p className="text-gray-500">这里是用金币兑换道具的地方...</p>

                    {/* 模拟商品列表 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-lg transition-all cursor-pointer group">
                                <div className="aspect-square bg-white rounded-xl flex items-center justify-center text-gray-300">
                                    <ShoppingCart size={40} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700">神秘道具 #{item}</h3>
                                    <p className="text-blue-500 font-bold text-sm">500 金币</p>
                                </div>
                                <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors">
                                    购买
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}