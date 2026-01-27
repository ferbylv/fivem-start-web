"use client"; // 必须添加：因为我们要使用 useState 等交互功能

import Image from "next/image";
import { Smartphone, Lock, Check, KeyRound, ChevronRight, AlertCircle, Wallet, CreditCard, Car, Package, Search, Filter, ArrowUpRight, Zap, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // 1. 引入路由钩子
// 1. 引入工具
import { useUserStore } from "@/store/userStore"; // 状态
import { toast, Toaster } from "react-hot-toast";
import { decryptData, encryptData } from "@/utils/crypto";
import { siteConfig } from "@/config/site";
// === 模拟模式开关 ===
// 设置为 false 时，会真正去请求后端接口
// 设置为 true 时，会模拟成功并返回假数据 (方便你现在测试)
const MOCK_MODE = false;
export default function LoginPage() {
  const router = useRouter(); // 2. 初始化路由
  const { login } = useUserStore(); // 获取 store 的 login 方法
  // --- 状态定义 ---
  const [phoneNumber, setPhoneNumber] = useState(""); // 手机号
  const [verifyCode, setVerifyCode] = useState("");   // 验证码
  // const [isVerified, setIsVerified] = useState(false); // 是否通过滑动验证
  const [countdown, setCountdown] = useState(0);       // 倒计时秒数
  const [isLoading, setIsLoading] = useState(false); // 加载状态

  const lastSendTimeRef = useRef<number>(0);
  // --- 2. 新增：错误信息状态对象 ---
  const [errors, setErrors] = useState({
    phone: "",
    slider: "",
    code: ""
  });

  // --- 滑动验证专用状态 ---
  const [isVerified, setIsVerified] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖拽
  const [dragX, setDragX] = useState(0); // 滑块当前的位移 (px)
  const sliderRef = useRef<HTMLDivElement>(null); // 获取整个滑动轨道的宽度
  const startXRef = useRef(0); // 记录点击时的初始 X 坐标
  // --- 倒计时逻辑 ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // --- 处理发送验证码 ---
  const handleSendCode = async () => {
    // 3. ★★★ 防抖/节流逻辑开始 ★★★
    const now = Date.now();
    // 如果距离上次点击不足 2000 毫秒 (2秒)，直接拦截
    // 这能有效防止双击或极快速度的连续点击
    if (now - lastSendTimeRef.current < 2000) {
      return;
    }
    lastSendTimeRef.current = now;
    // 重置所有错误
    setErrors({ phone: "", slider: "", code: "" });

    let hasError = false;
    const newErrors = { phone: "", slider: "", code: "" };

    if (!phoneNumber) {
      newErrors.phone = "请先输入手机号";
      hasError = true;
    }
    if (!isVerified) {
      newErrors.slider = "请先完成滑块验证";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    if (countdown > 0) return;

    // 这里写发送验证码的后端接口逻辑
    console.log(`向手机号 ${phoneNumber} 发送验证码`);
    try {
      const encrypted = encryptData({ phone: phoneNumber });
      const res = await fetch(`${siteConfig.api.baseUrl}/send-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 后端 SendCodeRequest 只需要 phone 字段
        // const rawPayload = { phone: phoneNumber };

        // body: JSON.stringify({ phone: phoneNumber }),
        body: JSON.stringify({ data: encrypted }),
      });

      const data = await res.json();

      // 4. 处理响应
      if (data.success) {
        // 开始60秒倒计时
        setCountdown(60);
      } else {
        toast.error(data.message || "发送失败");
      }
    } catch (error) {
      console.error("发送验证码错误:", error);
      toast.error("网络连接失败，请检查后端服务");
    }

  };

  // --- 模拟滑动验证 (点击代替滑动以简化演示) ---
  // const handleSlideVerify = () => {
  //   // 实际项目中这里可以使用拖拽事件，为了演示方便，这里点击即可验证成功
  //   if (!isVerified) {
  //     setIsVerified(true);
  //   }
  // };
  const handleLogin = async () => {
    setErrors({ phone: "", slider: "", code: "" }); // 先清空

    let hasError = false;
    const newErrors = { phone: "", slider: "", code: "" };

    // 校验手机
    if (!phoneNumber) {
      newErrors.phone = "请输入手机号";
      hasError = true;
    }
    // 校验滑块
    if (!isVerified) {
      newErrors.slider = "请拖动滑块验证身份";
      hasError = true;
    }
    // 校验验证码
    if (!verifyCode) {
      newErrors.code = "请输入验证码";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    // 全部通过
    // console.log("登录成功");
    // router.push("/home");
    try {
      // 2. 准备 payload 并加密
      const rawPayload = {
        phone: phoneNumber,
        code: verifyCode,
        timestamp: Date.now()
      };

      // 使用 AES 加密 (encryptData 已经在 utils 定义)
      const encryptedPayload = encryptData(rawPayload);

      let responseData;

      if (MOCK_MODE) {
        // --- 模拟后端返回 ---
        await new Promise(resolve => setTimeout(resolve, 1000)); // 假装网络延迟
        responseData = {
          success: true,
          token: "mock-jwt-token-xyz-888",
          userInfo: {
            phone: phoneNumber,
            avatarUrl: "", // 空着展示默认头像
            isBound: false, // 模拟未绑定
            nickname: "测试用户001"
          }
        };
      } else {
        // --- 真实接口调用 ---
        const res = await fetch(`${siteConfig.api.baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: encryptedPayload // 发送加密后的密文
          })
        });
        responseData = await res.json();
      }

      // 3. 处理响应
      if (responseData.success) {
        // toast.success("登录成功，正在跳转...");
        decryptData(responseData.userInfo).status == "banned" ? toast.error("账号被封禁") : login(responseData.userInfo, responseData.token);
        // 4. 存入 Zustand 全局状态


        setTimeout(() => {
          router.push("/home");
        }, 800);
      } else {
        toast.error(responseData.message || "登录失败，请检查验证码");
      }

    } catch (error) {
      console.error(error);
      toast.error("网络请求错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. 开始拖拽 (按下鼠标 或 手指触摸)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isVerified) return; // 已经验证过了就不能拖了

    setIsDragging(true);
    clearError("slider");
    // 兼容 鼠标事件 clientX 和 触摸事件 touches[0].clientX
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
  };
  // --- 辅助函数：清除指定字段的错误 ---
  // 当用户开始输入时，应该把红字去掉
  const clearError = (field: "phone" | "slider" | "code") => {
    setErrors(prev => ({ ...prev, [field]: "" }));
  };
  // 2. 全局监听移动和松开事件
  // 使用 useEffect 监听 document，防止鼠标移出滑块范围导致拖拽中断
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!sliderRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

      // 计算轨道总宽度 - 滑块宽度(40px) - 左右padding(大约8px)
      // 这里我们可以动态计算最大可滑动距离
      const containerWidth = sliderRef.current.clientWidth;
      const maxDragWidth = containerWidth - 48; // 48 = 滑块宽(40) + padding(8)

      // 计算当前位移
      let newX = clientX - startXRef.current;

      // 限制边界：不能小于0，不能大于最大距离
      if (newX < 0) newX = 0;
      if (newX > maxDragWidth) newX = maxDragWidth;

      setDragX(newX);
    };

    const handleMouseUp = () => {
      if (!sliderRef.current) return;
      setIsDragging(false);

      const containerWidth = sliderRef.current.clientWidth;
      const maxDragWidth = containerWidth - 48;

      // 3. 判断结果：如果滑动距离超过了 90%，就算验证成功
      if (dragX > maxDragWidth * 0.9) {
        setDragX(maxDragWidth); // 吸附到最右边
        setIsVerified(true);
        clearError("slider"); // 验证成功，确保错误提示清除
      } else {
        setDragX(0); // 弹回起点
        setIsVerified(false);
      }
    };

    // 添加全局监听
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleMouseMove);
    document.addEventListener("touchend", handleMouseUp);

    // 清除监听
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, dragX]);

  return (
    // 背景色：使用了深邃的蓝紫色，比较有科技感
    <div className="min-h-screen bg-[#4A55A2] flex items-center justify-center p-4 transition-colors duration-500">
      <Toaster position="top-center" />
      <div className="bg-white w-full max-w-4xl h-[600px] rounded-[40px] shadow-2xl flex overflow-hidden">

        {/* --- 左侧：插画区域 --- */}
        <div className="relative w-1/2 hidden md:block">
          <Image
            src="/robot.png" // 确保你的 public 目录下有这张图
            alt="Login Illustration"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* --- 右侧：表单区域 --- */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center">

          <div className="space-y-6 w-full max-w-sm mx-auto">

            <h2 className="text-3xl font-bold text-gray-800 mb-2">欢迎回来</h2>
            <p className="text-gray-400 text-sm mb-4">请输入手机号和验证码登录</p>

            {/* 1. 手机号输入框 */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Smartphone size={20} />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                maxLength={11}
                inputMode={"numeric"}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  clearError("phone"); // 输入时清除错误
                  setPhoneNumber(val)
                }}
                placeholder="请输入手机号"
                className={`w-full border-none rounded-2xl py-4 pl-12 pr-4 outline-none transition-all shadow-inner border
                        ${errors.phone
                    ? "bg-red-50 text-red-600 focus:ring-2 focus:ring-red-200 placeholder-red-300"
                    : "bg-gray-100/80 text-gray-600 focus:ring-2 focus:ring-blue-300"
                  }`}
              />
            </div>
            {errors.phone && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-500 text-xs animate-in slide-in-from-left-2 fade-in duration-300">
                <AlertCircle size={12} />
                <span>{errors.phone}</span>
              </div>
            )}

            {/* 2. 滑动验证 (逻辑核心) */}
            {/* 如果未验证：显示滑动条；如果已验证：显示绿色成功状态 */}
            {/*<div*/}
            {/*    onClick={handleSlideVerify}*/}
            {/*    className={`relative w-full h-12 rounded-full flex items-center px-1 shadow-inner cursor-pointer transition-all duration-300 select-none overflow-hidden*/}
            {/*  ${isVerified ? "bg-green-500" : "bg-gray-100/80 hover:bg-gray-200"}`}*/}
            {/*>*/}
            {/*  /!* 滑块/图标 *!/*/}
            {/*  <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-md text-white transition-all duration-500 */}
            {/*    ${isVerified ? "translate-x-[300px] opacity-0" : "bg-[#5DA9E9] translate-x-0"}`}>*/}
            {/*    <ChevronRight size={20} />*/}
            {/*  </div>*/}

            {/*  /!* 文字提示 *!/*/}
            {/*  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">*/}
            {/*    {isVerified ? (*/}
            {/*        <div className="flex items-center gap-2 text-white font-bold animate-in fade-in zoom-in">*/}
            {/*          <Check size={18} />*/}
            {/*          <span>验证成功</span>*/}
            {/*        </div>*/}
            {/*    ) : (*/}
            {/*        <span className="text-gray-400 text-sm">点击或滑动以验证身份</span>*/}
            {/*    )}*/}
            {/*  </div>*/}
            {/*</div>*/}
            {/* =========================================
                2. 滑动验证组件 (UI更新 + 绑定事件)
               ========================================= */}
            <div
              ref={sliderRef}
              className={`relative w-full h-12 rounded-full flex items-center px-1 shadow-inner select-none overflow-hidden transition-all duration-300
                    ${isVerified ? "bg-green-500" : errors.slider ? "bg-red-50 ring-2 ring-red-100" : "bg-gray-100/80"}`}
            >
              {/* 绿色背景条：跟随滑块移动 */}
              {!isVerified && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-green-400 opacity-50 z-0"
                  style={{ width: `${dragX + 20}px` }} // +20 是为了让颜色稍微超前一点，视觉更好
                />
              )}

              {/* 滑块 (Handle) */}
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{ transform: `translateX(${dragX}px)` }}
                className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shadow-md text-white cursor-pointer
                  ${isVerified ? "bg-white text-green-500" : "bg-[#5DA9E9]"}
                  ${isDragging ? "" : "transition-transform duration-300"} 
                `}
              // 上面这一行逻辑：拖拽时去掉 transition，松手回弹时加上 transition，保证手感顺滑
              >
                {isVerified ? <Check size={20} /> : <ChevronRight size={20} />}
              </div>

              {/* 文字提示 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                {isVerified ? (
                  <div className="flex items-center gap-2 text-white font-bold animate-in fade-in zoom-in ml-8">
                    <span>验证成功</span>
                  </div>
                ) : (
                  <span
                    className={`text-sm transition-opacity ${errors.slider ? "text-red-400 font-medium" : "text-gray-400"}`}
                    style={{ opacity: isDragging ? 0 : 1 - (dragX / 100) }}
                  >
                    {errors.slider ? "请拖动滑块完成验证" : "按住滑块拖动验证"}
                  </span>
                )}
              </div>
            </div>
            {/* 错误提示文字 - 滑块 */}
            {errors.slider && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-500 text-xs animate-in slide-in-from-left-2 fade-in duration-300">
                <AlertCircle size={12} />
                <span>{errors.slider}</span>
              </div>
            )}
            {/* 3. 验证码输入框 + 发送按钮 */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <KeyRound size={20} />
              </div>
              <input
                type="text"
                value={verifyCode}
                inputMode={"numeric"}
                onChange={(e) => {
                  // 使用正则：如果输入的内容包含非数字，直接替换为空
                  const val = e.target.value.replace(/\D/g, '');
                  clearError("code"); // 输入时清除错误
                  setVerifyCode(val);
                }}
                placeholder="请输入验证码"
                maxLength={6}
                className={`w-full border-none rounded-2xl py-4 pl-12 pr-32 outline-none transition-all shadow-inner
                        ${errors.code
                    ? "bg-red-50 text-red-600 focus:ring-2 focus:ring-red-200 placeholder-red-300"
                    : "bg-gray-100/80 text-gray-600 focus:ring-2 focus:ring-blue-300"
                  }`}
              />

              {/* 发送验证码按钮 (绝对定位在输入框右侧) */}
              <button
                onClick={handleSendCode}
                disabled={!isVerified || countdown > 0 || !phoneNumber}
                className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl text-xs font-medium transition-all
                  ${(!isVerified || !phoneNumber)
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" // 禁用状态
                    : countdown > 0
                      ? "bg-gray-200 text-gray-500 cursor-wait"   // 倒计时状态
                      : "bg-[#5DA9E9] text-white hover:bg-[#4B93D1] shadow-md active:scale-95" // 可点击状态
                  }
                `}
              >
                {countdown > 0 ? `${countdown}s 后重新获取` : "发送验证码"}
              </button>
            </div>
            {/* 错误提示文字 - 验证码 */}
            {errors.code && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-500 text-xs animate-in slide-in-from-left-2 fade-in duration-300">
                <AlertCircle size={12} />
                <span>{errors.code}</span>
              </div>
            )}
            {/* 登录按钮 */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`w-full text-white font-bold py-4 rounded-2xl shadow-[0_10px_20px_-5px_rgba(93,169,233,0.5)] transition-all transform mt-4 flex items-center justify-center gap-2
                ${isLoading ? "bg-blue-300 cursor-wait" : "bg-[#5DA9E9] hover:bg-[#4B93D1] active:scale-95"}
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                "登录 / 注册"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}