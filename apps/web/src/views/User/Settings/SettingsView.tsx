import { useState } from "react";
import { BiCog, BiUser, BiLock, BiPhone, BiEnvelope } from "react-icons/bi";
import { useUser } from "@/contexts/useUser";
import { updateUser } from "@/api/web";
import toast from "react-hot-toast";
import { PageHeader } from "@/components";
import AvatarUpload from "../components/AvatarUpload";

interface FormData {
  user_name: string;
  phone: string;
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface InputGroupProps {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}

function InputGroup({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
}: InputGroupProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-secondary">{label}</label>
      <div className="relative">
        <Icon
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-faint"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-edge bg-card py-2.5 pr-4 pl-9 text-sm text-primary outline-none transition-colors placeholder:text-faint focus:border-secondary focus:ring-1 focus:ring-secondary"
        />
      </div>
    </div>
  );
}

function SettingsView() {
  const { user, updateProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    user_name: user?.user_name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateProfile({
        user_name: form.user_name || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      });
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.uid) return;
    if (!form.oldPassword || !form.newPassword) {
      toast.error("请填写完整密码信息");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("新密码至少 6 位");
      return;
    }
    setPwdLoading(true);
    try {
      await updateUser(user.uid, {
        password: form.newPassword,
        oldPassword: form.oldPassword,
      } as Record<string, unknown>);
      toast.success("密码修改成功");
      setForm((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "修改失败");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleAvatarSuccess = (avatar: string) => {
    updateProfile({ avatar });
  };

  return (
    <div id="settings-page" className="pb-10 pt-6">
      <PageHeader icon={BiCog} title="个人设置" />

      <div className="space-y-6">
        {/* 头像设置 */}
        <section className="rounded-2xl border border-edge-subtle bg-card p-6 md:p-8 2xs-soft">
          <h2 className="mb-6 text-base font-bold text-primary">头像设置</h2>
          <AvatarUpload
            currentAvatar={user?.avatar}
            onSuccess={handleAvatarSuccess}
          />
        </section>

        {/* 基本信息 */}
        <section className="rounded-2xl border border-edge-subtle bg-card p-6 md:p-8 2xs-soft">
          <h2 className="mb-6 text-base font-bold text-primary">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup
              label="用户名"
              icon={BiUser}
              value={form.user_name}
              onChange={(v) => handleChange("user_name", v)}
              placeholder="设置您的用户名"
            />
            <InputGroup
              label="电话号码"
              icon={BiPhone}
              value={form.phone}
              onChange={(v) => handleChange("phone", v)}
              placeholder="设置您的电话号码"
            />
            <div className="md:col-span-2">
              <InputGroup
                label="邮箱"
                icon={BiEnvelope}
                value={form.email}
                onChange={(v) => handleChange("email", v)}
                placeholder="设置您的邮箱地址"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end border-t border-edge-subtle pt-6">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-50 2xs-soft"
            >
              {saving ? "保存中..." : "保存信息"}
            </button>
          </div>
        </section>

        {/* 修改密码 */}
        <section className="rounded-2xl border border-edge-subtle bg-card p-6 md:p-8 2xs-soft">
          <h2 className="mb-6 text-base font-bold text-primary">修改密码</h2>
          <div className="space-y-6 max-w-md">
            <InputGroup
              label="当前密码"
              icon={BiLock}
              type="password"
              value={form.oldPassword}
              onChange={(v) => handleChange("oldPassword", v)}
              placeholder="输入当前密码"
            />
            <InputGroup
              label="新密码"
              icon={BiLock}
              type="password"
              value={form.newPassword}
              onChange={(v) => handleChange("newPassword", v)}
              placeholder="设置新密码（至少6位）"
            />
            <InputGroup
              label="确认新密码"
              icon={BiLock}
              type="password"
              value={form.confirmPassword}
              onChange={(v) => handleChange("confirmPassword", v)}
              placeholder="再次输入新密码"
            />
          </div>
          <div className="mt-8 flex justify-start border-t border-edge-subtle pt-6">
            <button
              onClick={handleChangePassword}
              disabled={pwdLoading}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-50 2xs-soft"
            >
              {pwdLoading ? "修改中..." : "修改密码"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsView;
