"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { ImageLayer } from '@/lib/layer';

interface ImageCropperProps {
  layer: ImageLayer;
  onApply: (cropData: CropData) => void;
  onCancel: () => void;
}

export interface CropData {
  x: number;      // 裁剪区域左上角 x（相对于原图）
  y: number;      // 裁剪区域左上角 y
  width: number;  // 裁剪宽度
  height: number; // 裁剪高度
}

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({ layer, onApply, onCancel }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  // 裁剪区域（相对于显示尺寸的百分比）
  const [crop, setCrop] = useState<CropState>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  
  const [isDragging, setIsDragging] = useState<'move' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: crop });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // 图片加载
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 计算显示尺寸（最大 500px）
      const maxSize = 500;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      setDisplaySize({
        width: img.width * scale,
        height: img.height * scale,
      });
      setImageLoaded(true);
    };
    img.src = layer.src;
  }, [layer.src]);

  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / displaySize.width) * 100,
      y: ((e.clientY - rect.top) / displaySize.height) * 100,
    };
  }, [displaySize]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize', handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getMousePosition(e);
    setIsDragging(type);
    setDragStart({ x: pos.x, y: pos.y, crop: { ...crop } });
    if (handle) setResizeHandle(handle);
  }, [crop, getMousePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const pos = getMousePosition(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (isDragging === 'move') {
      setCrop({
        ...dragStart.crop,
        x: Math.max(0, Math.min(100 - dragStart.crop.width, dragStart.crop.x + dx)),
        y: Math.max(0, Math.min(100 - dragStart.crop.height, dragStart.crop.y + dy)),
      });
    } else if (isDragging === 'resize' && resizeHandle) {
      let newCrop = { ...dragStart.crop };
      
      switch (resizeHandle) {
        case 'se':
          newCrop.width = Math.max(10, Math.min(100 - dragStart.crop.x, dragStart.crop.width + dx));
          newCrop.height = Math.max(10, Math.min(100 - dragStart.crop.y, dragStart.crop.height + dy));
          break;
        case 'sw':
          const newX = Math.max(0, Math.min(dragStart.crop.x + dragStart.crop.width - 10, dragStart.crop.x + dx));
          newCrop.width = dragStart.crop.x + dragStart.crop.width - newX;
          newCrop.x = newX;
          newCrop.height = Math.max(10, Math.min(100 - dragStart.crop.y, dragStart.crop.height + dy));
          break;
        case 'ne':
          newCrop.width = Math.max(10, Math.min(100 - dragStart.crop.x, dragStart.crop.width + dx));
          const newY = Math.max(0, Math.min(dragStart.crop.y + dragStart.crop.height - 10, dragStart.crop.y + dy));
          newCrop.height = dragStart.crop.y + dragStart.crop.height - newY;
          newCrop.y = newY;
          break;
        case 'nw':
          const newXnw = Math.max(0, Math.min(dragStart.crop.x + dragStart.crop.width - 10, dragStart.crop.x + dx));
          newCrop.width = dragStart.crop.x + dragStart.crop.width - newXnw;
          newCrop.x = newXnw;
          const newYnw = Math.max(0, Math.min(dragStart.crop.y + dragStart.crop.height - 10, dragStart.crop.y + dy));
          newCrop.height = dragStart.crop.y + dragStart.crop.height - newYnw;
          newCrop.y = newYnw;
          break;
      }
      
      setCrop(newCrop);
    }
  }, [isDragging, dragStart, resizeHandle, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setResizeHandle(null);
  }, []);

  const handleApply = useCallback(() => {
    // 转换为实际像素坐标
    const scale = layer.originalWidth / displaySize.width;
    onApply({
      x: (crop.x / 100) * layer.originalWidth,
      y: (crop.y / 100) * layer.originalHeight,
      width: (crop.width / 100) * layer.originalWidth,
      height: (crop.height / 100) * layer.originalHeight,
    });
  }, [crop, layer.originalWidth, layer.originalHeight, displaySize.width, onApply]);

  const handleReset = useCallback(() => {
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
  }, []);

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl border border-border max-w-lg w-full">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">裁剪图片</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* 裁剪区域 */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative mx-auto select-none"
            style={{ width: displaySize.width, height: displaySize.height }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 原图 */}
            <img
              ref={imageRef}
              src={layer.src}
              alt="Crop preview"
              className="w-full h-full object-contain"
              draggable={false}
            />

            {/* 遮罩层 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 上 */}
              <div 
                className="absolute bg-black/50"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${crop.y}%`,
                }}
              />
              {/* 下 */}
              <div 
                className="absolute bg-black/50"
                style={{
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${100 - crop.y - crop.height}%`,
                }}
              />
              {/* 左 */}
              <div 
                className="absolute bg-black/50"
                style={{
                  top: `${crop.y}%`,
                  left: 0,
                  width: `${crop.x}%`,
                  height: `${crop.height}%`,
                }}
              />
              {/* 右 */}
              <div 
                className="absolute bg-black/50"
                style={{
                  top: `${crop.y}%`,
                  right: 0,
                  width: `${100 - crop.x - crop.width}%`,
                  height: `${crop.height}%`,
                }}
              />
            </div>

            {/* 裁剪框 */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* 网格线 */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>

              {/* 角落手柄 */}
              {['nw', 'ne', 'se', 'sw'].map((handle) => (
                <div
                  key={handle}
                  className="absolute w-4 h-4 bg-white border-2 border-foreground rounded-sm cursor-pointer"
                  style={{
                    top: handle.includes('n') ? -8 : 'auto',
                    bottom: handle.includes('s') ? -8 : 'auto',
                    left: handle.includes('w') ? -8 : 'auto',
                    right: handle.includes('e') ? -8 : 'auto',
                    cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'resize', handle)}
                />
              ))}
            </div>
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            拖动裁剪框或拖动角落调整大小
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw size={16} />
            重置
          </button>
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-colors"
          >
            <Check size={16} />
            应用
          </button>
        </div>
      </div>
    </div>
  );
}
