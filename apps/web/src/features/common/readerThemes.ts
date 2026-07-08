/**
 * 阅读器主题色板
 *
 * 三套独立 palette：
 * - READER_OVERLAY_PALETTE：Ebook / MobileTxtReader 共用的暖色（#f7f5f0 系），
 *   同时承载 overlay UI（drawer / panel）和内容区（导航栏 / 进度条）样式。
 * - TXT_READER_PALETTE：TxtReader 的冷色（zinc 系）内容区样式，
 *   overlay UI 与内容区同色（paper 用 bg-white）。
 * - PDF_READER_PALETTE：PdfReader 专色板，含 canvasBg / shadow 等 PDF 渲染字段。
 *
 * 集中维护理由：阅读器散落的 hex 值（#f7f5f0、#f0e6d2、#1a1a1a 等）
 * 难以保证一致性，统一在此处定义后调用方按需选取字段。
 */

// ============================================================================
// ReaderOverlayPalette — Ebook / MobileTxtReader 共用（暖色系）
// ============================================================================

export type ReaderOverlayThemeName = "paper" | "parchment" | "dark";

export interface ReaderOverlayPalette {
  // 内容区
  bg: string;
  text: string;
  /** 与 border 同义；内容区用于分隔线（如顶部导航栏底边） */
  line: string;
  selection: string;
  selectionBg: string;
  selectionText: string;
  /** 顶部 / 底部固定导航栏背景 */
  navBg: string;
  navText: string;
  navBorder: string;
  progressBg: string;
  progressFill: string;
  /** 中文主题名 */
  name: string;
  // overlay UI
  border: string;
  hover: string;
  active: string;
  input: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;
  resultBg: string;
  highlight: string;
}

export const READER_OVERLAY_PALETTE: Record<ReaderOverlayThemeName, ReaderOverlayPalette> = {
  paper: {
    bg: "bg-[#f7f5f0]",
    text: "text-[#3d3d3d]",
    line: "border-[#e5e2d8]",
    selection: "selection:bg-[#d4d0c0] selection:text-[#2d2d2d]",
    selectionBg: "#d4d0c0",
    selectionText: "#2d2d2d",
    navBg: "bg-[#2d2d2d]/95",
    navText: "text-zinc-200",
    navBorder: "border-zinc-700",
    progressBg: "bg-zinc-700",
    progressFill: "bg-zinc-400",
    name: "纸质",
    border: "border-[#e5e2d8]",
    hover: "hover:bg-[#eeede6]",
    active: "bg-[#e5e2d8]",
    input: "bg-white border-[#e5e2d8] text-[#3d3d3d] placeholder:text-zinc-400",
    inputBg: "bg-white",
    inputBorder: "border-[#e5e2d8]",
    inputText: "text-[#3d3d3d]",
    placeholder: "text-zinc-400",
    resultBg: "bg-white",
    highlight: "bg-[#FFED94] text-[#3d3d3d]",
  },
  parchment: {
    bg: "bg-[#f0e6d2]",
    text: "text-[#4a3f2a]",
    line: "border-[#d4c9b0]",
    selection: "selection:bg-[#c9bd9f] selection:text-[#3d3220]",
    selectionBg: "#c9bd9f",
    selectionText: "#3d3220",
    navBg: "bg-[#2d2d2d]/95",
    navText: "text-zinc-200",
    navBorder: "border-zinc-700",
    progressBg: "bg-zinc-700",
    progressFill: "bg-zinc-400",
    name: "羊皮纸",
    border: "border-[#d4c9b0]",
    hover: "hover:bg-[#e6dcc0]",
    active: "bg-[#d4c9b0]",
    input: "bg-[#faf8f3] border-[#d4c9b0] text-[#4a3f2a] placeholder:text-[#a09070]",
    inputBg: "bg-[#faf8f3]",
    inputBorder: "border-[#d4c9b0]",
    inputText: "text-[#4a3f2a]",
    placeholder: "placeholder:text-[#a09070]",
    resultBg: "bg-[#faf8f3]",
    highlight: "bg-[#FFED94] text-[#4a3f2a]",
  },
  dark: {
    bg: "bg-[#1a1a1a]",
    text: "text-[#c5c5c5]",
    line: "border-[#333333]",
    selection: "selection:bg-[#444444] selection:text-[#ffffff]",
    selectionBg: "#444444",
    selectionText: "#ffffff",
    navBg: "bg-[#0a0a0a]/95",
    navText: "text-zinc-300",
    navBorder: "border-zinc-800",
    progressBg: "bg-zinc-800",
    progressFill: "bg-zinc-500",
    name: "夜间",
    border: "border-[#333333]",
    hover: "hover:bg-[#2a2a2a]",
    active: "bg-[#333333]",
    input: "bg-[#2a2a2a] border-[#444444] text-[#c5c5c5] placeholder:text-zinc-600",
    inputBg: "bg-[#2a2a2a]",
    inputBorder: "border-[#444444]",
    inputText: "text-[#c5c5c5]",
    placeholder: "placeholder:text-zinc-600",
    resultBg: "bg-[#222222]",
    highlight: "bg-yellow-600 text-white",
  },
};

// ============================================================================
// TxtReaderPalette — TxtReader 专用（zinc 冷色系）
// ============================================================================

export type TxtReaderThemeName = "paper" | "parchment" | "dark";

export interface TxtReaderPalette {
  bg: string;
  text: string;
  line: string;
  buttonHover: string;
  /** active 与 buttonHover 同色，保留独立字段便于语义化调用 */
  active: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  /** input 合并串（含 placeholder），便于 input 元素 className 直接使用 */
  input: string;
  selection: string;
  contentBg: string;
  navBg: string;
  navText: string;
  progressBg: string;
  progressFill: string;
  name: string;
  highlight: string;
  resultBg: string;
}

export const TXT_READER_PALETTE: Record<TxtReaderThemeName, TxtReaderPalette> = {
  paper: {
    bg: "bg-white",
    text: "text-zinc-800",
    line: "border-zinc-200",
    buttonHover: "hover:bg-zinc-100",
    active: "bg-zinc-100",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    inputText: "text-zinc-900",
    input: "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400",
    selection: "selection:bg-zinc-200 selection:text-zinc-900",
    contentBg: "bg-zinc-50",
    navBg: "bg-zinc-900/95",
    navText: "text-zinc-200",
    progressBg: "bg-zinc-700",
    progressFill: "bg-zinc-400",
    name: "纸质",
    highlight: "bg-yellow-200 text-zinc-900",
    resultBg: "bg-zinc-50",
  },
  parchment: {
    bg: "bg-[#f0e6d2]",
    text: "text-[#4a3f2a]",
    line: "border-[#d4c9b0]",
    buttonHover: "hover:bg-[#e6dcc0]",
    active: "bg-[#d4c9b0]",
    inputBg: "bg-[#faf8f3]",
    inputBorder: "border-[#d4c9b0]",
    inputText: "text-[#4a3f2a]",
    input: "bg-[#faf8f3] border-[#d4c9b0] text-[#4a3f2a] placeholder:text-[#a09070]",
    selection: "selection:bg-[#c9bd9f] selection:text-[#3d3220]",
    contentBg: "bg-[#f0e6d2]",
    navBg: "bg-zinc-900/95",
    navText: "text-zinc-200",
    progressBg: "bg-zinc-700",
    progressFill: "bg-zinc-400",
    name: "羊皮纸",
    highlight: "bg-[#FFED94] text-[#4a3f2a]",
    resultBg: "bg-[#faf8f3]",
  },
  dark: {
    bg: "bg-zinc-900",
    text: "text-zinc-200",
    line: "border-zinc-700",
    buttonHover: "hover:bg-zinc-800",
    active: "bg-zinc-800",
    inputBg: "bg-zinc-800",
    inputBorder: "border-zinc-600",
    inputText: "text-zinc-100",
    input: "bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500",
    selection: "selection:bg-zinc-700 selection:text-zinc-100",
    contentBg: "bg-zinc-950",
    navBg: "bg-black/95",
    navText: "text-zinc-300",
    progressBg: "bg-zinc-800",
    progressFill: "bg-zinc-500",
    name: "暗黑",
    highlight: "bg-yellow-700 text-white",
    resultBg: "bg-zinc-800/50",
  },
};

// ============================================================================
// PdfReaderPalette — PdfReader 专用
// ============================================================================

export type PdfReaderThemeName = "light" | "dark";

export interface PdfReaderPalette {
  navBg: string;
  bg: string;
  text: string;
  line: string;
  buttonHover: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  canvasBg: string;
  pageInfoBg: string;
  shadow: string;
}

export const PDF_READER_PALETTE: Record<PdfReaderThemeName, PdfReaderPalette> = {
  light: {
    navBg: "bg-white",
    bg: "bg-[#f4f5f6]",
    text: "text-zinc-800",
    line: "border-zinc-200",
    buttonHover: "hover:bg-zinc-100",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    inputText: "text-zinc-900",
    canvasBg: "white",
    pageInfoBg: "bg-zinc-100",
    shadow: "shadow-zinc-200",
  },
  dark: {
    navBg: "bg-zinc-900",
    bg: "bg-zinc-900",
    text: "text-zinc-200",
    line: "border-zinc-700",
    buttonHover: "hover:bg-zinc-800",
    inputBg: "bg-zinc-800",
    inputBorder: "border-zinc-600",
    inputText: "text-zinc-100",
    canvasBg: "#18181b",
    pageInfoBg: "bg-zinc-800",
    shadow: "shadow-black/50",
  },
};