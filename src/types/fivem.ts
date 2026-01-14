/* eslint-disable @typescript-eslint/no-explicit-any */
// 定义后端返回的 JSON 结构
export interface FiveMCharInfo {
    firstname: string;
    lastname: string;
    birthdate: string;
    gender: number;
    nationality: string;
    phone: string;
    account: string;
    cid: number;
}

export interface FiveMItemInfo {
    gender?: number;
    birthdate?: string;
    lastname?: string;
    firstname?: string;
    citizenid?: string;
    type?: string;
    [key: string]: any;
}

export interface FiveMItem {
    name: string;
    label: string;
    amount: number;
    description: string;
    image: string;     // 图片文件名
    image_url: string; // 完整图片地址
    slot: number;
    weight: number;
    useable: boolean;
    unique: boolean;
    info: FiveMItemInfo | [];
}

export interface FiveMVehicle {
    plate: string;
    vehicle: string; // model name
    state: number;   // 状态
    fuel: number;
    engine: number;
    body: number;
    name?: string;    // 可能会有自定义车名
}

export interface FiveMData {
    success: boolean;
    data: {
        license: string;
        citizenid: string;
        is_online: boolean;
        charinfo: FiveMCharInfo;
        money: {
            cash: number;
            bank: number;
            crypto: number;
        };
        items: FiveMItem[];
        vehicles: FiveMVehicle[];
    }
}