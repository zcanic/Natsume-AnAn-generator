"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  useLayerContext,
  renderCanvas,
  exportCanvas,
  hitTestLayers,
  hitTestHandle,
  HandleType,
  Layer,
} from '@/lib/layer';

interface CanvasEditorProps {
  className?: string;
}

type DragMode = 'none' | 'move' | 'resize' | 'rotate';

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  layerStartX: number;
  layerStartY: number;
  layerStartWidth: number;
  layerStartHeight: number;
  layerStartRotation: number;
  handle: HandleType;
}

export function CanvasEditor({ className = '' }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, selectLayer, updateLayer, getSelectedLayer } = useLayerContext();
  
  const [dragState, setDragState] = useState<DragState>({
    mode: 'none',
    startX: 0,
    startY: 0,
    layerStartX: 0,
    layerStartY: 0,
    layerStartWidth: 0,
    layerStartHeight: 0,
    layerStartRotation: 0,
    handle: null,
  });

  const [viewScale, setViewScale] = useState(1);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

  // 计算画布到屏幕的坐标转换
  const getCanvasCoordinates = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // 渲染画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderCanvas(canvas, state, dragState.mode === 'none');
  }, [state, dragState.mode]);

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e);
    const selectedLayer = getSelectedLayer();

    // 首先检查是否点击了控制手柄
    if (selectedLayer && !selectedLayer.locked) {
      const handle = hitTestHandle(x, y, selectedLayer);
      if (handle) {
        setDragState({
          mode: handle === 'rotate' ? 'rotate' : 'resize',
          startX: x,
          startY: y,
          layerStartX: selectedLayer.x,
          layerStartY: selectedLayer.y,
          layerStartWidth: selectedLayer.width,
          layerStartHeight: selectedLayer.height,
          layerStartRotation: selectedLayer.rotation,
          handle,
        });
        return;
      }
    }

    // 检查点击了哪个图层
    const hitLayer = hitTestLayers(x, y, state.layers);
    
    if (hitLayer) {
      selectLayer(hitLayer.id);
      setDragState({
        mode: 'move',
        startX: x,
        startY: y,
        layerStartX: hitLayer.x,
        layerStartY: hitLayer.y,
        layerStartWidth: hitLayer.width,
        layerStartHeight: hitLayer.height,
        layerStartRotation: hitLayer.rotation,
        handle: null,
      });
    } else {
      // 点击空白处取消选择
      selectLayer(null);
    }
  }, [getCanvasCoordinates, getSelectedLayer, selectLayer, state.layers]);

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.mode === 'none') return;

    const { x, y } = getCanvasCoordinates(e);
    const selectedLayer = getSelectedLayer();
    if (!selectedLayer) return;

    const dx = x - dragState.startX;
    const dy = y - dragState.startY;

    if (dragState.mode === 'move') {
      updateLayer(selectedLayer.id, {
        x: dragState.layerStartX + dx,
        y: dragState.layerStartY + dy,
      });
    } else if (dragState.mode === 'resize') {
      // 根据拖拽的手柄计算新的尺寸
      const { handle } = dragState;
      let newWidth = dragState.layerStartWidth;
      let newHeight = dragState.layerStartHeight;
      let newX = dragState.layerStartX;
      let newY = dragState.layerStartY;

      // 将移动量转换到图层的局部坐标系
      const cos = Math.cos((-selectedLayer.rotation * Math.PI) / 180);
      const sin = Math.sin((-selectedLayer.rotation * Math.PI) / 180);
      const localDx = dx * cos - dy * sin;
      const localDy = dx * sin + dy * cos;

      switch (handle) {
        case 'tr':
          newWidth = Math.max(20, dragState.layerStartWidth + localDx);
          newHeight = Math.max(20, dragState.layerStartHeight - localDy);
          break;
        case 'tl':
          newWidth = Math.max(20, dragState.layerStartWidth - localDx);
          newHeight = Math.max(20, dragState.layerStartHeight - localDy);
          break;
        case 'br':
          newWidth = Math.max(20, dragState.layerStartWidth + localDx);
          newHeight = Math.max(20, dragState.layerStartHeight + localDy);
          break;
        case 'bl':
          newWidth = Math.max(20, dragState.layerStartWidth - localDx);
          newHeight = Math.max(20, dragState.layerStartHeight + localDy);
          break;
        case 'rm':
          newWidth = Math.max(20, dragState.layerStartWidth + localDx);
          break;
        case 'lm':
          newWidth = Math.max(20, dragState.layerStartWidth - localDx);
          break;
        case 'tm':
          newHeight = Math.max(20, dragState.layerStartHeight - localDy);
          break;
        case 'bm':
          newHeight = Math.max(20, dragState.layerStartHeight + localDy);
          break;
      }

      updateLayer(selectedLayer.id, {
        width: newWidth,
        height: newHeight,
      });
    } else if (dragState.mode === 'rotate') {
      // 计算旋转角度
      const centerX = selectedLayer.x;
      const centerY = selectedLayer.y;
      
      const startAngle = Math.atan2(
        dragState.startY - centerY,
        dragState.startX - centerX
      );
      const currentAngle = Math.atan2(y - centerY, x - centerX);
      
      let angleDiff = ((currentAngle - startAngle) * 180) / Math.PI;
      let newRotation = dragState.layerStartRotation + angleDiff;
      
      // 按 Shift 键时吸附到 15 度
      if (e.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      
      // 保持在 -180 到 180 之间
      while (newRotation > 180) newRotation -= 360;
      while (newRotation < -180) newRotation += 360;
      
      updateLayer(selectedLayer.id, { rotation: newRotation });
    }
  }, [dragState, getCanvasCoordinates, getSelectedLayer, updateLayer]);

  // 鼠标释放
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, mode: 'none', handle: null }));
  }, []);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedLayer = getSelectedLayer();
      if (!selectedLayer || selectedLayer.locked) return;

      // 删除
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // 确保不是在输入框中
        if ((e.target as HTMLElement).tagName !== 'INPUT' && 
            (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          selectLayer(null);
          updateLayer(selectedLayer.id, {}); // Trigger re-render
          // 使用 dispatch 删除
          const ctx = (window as any).__layerContext;
          if (ctx) {
            ctx.dispatch({ type: 'REMOVE_LAYER', id: selectedLayer.id });
          }
        }
      }

      // 方向键移动
      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          updateLayer(selectedLayer.id, { y: selectedLayer.y - step });
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateLayer(selectedLayer.id, { y: selectedLayer.y + step });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          updateLayer(selectedLayer.id, { x: selectedLayer.x - step });
          break;
        case 'ArrowRight':
          e.preventDefault();
          updateLayer(selectedLayer.id, { x: selectedLayer.x + step });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getSelectedLayer, selectLayer, updateLayer]);

  // 双击编辑文字
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e);
    const hitLayer = hitTestLayers(x, y, state.layers);
    
    if (hitLayer && hitLayer.type === 'text') {
      // 可以触发文字编辑状态
      // 这里暂时只选中
      selectLayer(hitLayer.id);
    }
  }, [getCanvasCoordinates, state.layers, selectLayer]);

  // 获取光标样式
  const getCursor = useCallback(() => {
    if (dragState.mode === 'move') return 'grabbing';
    if (dragState.mode === 'rotate') return 'crosshair';
    if (dragState.mode === 'resize') {
      const { handle } = dragState;
      if (handle === 'tl' || handle === 'br') return 'nwse-resize';
      if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
      if (handle === 'tm' || handle === 'bm') return 'ns-resize';
      if (handle === 'lm' || handle === 'rm') return 'ew-resize';
    }
    return 'default';
  }, [dragState]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-muted/30 rounded-lg overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}

// 导出画布的方法
export function useCanvasExport() {
  const { state } = useLayerContext();
  
  const exportImage = useCallback(async (format: 'png' | 'jpeg' = 'png'): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    return await exportCanvas(canvas, state, format);
  }, [state]);

  const downloadImage = useCallback(async (filename?: string) => {
    const blob = await exportImage('png');
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename || `meme-${Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [exportImage]);

  return { exportImage, downloadImage };
}
