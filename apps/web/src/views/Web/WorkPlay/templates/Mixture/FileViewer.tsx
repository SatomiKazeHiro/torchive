import { getFileType } from "./utils";
import { getFileName } from "@/utils/fileHelper";
import type { MediaType } from "./types";

// 动态导入各个 Viewer 组件
import VideoPlayer from "./VideoPlayer";
import AudioPlayer from "./Audio/AudioPlayer";
import ImageViewer from "./ImageViewer";
import PdfViewer from "./PdfViewer";
import TextViewer from "./TextViewer";
import Download from "./Download";

/**
 * 文件查看器组件 Props
 */
interface FileViewerProps {
  /** 文件路径 */
  filePath: string;
  /** 是否有上一个文件 */
  hasPrev?: boolean;
  /** 是否有下一个文件 */
  hasNext?: boolean;
  /** 切换到上一个文件 */
  onPrev?: () => void;
  /** 切换到下一个文件 */
  onNext?: () => void;
}

/**
 * 根据文件类型渲染对应的查看器组件
 */
function renderViewer(
  type: MediaType, 
  src: string, 
  fileName: string,
  navProps: { hasPrev?: boolean; hasNext?: boolean; onPrev?: () => void; onNext?: () => void }
): React.ReactNode {
  switch (type) {
    case "image":
      return <ImageViewer src={src} fileName={fileName} />;
    case "video":
      return <VideoPlayer src={src} fileName={fileName} />;
    case "audio":
      return (
        <AudioPlayer 
          src={src} 
          fileName={fileName} 
          hasPrev={navProps.hasPrev}
          hasNext={navProps.hasNext}
          onPrev={navProps.onPrev}
          onNext={navProps.onNext}
        />
      );
    case "pdf":
      return <PdfViewer src={src} fileName={fileName} />;
    case "text":
      return <TextViewer src={src} fileName={fileName} />;
    case "unknown":
    default:
      return <Download src={src} fileName={fileName} />;
  }
}

/**
 * 文件查看器组件
 * 
 * 功能：
 * - 根据文件扩展名自动识别文件类型
 * - 渲染对应类型的预览组件
 * - 音频文件支持上一首/下一首导航
 * 
 * 支持的文件类型：@/constants/media.ts
 */
export default function FileViewer({ 
  filePath, 
  hasPrev, 
  hasNext, 
  onPrev, 
  onNext 
}: FileViewerProps) {
  const fileName = getFileName(filePath);
  const fileType = getFileType(filePath);

  return (
    <div className="h-full w-full">
      {renderViewer(fileType, filePath, fileName, { hasPrev, hasNext, onPrev, onNext })}
    </div>
  );
}
