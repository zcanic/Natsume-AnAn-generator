"use client"

import React, { useRef, useCallback, useEffect, useState } from "react"
import { Download, RotateCcw, Upload, Layers, Settings, X } from "lucide-react"
import { LayerProvider, useLayerContext, createImageLayer, createTextLayer } from "@/lib/layer"
import { CanvasEditor, useCanvasExport } from "@/components/canvas-editor"
import { LayerPanel } from "@/components/layer-panel"
import { PropertyPanel } from "@/components/property-panel"

function MemeGeneratorContent() {
  const { state, dispatch, setBackgroundImage, addImageLayer } = useLayerContext()
  const { downloadImage } = useCanvasExport()
  
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const initialLoadRef = useRef(false)
  
  // 移动端面板状态
  const [mobilePanel, setMobilePanel] = useState<'none' | 'layers' | 'properties'>('none')

  // 加载默认底图和默认文字框
  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    const loadDefaultTemplate = () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // 设置背景
        setBackgroundImage('/meme-template.png', img.width, img.height)
        
        // 添加默认文字图层，位置 (840, 1980)，开启自动适配
        const defaultTextLayer = createTextLayer({
          content: '何意味',
          x: 840,
          y: 1980,
          fontSize: 256,
          autoFit: true,
          maxLineWidth: 1280,
          fontWeight: 'bold',
          color: '#1a1a1a',
        }, img.width, img.height)
        
        dispatch({ type: 'ADD_LAYER', layer: defaultTextLayer })
        dispatch({ type: 'SELECT_LAYER', id: defaultTextLayer.id })
      }
      img.onerror = () => {
        console.log('Failed to load default template')
      }
      img.src = '/meme-template.png'
    }
    
    // 只在没有底图时加载默认模板
    if (!state.backgroundImage) {
      loadDefaultTemplate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 处理底图上传
  const handleBackgroundUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setBackgroundImage(event.target?.result as string, img.width, img.height)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)

    // 重置 input 以便同一文件可以再次上传
    e.target.value = ''
  }, [setBackgroundImage])

  // 处理图片图层上传
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        addImageLayer(event.target?.result as string, img.width, img.height)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)

    e.target.value = ''
  }, [addImageLayer])

  // 重置所有
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [dispatch])

  // 下载
  const handleDownload = useCallback(async () => {
    await downloadImage(`meme-${Date.now()}.png`)
  }, [downloadImage])

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* 隐藏的文件输入 */}
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundUpload}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 移动端顶部栏 */}
      <header className="lg:hidden flex items-center justify-between p-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <h1 className="text-base font-semibold text-foreground">夏目安安bot</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobilePanel(mobilePanel === 'layers' ? 'none' : 'layers')}
            className={`p-2.5 rounded-lg transition-colors ${
              mobilePanel === 'layers' ? 'bg-foreground text-background' : 'bg-muted'
            }`}
          >
            <Layers size={18} />
          </button>
          <button
            onClick={() => setMobilePanel(mobilePanel === 'properties' ? 'none' : 'properties')}
            className={`p-2.5 rounded-lg transition-colors ${
              mobilePanel === 'properties' ? 'bg-foreground text-background' : 'bg-muted'
            }`}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* 左侧：图层面板 - 桌面端 */}
        <aside className="hidden lg:block w-64 p-4 border-r border-border bg-card/50 overflow-y-auto">
          <h1 className="text-lg font-semibold text-foreground mb-4">
            夏目安安bot
          </h1>
          
          <LayerPanel
            onUploadImage={() => imageInputRef.current?.click()}
            onUploadBackground={() => backgroundInputRef.current?.click()}
          />

          {/* 快捷操作 */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-2.5 px-4 rounded-lg hover:opacity-90 active:scale-95 transition-all font-medium"
            >
              <Download size={18} />
              下载图片
            </button>
            
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
            >
              <RotateCcw size={16} />
              重置
            </button>
          </div>
        </aside>

        {/* 中间：画布 */}
        <main className="flex-1 p-3 lg:p-4 flex items-center justify-center bg-muted/30 min-h-0">
          <div className="w-full max-w-2xl">
            {state.backgroundImage || state.layers.length > 0 ? (
              <CanvasEditor className="shadow-lg rounded-lg" />
            ) : (
              <div 
                onClick={() => backgroundInputRef.current?.click()}
                className="aspect-square bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors"
              >
                <Upload size={40} className="text-muted-foreground mb-3" />
                <p className="text-foreground font-medium text-sm">点击上传底图</p>
                <p className="text-xs text-muted-foreground mt-1">
                  或拖拽图片到此处
                </p>
              </div>
            )}
          </div>
        </main>

        {/* 右侧：属性面板 - 桌面端 */}
        <aside className="hidden lg:block w-80 p-4 border-l border-border bg-card/50 overflow-y-auto max-h-screen">
          <PropertyPanel />
        </aside>
      </div>

      {/* 移动端底部操作栏 */}
      <footer className="lg:hidden flex items-center gap-2 p-3 border-t border-border bg-card/80 backdrop-blur-sm sticky bottom-0 z-40">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background py-2.5 px-4 rounded-lg font-medium text-sm"
        >
          <Download size={16} />
          下载
        </button>
        <button
          onClick={() => backgroundInputRef.current?.click()}
          className="p-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <Upload size={18} />
        </button>
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </footer>

      {/* 移动端图层面板（抽屉） */}
      {mobilePanel === 'layers' && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/50" 
            onClick={() => setMobilePanel('none')}
          />
          <div className="w-72 bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card z-10">
              <span className="font-medium text-foreground">图层</span>
              <button 
                onClick={() => setMobilePanel('none')}
                className="p-1.5 rounded hover:bg-accent"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3">
              <LayerPanel
                onUploadImage={() => {
                  imageInputRef.current?.click()
                  setMobilePanel('none')
                }}
                onUploadBackground={() => {
                  backgroundInputRef.current?.click()
                  setMobilePanel('none')
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 移动端属性面板（抽屉） */}
      {mobilePanel === 'properties' && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/50" 
            onClick={() => setMobilePanel('none')}
          />
          <div className="w-80 bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card z-10">
              <span className="font-medium text-foreground">属性</span>
              <button 
                onClick={() => setMobilePanel('none')}
                className="p-1.5 rounded hover:bg-accent"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3">
              <PropertyPanel />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function MemeGenerator() {
  return (
    <LayerProvider>
      <MemeGeneratorContent />
    </LayerProvider>
  )
}
