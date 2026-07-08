import { useState, useEffect, useCallback, useRef } from "react";
import { useUnmount } from "ahooks";

interface ColorResult {
  /** 主色调（处理后的深色版本，适合作为背景） */
  dominantColor: string;
  /** 渐变用的次要颜色 */
  secondaryColor: string;
  /** 是否正在计算 */
  isLoading: boolean;
  /** 是否已加载完成 */
  isLoaded: boolean;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 从图片 URL 提取主色调（使用 K-means 聚类）
 * 
 * 处理流程：
 1. 缩小图片以提高性能
 * 2. 采样有效颜色（跳过透明、低饱和度和高亮像素）
 * 3. 使用 K-means 聚类找出主色调
 * 4. 处理颜色使其适合作为深色背景
 * 
 * @param imageUrl - 图片 URL
 * @returns 主色调、次要色调和加载状态
 */
// 默认暗色背景（用于音乐播放器）
const DEFAULT_DARK_COLORS: ColorResult = {
  dominantColor: "rgba(26, 26, 46, 0.92)", // #1a1a2e
  secondaryColor: "rgba(22, 33, 62, 0.88)", // #16213e
  isLoading: false,
  isLoaded: false,
};

// 默认亮色背景（用于其他场景）
const DEFAULT_LIGHT_COLORS: ColorResult = {
  dominantColor: "rgba(255, 255, 255, 1)",
  secondaryColor: "rgba(250, 250, 250, 1)",
  isLoading: false,
  isLoaded: false,
};

interface UseCoverColorOptions {
  /** 默认使用暗色背景 */
  defaultDark?: boolean;
}

export function useCoverColor(imageUrl: string | null, options: UseCoverColorOptions = {}): ColorResult {
  const { defaultDark = false } = options;
  const defaultColors = defaultDark ? DEFAULT_DARK_COLORS : DEFAULT_LIGHT_COLORS;
  
  const [result, setResult] = useState<ColorResult>(defaultColors);
  
  // 用于取消正在进行的图片加载
  const abortControllerRef = useRef<AbortController | null>(null);

  const extractColor = useCallback(async (url: string) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setResult((prev) => ({ ...prev, isLoading: true }));

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setResult((prev) => ({ ...prev, isLoading: false }));
            return;
          }

          // 缩小图片以提高性能
          const size = 80;
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);

          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;

          // 收集颜色样本（跳过透明和低饱和度像素）
          const colors: RGB[] = [];
          for (let i = 0; i < data.length; i += 12) { // 每 3 个像素采样一次
            const alpha = data[i + 3];
            if (alpha < 200) continue; // 跳过透明像素

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 跳过低饱和度像素（接近灰度）
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            if (saturation < 0.15) continue; // 跳过接近黑白的像素

            // 跳过高亮像素（可能是反光或文字）
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness > 240) continue;

            colors.push({ r, g, b });
          }

          if (colors.length < 10) {
            // 有效颜色太少，使用默认
            setResult({
              ...defaultColors,
              isLoading: false,
              isLoaded: true,
            });
            return;
          }

          // K-means 聚类 (k=3，最多 20 次迭代)
          const clusters = kMeans(colors, 3, 20);
          
          // 选择最大的簇作为主色调，第二大的作为次要色调
          const sortedClusters = [...clusters].sort((a, b) => b.points.length - a.points.length);
          const mainCluster = sortedClusters[0];
          const secondaryCluster = sortedClusters[1] || mainCluster;

          // 计算主色和次要色
          const mainColor = mainCluster.centroid;
          const secondColor = secondaryCluster.centroid;

          // 处理颜色使其适合作为背景
          const processedColor = processColorForBackground(mainColor);
          const processedColor2 = processColorForBackground(secondColor, 0.88);

          setResult({
            dominantColor: processedColor,
            secondaryColor: processedColor2,
            isLoading: false,
            isLoaded: true,
          });
        } catch (err) {
          console.warn("Color extraction failed:", err);
          setResult({
            ...defaultColors,
            isLoading: false,
            isLoaded: true,
          });
        }
      };

      img.onerror = () => {
        setResult({
          ...defaultColors,
          isLoading: false,
          isLoaded: true,
        });
      };

      img.src = url;
    } catch (err) {
      console.warn("Color extraction failed:", err);
      setResult({
        ...defaultColors,
        isLoading: false,
        isLoaded: true,
      });
    }
    // defaultColors 在 hook 内部基于 defaultDark 计算（值会随 render 变化），故不放入 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!imageUrl) {
      setResult({
        ...defaultColors,
        isLoading: false,
        isLoaded: false,
      });
      return;
    }

    extractColor(imageUrl);
  }, [imageUrl, extractColor, defaultColors]);

  // 使用 useUnmount 确保组件卸载时取消图片加载
  useUnmount(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  });

  return result;
}

// K-means 聚类算法
function kMeans(colors: RGB[], k: number, maxIterations: number) {
  // 随机初始化中心点
  const centroids: RGB[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < k; i++) {
    let idx = Math.floor(Math.random() * colors.length);
    while (used.has(idx)) {
      idx = Math.floor(Math.random() * colors.length);
    }
    used.add(idx);
    centroids.push({ ...colors[idx] });
  }

  // 迭代优化
  for (let iter = 0; iter < maxIterations; iter++) {
    // 分配点到最近的中心
    const clusters: { centroid: RGB; points: RGB[] }[] = centroids.map(c => ({
      centroid: c,
      points: [],
    }));

    for (const color of colors) {
      let minDist = Infinity;
      let closestIdx = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(color, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      
      clusters[closestIdx].points.push(color);
    }

    // 重新计算中心点
    let changed = false;
    for (let i = 0; i < k; i++) {
      const cluster = clusters[i];
      if (cluster.points.length === 0) continue;
      
      const newCentroid = {
        r: Math.round(cluster.points.reduce((s, p) => s + p.r, 0) / cluster.points.length),
        g: Math.round(cluster.points.reduce((s, p) => s + p.g, 0) / cluster.points.length),
        b: Math.round(cluster.points.reduce((s, p) => s + p.b, 0) / cluster.points.length),
      };
      
      if (colorDistance(newCentroid, centroids[i]) > 0.1) {
        centroids[i] = newCentroid;
        changed = true;
      }
    }

    if (!changed) break;
  }

  // 返回最终聚类结果
  const finalClusters: { centroid: RGB; points: RGB[] }[] = centroids.map(c => ({
    centroid: c,
    points: [],
  }));

  for (const color of colors) {
    let minDist = Infinity;
    let closestIdx = 0;
    
    for (let i = 0; i < centroids.length; i++) {
      const dist = colorDistance(color, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    
    finalClusters[closestIdx].points.push(color);
  }

  return finalClusters;
}

// 计算颜色距离（欧几里得距离）
function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + 
    Math.pow(a.g - b.g, 2) + 
    Math.pow(a.b - b.b, 2)
  );
}

// 处理颜色使其适合作为背景
function processColorForBackground(
  color: RGB,
  alpha: number = 0.92
): string {
  // 转换为 HSL
  const hsl = rgbToHsl(color.r, color.g, color.b);

  // 降低饱和度（避免太鲜艳）
  hsl.s = Math.min(hsl.s * 0.5, 0.45);

  // 降低明度（确保文字可读性）
  hsl.l = Math.min(Math.max(hsl.l * 0.5, 0.2), 0.4);

  // 转回 RGB
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// RGB 转 HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

// HSL 转 RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
