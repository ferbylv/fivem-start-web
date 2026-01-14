// src/utils/crypto.ts
import CryptoJS from "crypto-js";

// ============================================================
// ★★★ 必须与 Python 后端保持完全一致 (16/24/32字节) ★★★
// 后端: AES_SECRET_KEY = b"12345678901234567890123456789012"
// 后端: AES_IV         = b"1234567890123456"
// ============================================================

// 1. 定义密钥 (32位)
const KEY_STR = "12345678901234567890123456789012";
const SECRET_KEY = CryptoJS.enc.Utf8.parse(KEY_STR);

// 2. 定义偏移量 IV (16位) - 这是你缺失的部分！
const IV_STR = "1234567890123456";
const IV = CryptoJS.enc.Utf8.parse(IV_STR);

/**
 * AES-CBC 加密
 * @param data 需要加密的对象或字符串
 */
export const encryptData = (data: unknown) => {
    // 确保数据是字符串
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    const encrypted = CryptoJS.AES.encrypt(dataStr, SECRET_KEY, {
        iv: IV,                      // ★ 必须传入 IV
        mode: CryptoJS.mode.CBC,     // ★ 必须指定 CBC 模式
        padding: CryptoJS.pad.Pkcs7  // ★ 填充方式 (Python默认也是PKCS7/Pad)
    });

    // 返回 Base64 格式的密文
    return encrypted.toString();
};

/**
 * AES-CBC 解密 (如果前端需要解密后端返回的数据)
 */
export const decryptData = (ciphertext: string) => {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY, {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
};