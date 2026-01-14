"use client";

import { useState, useEffect } from "react";
import { X, Star, Command } from "lucide-react"; // 引入图标

export default function BookmarkHint() {
    const [isVisible, setIsVisible] = useState(false);
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        // 1. 检查是否已经收藏过 (无法直接检测，但可以用 localStorage 记录是否已提示)
        const hasClosed = localStorage.getItem("bookmark_hint_closed");
        if (!hasClosed) {
            // 延迟 2 秒显示，避免进场太突兀
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }

        // 2. 简单的系统检测
        if (typeof navigator !== 'undefined') {
            setIsMac(navigator.userAgent.toLowerCase().includes("mac"));
        }

        // 3. 监听快捷键 (如果用户按了收藏键，就自动关闭提示)
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // 记录已关闭，下次不再显示（或者你可以设置过期时间，比如7天后再提示）
        localStorage.setItem("bookmark_hint_closed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-gray-900/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-4 min-w-[320px]">

                {/* 左侧图标 */}
                <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                    <Star size={20} fill="currentColor" />
                </div>

                {/* 文字内容 */}
                <div className="flex-1">
                    <p className="text-sm font-bold text-gray-100">
                        添加到收藏夹，下次访问更方便
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        按下快捷键
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-300 font-mono font-bold text-[10px]">
                            {isMac ? <Command size={10} /> : "Ctrl"}
                            <span>+</span>
                            <span>D</span>
                        </kbd>
                    </p>
                </div>

                {/* 关闭按钮 */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleClose(); }}
                    className="p-1 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}