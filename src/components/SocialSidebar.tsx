"use client";

import { useState } from "react";
import { MessageCircle, Gamepad2, Copy, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

import { siteConfig } from "@/config/site";

export default function SocialSidebar() {
    const [qqHovered, setQqHovered] = useState(false);
    const [kookHovered, setKookHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    const QQ_GROUP_ID = siteConfig.social.qq.groupId;
    const QQ_LINK = siteConfig.social.qq.link;
    const KOOK_LINK = siteConfig.social.kook.link;

    const handleCopyQQ = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the main click
        navigator.clipboard.writeText(QQ_GROUP_ID);
        setCopied(true);
        toast.success("QQ群号已复制");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleQQClick = () => {
        if (QQ_LINK.includes("INSERT_YOUR")) {
            toast.error("请先配置QQ加群链接");
            return;
        }
        window.open(QQ_LINK, "_blank");
    };

    const handleKookClick = () => {
        window.open(KOOK_LINK, "_blank");
    };

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl">
            {/* Label */}
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center select-none [writing-mode:vertical-rl] rotate-270">
                Join Us
            </div>

            {/* QQ Button */}
            <div
                className="relative flex items-center justify-center"
                onMouseEnter={() => setQqHovered(true)}
                onMouseLeave={() => setQqHovered(false)}
            >
                {/* Popover */}
                <div
                    className={`absolute right-full mr-4 bg-white px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform origin-right flex items-center gap-3 whitespace-nowrap border border-slate-100 z-50
                        ${qqHovered ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-4 pointer-events-none"}
                        before:content-[''] before:absolute before:-right-4 before:top-0 before:w-4 before:h-full
                    `}
                >
                    <div className="text-sm font-medium text-slate-600">
                        QQ群号: <span className="font-bold text-slate-800">{QQ_GROUP_ID}</span>
                    </div>
                    <button
                        onClick={handleCopyQQ}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-500 transition-colors"
                        title="复制群号"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    {/* Arrow */}
                    <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-t border-r border-slate-100 transform rotate-45 -translate-y-1/2"></div>
                </div>

                {/* Button */}
                <button
                    onClick={handleQQClick}
                    className="w-14 h-14 bg-white rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group border-2 border-white cursor-pointer overflow-hidden relative"
                    title="点击加入QQ群"
                >
                    <div className="absolute inset-0 bg-[#12B7F5]/10 group-hover:bg-[#12B7F5] transition-colors duration-300"></div>
                    {/* Official QQ Logo SVG - White on hover, Brand Color normally */}
                    <svg viewBox="0 0 16 16" className="w-8 h-8 text-[#12B7F5] group-hover:text-white fill-current relative z-10 transition-colors duration-300" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.048 3.323c.022.277-.13.523-.338.55-.21.026-.397-.176-.419-.453-.022-.277.13-.523.338-.55.21-.026.397.176.42.453Zm2.265-.24c-.603-.146-.894.256-.936.333-.027.048-.008.117.037.15.045.035.092.025.119-.003.361-.39.751-.172.829-.129l.011.007c.053.024.147.028.193-.098.023-.063.017-.11-.006-.142-.016-.023-.089-.08-.247-.118Z" />
                        <path fillRule="evenodd" d="M11.727 6.719c0-.022.01-.375.01-.557 0-3.07-1.45-6.156-5.015-6.156-3.564 0-5.014 3.086-5.014 6.156 0 .182.01.535.01.557l-.72 1.795a25.85 25.85 0 0 0-.534 1.508c-.68 2.187-.46 3.093-.292 3.113.36.044 1.401-1.647 1.401-1.647 0 .979.504 2.256 1.594 3.179-.408.126-.907.319-1.228.556-.29.213-.253.43-.201.518.228.386 3.92.246 4.985.126 1.065.12 4.756.26 4.984-.126.052-.088.088-.305-.2-.518-.322-.237-.822-.43-1.23-.557 1.09-.922 1.594-2.2 1.594-3.178 0 0 1.041 1.69 1.401 1.647.168-.02.388-.926-.292-3.113a25.78 25.78 0 0 0-.534-1.508l-.72-1.795ZM9.773 5.53c-.13-.286-1.431-.605-3.042-.605h-.017c-1.611 0-2.913.319-3.042.605a.096.096 0 0 0-.01.04c0 .022.008.04.018.056.11.159 1.554.943 3.034.943h.017c1.48 0 2.924-.784 3.033-.943a.095.095 0 0 0 .008-.096Zm-4.32-.989c-.483.022-.896-.529-.922-1.229-.026-.7.344-1.286.828-1.308.483-.022.896.529.922 1.23.027.7-.344 1.286-.827 1.307Zm2.538 0c.483.022.896-.529.922-1.229.026-.7-.344-1.286-.827-1.308-.484-.022-.896.529-.923 1.23-.026.7.344 1.285.828 1.307ZM2.928 8.99a10.674 10.674 0 0 0-.097 2.284c.146 2.45 1.6 3.99 3.846 4.012h.091c2.246-.023 3.7-1.562 3.846-4.011.054-.9" />
                    </svg>
                </button>
            </div>

            {/* KOOK Button */}
            <div
                className="relative flex items-center justify-center"
                onMouseEnter={() => setKookHovered(true)}
                onMouseLeave={() => setKookHovered(false)}
            >
                {/* Popover */}
                <div
                    className={`absolute right-full mr-4 bg-white px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform origin-right flex items-center gap-3 whitespace-nowrap border border-slate-100 z-50
                        ${kookHovered ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-4 pointer-events-none"}
                        before:content-[''] before:absolute before:-right-4 before:top-0 before:w-4 before:h-full
                    `}
                >
                    <div className="text-sm font-medium text-slate-600">
                        加入 KOOK 服务器
                    </div>
                    <a
                        href={KOOK_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-green-500 transition-colors"
                        title="点击加入"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={16} />
                    </a>
                    {/* Arrow */}
                    <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-t border-r border-slate-100 transform rotate-45 -translate-y-1/2"></div>
                </div>

                {/* Button */}
                <button
                    onClick={handleKookClick}
                    className="w-14 h-14 bg-white rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group border-2 border-white cursor-pointer overflow-hidden relative"
                    title="点击加入KOOK服务器"
                >
                    <div className="absolute inset-0 bg-[#87C02F] opacity-10 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Placeholder for KOOK Logo - Official color is #87C02F */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <Gamepad2 size={30} className="text-[#87C02F] group-hover:text-white transition-colors duration-300" />
                    </div>
                </button>
            </div>
        </div>
    );
}
