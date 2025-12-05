"use client";

import React, { useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  Plus,
  Upload,
} from 'lucide-react';
import { useLayerContext, Layer } from '@/lib/layer';

interface LayerPanelProps {
  onUploadImage?: () => void;
  onUploadBackground?: () => void;
}

export function LayerPanel({ onUploadImage, onUploadBackground }: LayerPanelProps) {
  const { state, dispatch, addTextLayer, selectLayer } = useLayerContext();

  const handleAddText = useCallback(() => {
    addTextLayer();
  }, [addTextLayer]);

  const handleToggleVisibility = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', id });
  }, [dispatch]);

  const handleToggleLock = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_LAYER_LOCK', id });
  }, [dispatch]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_LAYER', id });
  }, [dispatch]);

  const handleDuplicate = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'DUPLICATE_LAYER', id });
  }, [dispatch]);

  const handleMoveUp = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'MOVE_LAYER_UP', id });
  }, [dispatch]);

  const handleMoveDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'MOVE_LAYER_DOWN', id });
  }, [dispatch]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* 头部 */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">图层</span>
        <div className="flex gap-1">
          <button
            onClick={handleAddText}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            title="添加文字"
          >
            <Type size={16} className="text-muted-foreground" />
          </button>
          <button
            onClick={onUploadImage}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            title="添加图片"
          >
            <ImageIcon size={16} className="text-muted-foreground" />
          </button>
          <button
            onClick={onUploadBackground}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            title="更换底图"
          >
            <Upload size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 图层列表 */}
      <div className="max-h-64 overflow-y-auto">
        {/* 倒序显示，最上层的图层在列表顶部 */}
        {[...state.layers].reverse().map((layer) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isSelected={layer.id === state.selectedLayerId}
            onSelect={() => selectLayer(layer.id)}
            onToggleVisibility={(e) => handleToggleVisibility(layer.id, e)}
            onToggleLock={(e) => handleToggleLock(layer.id, e)}
            onDelete={(e) => handleDelete(layer.id, e)}
            onDuplicate={(e) => handleDuplicate(layer.id, e)}
            onMoveUp={(e) => handleMoveUp(layer.id, e)}
            onMoveDown={(e) => handleMoveDown(layer.id, e)}
          />
        ))}

        {/* 底图 */}
        {state.backgroundImage && (
          <div className="px-3 py-2 border-t border-border flex items-center gap-2 bg-muted/30">
            <ImageIcon size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground flex-1">底图</span>
          </div>
        )}

        {/* 空状态 */}
        {state.layers.length === 0 && !state.backgroundImage && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <p>暂无图层</p>
            <p className="text-xs mt-1">点击上方按钮添加</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: (e: React.MouseEvent) => void;
  onToggleLock: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
}

function LayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: LayerItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors group ${
        isSelected
          ? 'bg-accent'
          : 'hover:bg-accent/50'
      } ${!layer.visible ? 'opacity-50' : ''}`}
    >
      {/* 类型图标 */}
      {layer.type === 'text' ? (
        <Type size={14} className="text-muted-foreground shrink-0" />
      ) : (
        <ImageIcon size={14} className="text-muted-foreground shrink-0" />
      )}

      {/* 名称 */}
      <span className="text-sm text-foreground flex-1 truncate">
        {layer.name}
      </span>

      {/* 操作按钮 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          className="p-1 rounded hover:bg-background/50"
          title="上移"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={onMoveDown}
          className="p-1 rounded hover:bg-background/50"
          title="下移"
        >
          <ChevronDown size={12} />
        </button>
        <button
          onClick={onDuplicate}
          className="p-1 rounded hover:bg-background/50"
          title="复制"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-destructive/20 text-destructive"
          title="删除"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 状态图标 */}
      <button
        onClick={onToggleLock}
        className="p-1 rounded hover:bg-background/50"
        title={layer.locked ? '解锁' : '锁定'}
      >
        {layer.locked ? (
          <Lock size={12} className="text-muted-foreground" />
        ) : (
          <Unlock size={12} className="text-muted-foreground opacity-30" />
        )}
      </button>
      <button
        onClick={onToggleVisibility}
        className="p-1 rounded hover:bg-background/50"
        title={layer.visible ? '隐藏' : '显示'}
      >
        {layer.visible ? (
          <Eye size={12} className="text-muted-foreground" />
        ) : (
          <EyeOff size={12} className="text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
