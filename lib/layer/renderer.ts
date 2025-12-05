// Canvas 渲染引擎

import { CanvasState, Layer, TextLayer, ImageLayer } from './types';

/** 图片缓存 */
const imageCache = new Map<string, HTMLImageElement>();

/** 加载图片并缓存 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** 清除图片缓存 */
export function clearImageCache() {
  imageCache.clear();
}

/** 计算单行文字在指定字号下的宽度 */
function measureTextWidth(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  fontSize: number, 
  fontWeight: string, 
  fontFamily: string,
  letterSpacing: number
): number {
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  if (letterSpacing !== 0) {
    (ctx as any).letterSpacing = `${letterSpacing}px`;
  }
  return ctx.measureText(text).width;
}

/** 计算最佳字号：使每行都能 fit 进最大行宽 */
function calculateOptimalFontSize(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxWidth: number,
  baseFontSize: number,
  fontWeight: string,
  fontFamily: string,
  letterSpacing: number
): number {
  if (lines.length === 0 || lines.every(l => l === '')) return baseFontSize;

  const MIN_FONT_SIZE = 24;
  const MAX_FONT_SIZE = 1000; // 无上限，但设一个合理的最大值
  let optimalSize = MAX_FONT_SIZE;

  // 对每一行找到最大能 fit 的字号
  for (const line of lines) {
    if (line === '') continue;
    
    let testSize = MAX_FONT_SIZE;
    let lineWidth = measureTextWidth(ctx, line, testSize, fontWeight, fontFamily, letterSpacing);
    
    // 如果当前字号超出宽度，逐步减小
    while (lineWidth > maxWidth && testSize > MIN_FONT_SIZE) {
      testSize -= 4; // 每次减少 4px
      lineWidth = measureTextWidth(ctx, line, testSize, fontWeight, fontFamily, letterSpacing);
    }
    
    // 取所有行中最小的字号
    optimalSize = Math.min(optimalSize, testSize);
  }

  return Math.max(optimalSize, MIN_FONT_SIZE);
}

/** 绘制文字图层 */
function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer): number {
  if (!layer.visible || !layer.content.trim()) return layer.fontSize;

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);

  // 分行
  const lines = layer.content.split('\n');
  
  // 计算实际字号
  let fontSize = layer.fontSize;
  if (layer.autoFit && layer.maxLineWidth > 0) {
    fontSize = calculateOptimalFontSize(
      ctx, 
      lines, 
      layer.maxLineWidth, 
      layer.fontSize,
      layer.fontWeight,
      layer.fontFamily,
      layer.letterSpacing
    );
  }

  // 设置字体
  ctx.font = `${layer.fontWeight} ${fontSize}px "${layer.fontFamily}", sans-serif`;
  ctx.fillStyle = layer.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = layer.textAlign;

  // 设置字间距
  if (layer.letterSpacing !== 0) {
    (ctx as any).letterSpacing = `${layer.letterSpacing}px`;
  }

  const lineHeightPx = fontSize * layer.lineHeight;
  const totalHeight = lines.length * lineHeightPx;
  const startY = -totalHeight / 2 + lineHeightPx / 2;

  // 根据对齐方式计算 x 偏移
  let drawX = 0;
  if (layer.textAlign === 'left') {
    drawX = -layer.maxLineWidth / 2;
  } else if (layer.textAlign === 'right') {
    drawX = layer.maxLineWidth / 2;
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, drawX, startY + index * lineHeightPx);
  });

  ctx.restore();
  
  return fontSize; // 返回实际使用的字号
}


/** 绘制图片图层 */
async function drawImageLayer(ctx: CanvasRenderingContext2D, layer: ImageLayer, img: HTMLImageElement) {
  if (!layer.visible) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  
  // 如果有裁剪后的图片，使用裁剪后的
  if (layer.croppedSrc) {
    try {
      const croppedImg = await loadImage(layer.croppedSrc);
      ctx.drawImage(croppedImg, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    } catch {
      // 回退到原图
      ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    }
  } else {
    ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
  }
  
  ctx.restore();
}

/** 绘制选中框 */
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  color: string = '#0066ff'
) {
  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);

  const halfW = layer.width / 2;
  const halfH = layer.height / 2;

  // 边框
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(-halfW, -halfH, layer.width, layer.height);
  ctx.setLineDash([]);

  // 控制点
  const handleSize = 10;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const handles = [
    { x: -halfW, y: -halfH },  // 左上
    { x: halfW, y: -halfH },   // 右上
    { x: halfW, y: halfH },    // 右下
    { x: -halfW, y: halfH },   // 左下
    { x: 0, y: -halfH },       // 上中
    { x: halfW, y: 0 },        // 右中
    { x: 0, y: halfH },        // 下中
    { x: -halfW, y: 0 },       // 左中
  ];

  handles.forEach(({ x, y }) => {
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  });

  // 旋转手柄
  ctx.beginPath();
  ctx.moveTo(0, -halfH);
  ctx.lineTo(0, -halfH - 30);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, -halfH - 30, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/** 主渲染函数 */
export async function renderCanvas(
  canvas: HTMLCanvasElement,
  state: CanvasState,
  showSelection: boolean = true
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 设置画布大小
  canvas.width = state.width;
  canvas.height = state.height;

  // 清空画布
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, state.width, state.height);

  // 绘制背景图
  if (state.backgroundImage) {
    try {
      const bgImg = await loadImage(state.backgroundImage.src);
      drawImageLayer(ctx, state.backgroundImage, bgImg);
    } catch (e) {
      console.error('Failed to load background image:', e);
    }
  }

  // 绘制所有图层
  for (const layer of state.layers) {
    if (layer.type === 'text') {
      drawTextLayer(ctx, layer);
    } else if (layer.type === 'image') {
      try {
        const img = await loadImage(layer.src);
        drawImageLayer(ctx, layer, img);
      } catch (e) {
        console.error('Failed to load layer image:', e);
      }
    }
  }

  // 绘制选中框
  if (showSelection && state.selectedLayerId) {
    const selectedLayer = state.layers.find((l) => l.id === state.selectedLayerId);
    if (selectedLayer && !selectedLayer.locked) {
      drawSelectionBox(ctx, selectedLayer);
    }
  }
}

/** 导出为图片（不带选中框） */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  state: CanvasState,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0
): Promise<Blob | null> {
  // 先渲染不带选中框的版本
  await renderCanvas(canvas, { ...state, selectedLayerId: null }, false);
  
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      `image/${format}`,
      quality
    );
  });
}

/** 检测点击命中的图层 */
export function hitTestLayer(
  x: number,
  y: number,
  layer: Layer
): boolean {
  // 将点转换到图层的局部坐标系
  const cos = Math.cos((-layer.rotation * Math.PI) / 180);
  const sin = Math.sin((-layer.rotation * Math.PI) / 180);
  
  const dx = x - layer.x;
  const dy = y - layer.y;
  
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  const halfW = layer.width / 2;
  const halfH = layer.height / 2;
  
  return localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH;
}

/** 从上到下检测点击命中的图层（返回最上层的） */
export function hitTestLayers(
  x: number,
  y: number,
  layers: Layer[]
): Layer | null {
  // 从后往前遍历（后面的在上层）
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.visible && !layer.locked && hitTestLayer(x, y, layer)) {
      return layer;
    }
  }
  return null;
}

/** 控制手柄类型 */
export type HandleType = 
  | 'tl' | 'tr' | 'br' | 'bl'  // 四角
  | 'tm' | 'rm' | 'bm' | 'lm'  // 四边中点
  | 'rotate'                   // 旋转
  | null;

/** 检测点击命中的控制手柄 */
export function hitTestHandle(
  x: number,
  y: number,
  layer: Layer,
  handleSize: number = 12
): HandleType {
  const cos = Math.cos((-layer.rotation * Math.PI) / 180);
  const sin = Math.sin((-layer.rotation * Math.PI) / 180);
  
  const dx = x - layer.x;
  const dy = y - layer.y;
  
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  
  const halfW = layer.width / 2;
  const halfH = layer.height / 2;
  const hs = handleSize / 2;
  
  // 旋转手柄
  if (Math.abs(localX) < hs && localY < -halfH - 20 && localY > -halfH - 40) {
    return 'rotate';
  }
  
  // 四角
  if (Math.abs(localX + halfW) < hs && Math.abs(localY + halfH) < hs) return 'tl';
  if (Math.abs(localX - halfW) < hs && Math.abs(localY + halfH) < hs) return 'tr';
  if (Math.abs(localX - halfW) < hs && Math.abs(localY - halfH) < hs) return 'br';
  if (Math.abs(localX + halfW) < hs && Math.abs(localY - halfH) < hs) return 'bl';
  
  // 四边中点
  if (Math.abs(localX) < hs && Math.abs(localY + halfH) < hs) return 'tm';
  if (Math.abs(localX - halfW) < hs && Math.abs(localY) < hs) return 'rm';
  if (Math.abs(localX) < hs && Math.abs(localY - halfH) < hs) return 'bm';
  if (Math.abs(localX + halfW) < hs && Math.abs(localY) < hs) return 'lm';
  
  return null;
}
