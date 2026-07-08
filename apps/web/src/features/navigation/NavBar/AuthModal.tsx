import React, { useState } from "react";
import { BiUser, BiLock, BiPhone, BiEnvelope, BiX, BiShow, BiHide } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { useUser } from "@/contexts/useUser";
import { Modal, Button } from "@/components";
import toast from "react-hot-toast";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // login fields
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");

  // register fields
  const [regForm, setRegForm] = useState({
    login_name: "",
    password: "",
    confirm_password: "",
    user_name: "",
    phone: "",
    email: "",
  });

  const reset = () => {
    setLoginName("");
    setPassword("");
    setRegForm({
      login_name: "",
      password: "",
      confirm_password: "",
      user_name: "",
      phone: "",
      email: "",
    });
    setShowPwd(false);
    setMode("login");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(loginName.trim(), password.trim());
      handleClose();
    } catch {
      // 错误已由 UserContext 中的 toast 提示
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.login_name.trim() || !regForm.password.trim()) return;
    if (regForm.password !== regForm.confirm_password) {
      toast.error("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      await register({
        login_name: regForm.login_name.trim(),
        password: regForm.password.trim(),
        user_name: regForm.user_name.trim() || undefined,
        phone: regForm.phone.trim() || undefined,
        email: regForm.email.trim() || undefined,
      });
      setMode("login");
      setLoginName(regForm.login_name.trim());
    } catch {
      // 错误已由 UserContext 中的 toast 提示
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all";

  return (
    <Modal open={open} onCancel={handleClose} width={420} closable={false} footer={null}>
      <div className="relative">
        <button
          onClick={handleClose}
          className="absolute right-0 top-0 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <BiX size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            {mode === "login" ? "欢迎回来" : "创建账号"}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {mode === "login" ? "登录以访问您的收藏和历史" : "注册一个新账号开始使用"}
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <BiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="登录名"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className={cn(inputClass, "pl-9")}
                required
              />
            </div>
            <div className="relative">
              <BiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type={showPwd ? "text" : "password"}
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputClass, "pl-9 pr-9")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPwd ? <BiHide size={16} /> : <BiShow size={16} />}
              </button>
            </div>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              block
            >
              登录
            </Button>
            <p className="text-center text-sm text-zinc-500">
              还没有账号？{" "}
              <button type="button" onClick={() => setMode("register")} className="text-zinc-900 font-medium hover:underline">
                立即注册
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="relative">
              <BiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="登录名"
                value={regForm.login_name}
                onChange={(e) => setRegForm((s) => ({ ...s, login_name: e.target.value }))}
                className={cn(inputClass, "pl-9")}
                required
              />
            </div>
            <div className="relative">
              <BiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type={showPwd ? "text" : "password"}
                placeholder="密码"
                value={regForm.password}
                onChange={(e) => setRegForm((s) => ({ ...s, password: e.target.value }))}
                className={cn(inputClass, "pl-9 pr-9")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPwd ? <BiHide size={16} /> : <BiShow size={16} />}
              </button>
            </div>
            <div className="relative">
              <BiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="password"
                placeholder="确认密码"
                value={regForm.confirm_password}
                onChange={(e) => setRegForm((s) => ({ ...s, confirm_password: e.target.value }))}
                className={cn(inputClass, "pl-9")}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <BiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="昵称"
                  value={regForm.user_name}
                  onChange={(e) => setRegForm((s) => ({ ...s, user_name: e.target.value }))}
                  className={cn(inputClass, "pl-9")}
                />
              </div>
              <div className="relative">
                <BiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="手机号"
                  value={regForm.phone}
                  onChange={(e) => setRegForm((s) => ({ ...s, phone: e.target.value }))}
                  className={cn(inputClass, "pl-9")}
                />
              </div>
            </div>
            <div className="relative">
              <BiEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="email"
                placeholder="邮箱"
                value={regForm.email}
                onChange={(e) => setRegForm((s) => ({ ...s, email: e.target.value }))}
                className={cn(inputClass, "pl-9")}
              />
            </div>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              block
            >
              注册
            </Button>
            <p className="text-center text-sm text-zinc-500">
              已有账号？{" "}
              <button type="button" onClick={() => setMode("login")} className="text-zinc-900 font-medium hover:underline">
                去登录
              </button>
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
}
