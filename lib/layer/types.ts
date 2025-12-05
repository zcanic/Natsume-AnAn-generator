// 图层系统核心类型定义

export type LayerType = 'text' | 'image';

/** 图层基础接口 */
export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;         // 图层名称（用于显示）
  x: number;            // 中心点 x 坐标（像素）
  y: number;            // 中心点 y 坐标（像素）
  width: number;        // 宽度（像素）
  height: number;       // 高度（像素）
  rotation: number;     // 旋转角度（度）
  visible: boolean;     // 是否可见
  locked: boolean;      // 是否锁定
  opacity: number;      // 透明度 0-1
}

/** 文字图层 */
export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;     // 基础字号（autoFit 关闭时使用）
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  autoFit: boolean;     // 是否自动适配字号
  maxLineWidth: number; // 最大行宽（像素），用于自动适配
  actualFontSize?: number; // 自动适配后的实际字号（运行时计算）
}

/** 图片图层 */
export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;          // 图片源（URL 或 Base64）
  originalWidth: number;  // 原始宽度
  originalHeight: number; // 原始高度
  // 裁剪数据（可选，存储裁剪后的图片数据）
  croppedSrc?: string;    // 裁剪后的图片 Base64
  cropX?: number;         // 裁剪区域起始 x
  cropY?: number;         // 裁剪区域起始 y
  cropWidth?: number;     // 裁剪宽度
  cropHeight?: number;    // 裁剪高度
}

/** 联合图层类型 */
export type Layer = TextLayer | ImageLayer;

/** 画布状态 */
export interface CanvasState {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage: ImageLayer | null;  // 底图（特殊处理，始终在最底层）
  layers: Layer[];                     // 图层列表（按 zIndex 排序）
  selectedLayerId: string | null;
}

/** 图层操作 Action 类型 */
export type LayerAction =
  | { type: 'SET_CANVAS_SIZE'; width: number; height: number }
  | { type: 'SET_BACKGROUND_COLOR'; color: string }
  | { type: 'SET_BACKGROUND_IMAGE'; layer: ImageLayer | null }
  | { type: 'ADD_LAYER'; layer: Layer }
  | { type: 'REMOVE_LAYER'; id: string }
  | { type: 'UPDATE_LAYER'; id: string; updates: Partial<Layer> }
  | { type: 'SELECT_LAYER'; id: string | null }
  | { type: 'REORDER_LAYERS'; fromIndex: number; toIndex: number }
  | { type: 'MOVE_LAYER_UP'; id: string }
  | { type: 'MOVE_LAYER_DOWN'; id: string }
  | { type: 'DUPLICATE_LAYER'; id: string }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; id: string }
  | { type: 'TOGGLE_LAYER_LOCK'; id: string }
  | { type: 'LOAD_STATE'; state: CanvasState }
  | { type: 'RESET' };

/** 默认文字图层属性 */
export const DEFAULT_TEXT_LAYER: Omit<TextLayer, 'id' | 'name' | 'x' | 'y'> = {
  type: 'text',
  content: '何意味',
  width: 400,
  height: 100,
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
  fontFamily: 'Source Han Sans CN',
  fontSize: 256,
  fontWeight: 'bold',
  color: '#1a1a1a',
  textAlign: 'center',
  lineHeight: 1.2,
  letterSpacing: 0,
  autoFit: true,
  maxLineWidth: 1280, // 默认最大行宽
};

/** 默认画布状态 */
export const DEFAULT_CANVAS_STATE: CanvasState = {
  width: 1024,
  height: 1024,
  backgroundColor: '#ffffff',
  backgroundImage: null,
  layers: [],
  selectedLayerId: null,
};

/** 生成唯一 ID */
export function generateId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** 创建新的文字图层 */
export function createTextLayer(
  overrides: Partial<TextLayer> = {},
  canvasWidth: number = 1024,
  canvasHeight: number = 1024
): TextLayer {
  const id = generateId();
  return {
    ...DEFAULT_TEXT_LAYER,
    id,
    name: `文字 ${id.slice(-4)}`,
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    ...overrides,
  };
}

/** 创建新的图片图层 */
export function createImageLayer(
  src: string,
  originalWidth: number,
  originalHeight: number,
  canvasWidth: number = 1024,
  canvasHeight: number = 1024
): ImageLayer {
  const id = generateId();
  // 缩放图片以适应画布（最大为画布的 80%）
  const maxSize = Math.min(canvasWidth, canvasHeight) * 0.8;
  const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight, 1);
  
  return {
    id,
    type: 'image',
    name: `图片 ${id.slice(-4)}`,
    src,
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    width: originalWidth * scale,
    height: originalHeight * scale,
    originalWidth,
    originalHeight,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 1,
  };
}
