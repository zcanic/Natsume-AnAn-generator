"use client"

import React, { useRef, useCallback, useEffect, useState } from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import { LayerProvider, useLayerContext, createTextLayer, exportCanvas } from "@/lib/layer"
import { CanvasEditor, useCanvasExport } from "@/components/canvas-editor"
import { LayerPanel } from "@/components/layer-panel"
import { PropertyPanel } from "@/components/property-panel"

function MemeGeneratorContent() {
  const { state, dispatch, setBackgroundImage, addImageLayer, addTextLayer } = useLayerContext()
  const { downloadImage, exportImage } = useCanvasExport()
  
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const initialLoadRef = useRef(false)
  const [isGenerating, setIsGenerating] = useState(false)

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

  // Electron 快捷键模式：接收剪贴板文字并自动生成
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      (window as any).electron.onGenerateMeme(async (incomingText: string) => {
        setIsGenerating(true)
        
        // 添加新的文字图层
        addTextLayer(incomingText)
        
        // 等待渲染完成
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 导出并发送到剪贴板
        try {
          const blob = await exportImage('png')
          if (blob && (window as any).electron) {
            const buffer = await blob.arrayBuffer()
            ;(window as any).electron.sendMemeGenerated(buffer)
          }
        } catch (error) {
          console.error('Failed to generate meme:', error)
        }
        
        setIsGenerating(false)
      })
    }
  }, [addTextLayer, exportImage])

  // 加载默认底图和默认文字框
  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    const loadDefaultTemplate = () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // 设置背景
        setBackgroundImage('./meme-template.png', img.width, img.height)
        
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
      img.src = './meme-template.png'
    }
    
    // 只在没有底图时加载默认模板
    if (!state.backgroundImage) {
      loadDefaultTemplate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-background">
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

      {/* 生成中遮罩 */}
      {isGenerating && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-foreground border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-foreground">生成中...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* 左侧：图层面板 */}
        <aside className="w-full lg:w-64 p-4 border-b lg:border-b-0 lg:border-r border-border bg-card/50">
          <h1 className="text-lg font-semibold text-foreground mb-4">
            夏目安安bot <span className="text-xs font-normal text-muted-foreground">(Desktop)</span>
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

          {/* 快捷键提示 */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-background rounded text-foreground">Ctrl+Shift+M</kbd>
              <span className="ml-2">读取剪贴板生成</span>
            </p>
          </div>
        </aside>

        {/* 中间：画布 */}
        <main className="flex-1 p-4 flex items-center justify-center bg-muted/30">
          <div className="w-full max-w-2xl">
            {state.backgroundImage || state.layers.length > 0 ? (
              <CanvasEditor className="shadow-lg" />
            ) : (
              <div 
                onClick={() => backgroundInputRef.current?.click()}
                className="aspect-square bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors"
              >
                <Upload size={48} className="text-muted-foreground mb-4" />
                <p className="text-foreground font-medium">点击上传底图</p>
                <p className="text-sm text-muted-foreground mt-1">
                  或使用默认模板
                </p>
              </div>
            )}
          </div>
        </main>

        {/* 右侧：属性面板 */}
        <aside className="w-full lg:w-80 p-4 border-t lg:border-t-0 lg:border-l border-border bg-card/50 overflow-y-auto max-h-screen">
          <PropertyPanel />
        </aside>
      </div>
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
