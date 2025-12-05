"use client";

import React, { useState, useCallback } from 'react';
import {
  Type,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Crop,
  Image as ImageIcon,
} from 'lucide-react';
import { useLayerContext, TextLayer, ImageLayer, Layer } from '@/lib/layer';
import { ImageCropper, CropData } from './image-cropper';

interface PropertyPanelProps {
  onCropImage?: (layer: ImageLayer) => void;
}

export function PropertyPanel() {
  const { state, getSelectedLayer, updateLayer } = useLayerContext();
  const selectedLayer = getSelectedLayer();
  const [croppingLayer, setCroppingLayer] = useState<ImageLayer | null>(null);

  const handleCropApply = useCallback(async (cropData: CropData) => {
    if (!croppingLayer) return;

    // 创建裁剪后的图片
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cropData.width;
      canvas.height = cropData.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(
        img,
        cropData.x, cropData.y, cropData.width, cropData.height,
        0, 0, cropData.width, cropData.height
      );

      const croppedSrc = canvas.toDataURL('image/png');
      
      // 更新图层
      updateLayer(croppingLayer.id, {
        croppedSrc,
        cropX: cropData.x,
        cropY: cropData.y,
        cropWidth: cropData.width,
        cropHeight: cropData.height,
        // 更新显示尺寸以保持裁剪后的比例
        width: croppingLayer.width * (cropData.width / croppingLayer.originalWidth),
        height: croppingLayer.height * (cropData.height / croppingLayer.originalHeight),
        originalWidth: cropData.width,
        originalHeight: cropData.height,
      });
      
      setCroppingLayer(null);
    };
    img.src = croppingLayer.src;
  }, [croppingLayer, updateLayer]);

  if (!selectedLayer) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground text-center">
          选择一个图层以编辑属性
        </p>
      </div>
    );
  }

  return (
    <>
      {selectedLayer.type === 'text' ? (
        <TextLayerProperties layer={selectedLayer} onUpdate={updateLayer} />
      ) : (
        <ImageLayerProperties 
          layer={selectedLayer} 
          onUpdate={updateLayer}
          onCrop={() => setCroppingLayer(selectedLayer)}
        />
      )}
      
      {/* 裁剪对话框 */}
      {croppingLayer && (
        <ImageCropper
          layer={croppingLayer}
          onApply={handleCropApply}
          onCancel={() => setCroppingLayer(null)}
        />
      )}
    </>
  );
}

interface TextLayerPropertiesProps {
  layer: TextLayer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
}

const fontFamilies = [
  { name: 'Noto Sans SC', label: '思源黑体' },
  { name: 'Noto Serif SC', label: '思源宋体' },
  { name: 'Source Han Sans CN', label: '思源黑体 CN' },
  { name: 'Microsoft YaHei', label: '微软雅黑' },
  { name: 'SimHei', label: '黑体' },
  { name: 'SimSun', label: '宋体' },
  { name: 'KaiTi', label: '楷体' },
  { name: 'FangSong', label: '仿宋' },
  { name: 'Comic Sans MS', label: 'Comic Sans' },
  { name: 'Arial', label: 'Arial' },
  { name: 'Georgia', label: 'Georgia' },
  { name: 'Times New Roman', label: 'Times' },
  { name: 'Courier New', label: '等宽' },
  { name: 'Impact', label: 'Impact' },
  { name: 'Verdana', label: 'Verdana' },
  { name: 'Trebuchet MS', label: 'Trebuchet' },
];

const fontSizePresets = [24, 32, 48, 64, 96, 128, 160, 200, 256];

function TextLayerProperties({ layer, onUpdate }: TextLayerPropertiesProps) {
  const update = (updates: Partial<TextLayer>) => {
    onUpdate(layer.id, updates);
  };

  const formatValue = (value: number, suffix = '') => (
    <span className="text-xs text-foreground font-mono bg-muted px-2 py-0.5 rounded tabular-nums">
      {value}{suffix}
    </span>
  );

  return (
    <div className="space-y-3 md:space-y-4">
      {/* 文字内容 */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <label className="text-sm font-medium text-foreground mb-2 block">文字内容</label>
        <textarea
          value={layer.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="在这里输入文字..."
          className="w-full p-3 border border-border rounded-lg resize-none h-20 md:h-24 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground text-sm md:text-base"
        />
      </div>

      {/* 字体设置 */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Type size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">字体设置</span>
        </div>

        <div className="space-y-3 md:space-y-4">
          {/* 字体选择 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">字体</label>
            <select
              value={layer.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full p-2 md:p-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              {fontFamilies.map((font) => (
                <option key={font.name} value={font.name}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* 自动适配字号 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">字号自动适配</label>
              <button
                onClick={() => update({ autoFit: !layer.autoFit })}
                className={`relative w-11 h-6 rounded-full transition-colors border ${
                  layer.autoFit 
                    ? 'bg-foreground border-foreground' 
                    : 'bg-muted border-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    layer.autoFit ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {layer.autoFit 
                ? '根据最大行宽自动调整字号'
                : '使用固定字号'}
            </p>
          </div>

          {/* 最大行宽（自动适配时显示） */}
          {layer.autoFit && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">最大行宽</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    max="3000"
                    value={layer.maxLineWidth}
                    onChange={(e) => update({ maxLineWidth: Math.min(3000, Math.max(100, Number(e.target.value))) })}
                    className="w-16 md:w-20 px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <input
                type="range"
                min="500"
                max="2500"
                step="20"
                value={layer.maxLineWidth}
                onChange={(e) => update({ maxLineWidth: Number(e.target.value) })}
                className="w-full accent-foreground h-2"
              />
            </div>
          )}

          {/* 字号（非自动适配时显示） */}
          {!layer.autoFit && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">字号</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="12"
                    max="500"
                    value={layer.fontSize}
                    onChange={(e) => update({ fontSize: Math.min(500, Math.max(12, Number(e.target.value))) })}
                    className="w-14 md:w-16 px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <input
                type="range"
                min="12"
                max="256"
                value={layer.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-full accent-foreground h-2"
              />
              <div className="flex flex-wrap gap-1 md:gap-1.5 mt-2">
                {fontSizePresets.map((size) => (
                  <button
                    key={size}
                    onClick={() => update({ fontSize: size })}
                    className={`px-1.5 md:px-2 py-1 text-xs rounded transition-colors ${
                      layer.fontSize === size
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 行高 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-muted-foreground">行高</label>
              {formatValue(Number(layer.lineHeight.toFixed(1)))}
            </div>
            <input
              type="range"
              min="0.8"
              max="4"
              step="0.1"
              value={layer.lineHeight}
              onChange={(e) => update({ lineHeight: Number(e.target.value) })}
              className="w-full accent-foreground h-2"
            />
          </div>

          {/* 字间距 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-muted-foreground">字间距</label>
              {formatValue(layer.letterSpacing, 'px')}
            </div>
            <input
              type="range"
              min="-5"
              max="20"
              value={layer.letterSpacing}
              onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
              className="w-full accent-foreground h-2"
            />
          </div>

          {/* 颜色 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={layer.color}
                onChange={(e) => update({ color: e.target.value })}
                className="w-8 h-8 md:w-10 md:h-10 rounded cursor-pointer border border-border bg-transparent flex-shrink-0"
              />
              <input
                type="text"
                value={layer.color}
                onChange={(e) => update({ color: e.target.value })}
                className="flex-1 min-w-0 p-2 border border-border rounded-lg bg-background text-foreground font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => update({ fontWeight: layer.fontWeight === 'normal' ? 'bold' : 'normal' })}
                className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg border transition-colors flex items-center justify-center ${
                  layer.fontWeight === 'bold'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-border hover:border-muted-foreground'
                }`}
                title="粗体"
              >
                <span className="font-bold text-sm">B</span>
              </button>
            </div>
          </div>

          {/* 对齐方式 */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">对齐方式</label>
            <div className="flex gap-2">
              {[
                { value: 'left' as const, icon: AlignLeft },
                { value: 'center' as const, icon: AlignCenter },
                { value: 'right' as const, icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => update({ textAlign: value })}
                  className={`flex-1 p-2 md:p-2.5 rounded-lg border transition-colors ${
                    layer.textAlign === value
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  <Icon size={16} className="mx-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 变换设置 */}
      <TransformProperties layer={layer} onUpdate={onUpdate} />
    </div>
  );
}

interface ImageLayerPropertiesProps {
  layer: ImageLayer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onCrop: () => void;
}

function ImageLayerProperties({ layer, onUpdate, onCrop }: ImageLayerPropertiesProps) {
  const update = (updates: Partial<ImageLayer>) => {
    onUpdate(layer.id, updates);
  };

  const formatValue = (value: number, suffix = '') => (
    <span className="text-xs text-foreground font-mono bg-muted px-2 py-0.5 rounded tabular-nums">
      {Math.round(value)}{suffix}
    </span>
  );

  return (
    <div className="space-y-3 md:space-y-4">
      {/* 图片信息 */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">图片设置</span>
        </div>

        <div className="space-y-3 md:space-y-4">
          {/* 裁剪按钮 */}
          <button
            onClick={onCrop}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent text-foreground hover:bg-accent/80 transition-colors font-medium"
          >
            <Crop size={16} />
            裁剪图片
          </button>

          {/* 透明度 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-muted-foreground">透明度</label>
              {formatValue(layer.opacity * 100, '%')}
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={layer.opacity}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              className="w-full accent-foreground h-2"
            />
          </div>

          {/* 尺寸 */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">宽度</label>
              <input
                type="number"
                value={Math.round(layer.width)}
                onChange={(e) => update({ width: Number(e.target.value) })}
                className="w-full px-2 md:px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">高度</label>
              <input
                type="number"
                value={Math.round(layer.height)}
                onChange={(e) => update({ height: Number(e.target.value) })}
                className="w-full px-2 md:px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* 重置按钮 */}
          <button
            onClick={() => update({
              width: layer.originalWidth,
              height: layer.originalHeight,
              croppedSrc: undefined,
              cropX: undefined,
              cropY: undefined,
              cropWidth: undefined,
              cropHeight: undefined,
            })}
            className="w-full py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
          >
            重置为原始尺寸
          </button>
        </div>
      </div>

      {/* 变换设置 */}
      <TransformProperties layer={layer} onUpdate={onUpdate} />
    </div>
  );
}

interface TransformPropertiesProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
}

function TransformProperties({ layer, onUpdate }: TransformPropertiesProps) {
  const update = (updates: Partial<Layer>) => {
    onUpdate(layer.id, updates);
  };

  const formatValue = (value: number, suffix = '') => (
    <span className="text-xs text-foreground font-mono bg-muted px-2 py-0.5 rounded tabular-nums">
      {Math.round(value)}{suffix}
    </span>
  );

  return (
    <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Move size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">变换</span>
      </div>

      <div className="space-y-3 md:space-y-4">
        {/* 位置 */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">X 位置</label>
            <input
              type="number"
              value={Math.round(layer.x)}
              onChange={(e) => update({ x: Number(e.target.value) })}
              className="w-full px-2 md:px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Y 位置</label>
            <input
              type="number"
              value={Math.round(layer.y)}
              onChange={(e) => update({ y: Number(e.target.value) })}
              className="w-full px-2 md:px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* 旋转 */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs text-muted-foreground">旋转</label>
            {formatValue(layer.rotation, '°')}
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={layer.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="w-full accent-foreground h-2"
          />
          <div className="flex gap-1 md:gap-2 mt-2">
            {[-90, -45, 0, 45, 90].map((angle) => (
              <button
                key={angle}
                onClick={() => update({ rotation: angle })}
                className={`flex-1 py-1 md:py-1.5 text-xs rounded-lg border transition-colors ${
                  layer.rotation === angle
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'
                }`}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>

        {/* 透明度（仅文字图层在这里显示） */}
        {layer.type === 'text' && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-muted-foreground">透明度</label>
              {formatValue(layer.opacity * 100, '%')}
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={layer.opacity}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              className="w-full accent-foreground h-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
