"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Crown, Check, Loader2, Star, Shield } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useUserStore } from "@/store/userStore";

import Navbar from "@/components/Navbar";

interface Plan {
    id: number;
    name: string;
    price: number;
    duration: number;
    description: string;
}

interface MySubscription {
    isActive: boolean;
    planName?: string;
    expiryDate?: string;
}

export default function SubscriptionPage() {
    const router = useRouter();
    const { user, isServerOnline, checkLogin } = useUserStore();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [mySub, setMySub] = useState<MySubscription>({ isActive: false });
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState<number | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const fetchedUserRef = useRef<number | null>(null);

    useEffect(() => {
        // Initialize user state from cookies on mount
        checkLogin();
        setAuthChecked(true);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = Cookies.get("auth_token");
                const headers = { Authorization: `Bearer ${token}` };
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;

                // Fetch Plans
                const plansRes = await fetch(`${apiUrl}/subscription/plans`, { headers });
                const plansData = await plansRes.json();
                if (plansData.success) setPlans(plansData.data);

                // Fetch My Subscription
                const myRes = await fetch(`${apiUrl}/subscription/my`, { headers });
                const myData = await myRes.json();
                if (myData.success) setMySub(myData.data);

            } catch (error) {
                console.error("Failed to fetch subscription data", error);
                toast.error("无法加载订阅信息");
            } finally {
                setLoading(false);
            }
        };

        if (user?.userId && fetchedUserRef.current !== user.userId) {
            fetchedUserRef.current = user.userId;
            fetchData();
        }
    }, [user?.userId]);

    const handleSubscribe = async (planId: number) => {
        if (!isServerOnline) {
            toast.error("服务器维护中，无法购买");
            return;
        }
        if (user && !user.isBound) {
            toast.error("请先绑定服务器角色后进行购买");
            return;
        }
        if (mySub.isActive) {
            toast.error("您当前已有生效的订阅，无法重复订阅");
            return;
        }
        setSubscribing(planId);
        try {
            const token = Cookies.get("auth_token");
            // Call Payment Create API
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/alipay/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "subscription",
                    planId
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
            toast.error("请求错误");
        } finally {
            setSubscribing(null);
        }
    };

    // Wait for auth check before showing login screen
    // if (!authChecked) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-slate-50">
    //             <Loader2 className="animate-spin text-blue-500" size={32} />
    //         </div>
    //     );
    // }

    // if (!user) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-slate-50">
    //             <div className="text-center">
    //                 <p className="text-slate-500 mb-4">请先登录查看订阅</p>
    //                 <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 text-white rounded-lg">去登录</button>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <div className="w-full max-w-screen-xl mx-auto px-4 py-6 md:px-8 flex flex-col gap-6">
                <Navbar />
                <Toaster position="top-center" />
                {/* Header */}
                <div className="bg-white border-b border-slate-200 mt-4">
                    <div className="w-full px-4 py-6">
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Crown className="text-amber-500" />
                            会员订阅
                        </h1>
                        <p className="text-slate-500 mt-1">解锁更多高级功能与特权</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (
                    <div className="w-full px-4 py-8 space-y-8">
                        {/* My Subscription Status */}
                        <div className={`rounded-[24px] p-6 border ${mySub.isActive ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className={`font-bold text-lg ${mySub.isActive ? "text-amber-800" : "text-slate-800"}`}>
                                        {mySub.isActive ? "当前订阅生效中" : "您当前没有订阅"}
                                    </h2>
                                    {mySub.isActive && (
                                        <div className="mt-1 text-sm text-amber-700 space-y-1">
                                            <p>方案： {mySub.planName}</p>
                                            <p>有效期至：{mySub.expiryDate}</p>
                                        </div>
                                    )}
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mySub.isActive ? "bg-amber-100 text-amber-600" : "bg-white text-slate-400 shadow-sm"}`}>
                                    <Star size={24} fill={mySub.isActive ? "currentColor" : "none"} />
                                </div>
                            </div>
                        </div>

                        {/* Plans Grid */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-6">选择适合您的方案</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col group">
                                        <div className="p-8 flex-1 flex flex-col items-center text-center">
                                            <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{plan.name}</h4>
                                            <div className="mt-4 flex items-baseline justify-center gap-1">
                                                <span className="text-3xl font-bold text-blue-600">{plan.price}</span>
                                                <span className="text-sm text-slate-500">金币 / {plan.duration}天</span>
                                            </div>
                                            <div
                                                className="mt-4 text-sm text-slate-600 leading-relaxed prose prose-sm prose-slate max-w-none text-center [&>*]:text-center"
                                                dangerouslySetInnerHTML={{ __html: plan.description }}
                                            />

                                        </div>
                                        <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                                            <button
                                                onClick={() => handleSubscribe(plan.id)}
                                                disabled={subscribing === plan.id || !isServerOnline || mySub.isActive}
                                                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2
                                                ${subscribing === plan.id
                                                        ? "bg-slate-100 text-slate-400 cursor-wait"
                                                        : mySub.isActive
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" // Disabled style if active
                                                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                                                    }`}
                                            >
                                                {subscribing === plan.id ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" /> 处理中...
                                                    </>
                                                ) : mySub.isActive ? (
                                                    <>当前已有订阅</>
                                                ) : (
                                                    <>立即订阅</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {plans.length === 0 && (
                                <div className="text-center py-12 text-slate-400 bg-gray-50 rounded-[24px] border border-gray-200 border-dashed">
                                    暂无可用订阅方案
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
