// src/store/userStore.ts

import { create } from 'zustand';
import Cookies from 'js-cookie';
import { decryptData } from "@/utils/crypto";

// 定义 User 类型 (确保包含 cash/bank 等你需要显示的字段)
interface User {
    userId: number;
    phone: string;
    nickname: string;
    license?: string;
    isBound: boolean;
    cash?: number; // 可选
    bank?: number; // 可选
    isAdmin?: boolean; // 新增：是否为管理员
}

interface UserState {
    user: User | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
    checkLogin: () => void;
    // ★★★ 新增：刷新用户信息方法 ★★★
    refreshUser: () => Promise<void>;
    setServerStatus: (online: boolean, count: number) => void;
    isServerOnline: boolean;
    playerCount: number;
}

// 请替换为你真实的 IP
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}`;

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isServerOnline: false,
    playerCount: 0,
    login: (userData, token) => {
        Cookies.set('auth_token', token, { expires: 7 });
        Cookies.set('user_info', JSON.stringify(userData), { expires: 7 });
        set({ user: userData });
    },

    logout: () => {
        Cookies.remove('auth_token');
        Cookies.remove('user_info');
        set({ user: null });

    },

    checkLogin: () => {
        const userCookie = Cookies.get('user_info');
        const token = Cookies.get('auth_token');
        if (userCookie && token) {
            set({ user: JSON.parse(userCookie) });
        }
    },

    // ★★★ 新增：主动去后台拉取最新数据 ★★★
    refreshUser: async () => {
        const token = Cookies.get('auth_token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/user/info`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // 发送 Token
                }
            });
            const data = await res.json();

            if (data.success) {
                // 解密后端返回的 data
                const decryptedUser = decryptData(data.data);
                console.log("解密后的用户信息:", decryptedUser);
                // 更新 Zustand 状态
                set({ user: decryptedUser });
                // 同时更新 Cookie，保证刷新页面后也是最新的
                Cookies.set('user_info', JSON.stringify(decryptedUser), { expires: 7 });
            } else {
                set({ user: null });
                Cookies.remove('user_info');
                Cookies.remove("auth_token");

            }
        } catch (error) {
            console.error("刷新用户信息失败", error);
        }
    },
    setServerStatus: (online, count) => set({ isServerOnline: online, playerCount: count }),
}));