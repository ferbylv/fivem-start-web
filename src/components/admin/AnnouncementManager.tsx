"use client";

import { useState, useEffect } from "react";
import { Megaphone, Save } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function AnnouncementManager() {
    const [announcement, setAnnouncement] = useState("");
    const [isEnabled, setIsEnabled] = useState(true);

    const fetchAnnouncement = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/announcement`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                setAnnouncement(json.data.content);
                setIsEnabled(json.data.enabled);
            }
        } catch (err) {
            console.error(err);
            toast.error("无法加载公告配置");
        }
    };

    useEffect(() => {
        fetchAnnouncement();
    }, []);

    const handleSave = async () => {
        try {
            const token = Cookies.get("auth_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/announcement`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: announcement, enabled: isEnabled })
            });
            const json = await res.json();
            if (json.success) {
                toast.success("公告设置已保存");
            } else {
                toast.error(json.message || "保存失败");
            }
        } catch (err) {
            toast.error("网络请求错误");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">全服公告配置</h3>
                <p className="text-slate-500 text-sm">此消息将在首页顶部以跑马灯形式滚动展示</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">

                {/* Switch */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div>
                        <h4 className="font-bold text-slate-800">启用公告栏</h4>
                        <p className="text-xs text-slate-400">关闭后首页将不再显示公告条</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Content Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">公告内容</label>
                    <textarea
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-slate-800 placeholder:text-slate-400"
                        value={announcement}
                        onChange={e => setAnnouncement(e.target.value)}
                        placeholder="请输入想要通知全服玩家的内容..."
                    />
                </div>

                {/* Preview */}
                <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 mb-2">预览效果：</p>
                    <div className="w-full bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2 overflow-hidden opacity-80">
                        <div className="shrink-0 bg-blue-500 p-1 rounded-full text-white">
                            <Megaphone size={10} />
                        </div>
                        <div className="text-xs text-blue-600 font-medium truncate">
                            {announcement || "暂无内容..."}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Save size={18} /> 保存设置
                </button>
            </div>
        </div>
    );
}
