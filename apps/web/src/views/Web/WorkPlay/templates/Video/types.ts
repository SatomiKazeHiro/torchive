/**
 * 0: 滚动(默认)，1: 顶部，2: 底部
 */
export type Mode = 0 | 1 | 2; 

export interface Danmu {
  /**
   * 弹幕文本
   */
  text: string;

  /**
   * 弹幕发送模式: 0: 滚动，1: 顶部，2: 底部
   */
  mode?: Mode;

  /**
   * 弹幕颜色
   */
  color?: string;

  /**
   * 弹幕出现的时间，单位为秒
   */
  time?: number;

  /**
   * 弹幕是否有描边, 默认为 false
   */
  border?: boolean;

  /**
   * 弹幕自定义样式
   */
  style?: Partial<CSSStyleDeclaration>;
}
