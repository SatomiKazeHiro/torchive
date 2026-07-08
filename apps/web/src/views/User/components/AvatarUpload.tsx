import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { BiCamera, BiX, BiCheck } from "react-icons/bi";
import { uploadAvatar } from "@/api/web";
import { getAvatarUrl } from "@/utils/avatar";
import { useUser } from "@/contexts/useUser";
import toast from "react-hot-toast";

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarUploadProps {
  currentAvatar?: string;
  onSuccess?: (avatar: string) => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("图像编码失败，请重试"));
      }
    }, "image/jpeg");
  });
}

export default function AvatarUpload({
  currentAvatar,
  onSuccess,
}: AvatarUploadProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const avatarUrl = getAvatarUrl(currentAvatar);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.match(/^image\//)) {
      toast.error("请选择图片文件");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("图片大小不能超过 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !user?.uid) return;

    setLoading(true);
    try {
      // 裁剪
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // 压缩
      const compressedFile = await imageCompression(
        new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" }),
        {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 512,
          useWebWorker: true,
        },
      );

      // 上传
      const res = await uploadAvatar(user.uid, compressedFile);
      const avatar = res.data.avatar;

      toast.success("头像上传成功");
      setImageSrc(null);
      onSuccess?.(avatar);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div>
      {/* 当前头像 + 上传按钮 */}
      <div className="relative inline-block">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="h-24 w-24 rounded-full border-2 border-edge object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-edge bg-zinc-900 text-2xl font-bold text-white dark:bg-zinc-700">
            {user?.user_name?.[0] || user?.login_name?.[0] || "?"}
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-on-accent shadow-md transition-colors hover:opacity-90"
          title="更换头像"
        >
          <BiCamera size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 裁剪弹窗 */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-card p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-primary">裁剪头像</h3>
              <button
                onClick={handleCancel}
                className="rounded-full p-1 text-faint hover:bg-subtle hover:text-secondary"
              >
                <BiX size={18} />
              </button>
            </div>

            <div className="relative h-64 w-full overflow-hidden rounded-lg bg-zinc-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="mt-3">
              <label className="text-xs text-muted">缩放</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-1 h-1 w-full rounded-full bg-edge accent-accent"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-subtle"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" />
                ) : (
                  <BiCheck size={16} />
                )}
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
