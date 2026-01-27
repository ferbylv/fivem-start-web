/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/userStore.ts


import { create } from 'zustand';
import Cookies from 'js-cookie';
import { decryptData, encryptData } from "@/utils/crypto";

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
    isSuperAdmin?: boolean; // 新增：是否为超级管理员
    permissions?: string[]; // 新增：管理员权限列表 ['store', 'users', 'banner', 'announcement']
    status?: string; // status: 'active' | 'banned'
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

import { siteConfig } from "@/config/site";
// 请替换为你真实的 IP
const API_BASE_URL = siteConfig.api.baseUrl;

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isServerOnline: false,
    playerCount: 0,
    login: (userData, token) => {
        Cookies.set('auth_token', token, { expires: 7 });
        console.log("userData", userData);
        // Encrypt data before saving to cookie, so checkLogin can decrypt it correctly
        // const encryptedUser = encryptData(userData);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        Cookies.set('user_info', userData, { expires: 7 });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        set({ user: decryptData(userData) });
    },

    logout: () => {
        Cookies.remove('auth_token');
        Cookies.remove('user_info');
        set({ user: null });

    },

    checkLogin: () => {
        const userCookie = Cookies.get('user_info');
        const token = Cookies.get('auth_token');
        console.log(userCookie);
        if (userCookie && token) {
            try {
                set({ user: decryptData(userCookie) });
            } catch (err) {
                console.error("Failed to decrypt user cookie:", err);
                // Cookie likely corrupted or in old format, clear it
                Cookies.remove('user_info');
                Cookies.remove('auth_token');
                set({ user: null });
            }
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

                if (decryptedUser.status === 'banned') {
                    get().logout();
                    window.location.replace("/");
                    return;
                }

                // 更新 Zustand 状态
                set({ user: decryptedUser });
                // 同时更新 Cookie，保证刷新页面后也是最新的 (加密存储)
                Cookies.set('user_info', data.data, { expires: 7 });
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