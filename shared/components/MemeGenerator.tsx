"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Download,
  Type,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  RotateCw,
  Zap,
} from "lucide-react"
import {
  useMemeCanvas,
  MemeSettings,
  DEFAULT_SETTINGS,
  FONT_FAMILIES,
  FONT_SIZE_PRESETS,
} from "../hooks/useMemeCanvas"

interface MemeGeneratorProps {
  /** 是否为 Electron 桌面端模式 */
  isElectron?: boolean
  /** 图片资源路径前缀 (网页端用 "/" , Electron 用 "./") */
  assetPrefix?: string
  /** 标题 */
  title?: string
}

export default function MemeGenerator({
  isElectron = false,
  assetPrefix = "/",
  title = "夏目安安bot",
}: MemeGeneratorProps) {
  // 设置状态
  const [text, setText] = useState(DEFAULT_SETTINGS.text)
  const [baseFontSize, setBaseFontSize] = useState(DEFAULT_SETTINGS.baseFontSize)
  const [autoFitEnabled, setAutoFitEnabled] = useState(DEFAULT_SETTINGS.autoFitEnabled)
  const [lineHeight, setLineHeight] = useState(DEFAULT_SETTINGS.lineHeight)
  const [letterSpacing, setLetterSpacing] = useState(DEFAULT_SETTINGS.letterSpacing)
  const [maxLineWidth, setMaxLineWidth] = useState(DEFAULT_SETTINGS.maxLineWidth)
  const [offsetX, setOffsetX] = useState(DEFAULT_SETTINGS.offsetX)
  const [offsetY, setOffsetY] = useState(DEFAULT_SETTINGS.offsetY)
  const [textAlign, setTextAlign] = useState(DEFAULT_SETTINGS.textAlign)
  const [fontFamily, setFontFamily] = useState(DEFAULT_SETTINGS.fontFamily)
  const [textColor, setTextColor] = useState(DEFAULT_SETTINGS.textColor)
  const [fontWeight, setFontWeight] = useState(DEFAULT_SETTINGS.fontWeight)
  const [rotation, setRotation] = useState(DEFAULT_SETTINGS.rotation)

  // 构建 settings 对象
  const settings: MemeSettings = {
    text,
    baseFontSize,
    autoFitEnabled,
    lineHeight,
    letterSpacing,
    maxLineWidth,
    offsetX,
    offsetY,
    textAlign,
    fontFamily,
    textColor,
    fontWeight,
    rotation,
  }

  // 使用 Canvas Hook
  const {
    canvasRef,
    imageLoaded,
    actualFontSize,
    isDownloading,
    drawCanvas,
    downloadImage,
    scheduleRender,
    renderImmediately,
    getCanvasBlob,
  } = useMemeCanvas(settings, {
    imageSrc: `${assetPrefix}meme-template.png`,
    fallbackImageSrc: `${assetPrefix}images/img-3923.jpeg`,
    isElectron,
  })

  // 文字变化时延迟渲染
  useEffect(() => {
    if (imageLoaded) {
      scheduleRender()
    }
  }, [text, imageLoaded, scheduleRender])

  // 其他参数变化时立即渲染
  useEffect(() => {
    if (imageLoaded) {
      renderImmediately()
    }
  }, [
    imageLoaded,
    baseFontSize,
    autoFitEnabled,
    lineHeight,
    letterSpacing,
    maxLineWidth,
    offsetX,
    offsetY,
    textAlign,
    fontFamily,
    textColor,
    fontWeight,
    rotation,
    renderImmediately,
  ])

  // Electron 快捷键模式
  const [autoGenerate, setAutoGenerate] = useState(false)

  useEffect(() => {
    if (isElectron && (window as any).electron) {
      (window as any).electron.onGenerateMeme((incomingText: string) => {
        setText(incomingText)
        setAutoGenerate(true)
      })
    }
  }, [isElectron])

  useEffect(() => {
    if (autoGenerate && imageLoaded && isElectron) {
      const generateMeme = async () => {
        drawCanvas()
        const blob = await getCanvasBlob()
        if (blob && (window as any).electron) {
          const buffer = await blob.arrayBuffer()
          ;(window as any).electron.sendMemeGenerated(buffer)
        }
        setAutoGenerate(false)
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(generateMeme)
      })
    }
  }, [autoGenerate, imageLoaded, isElectron, drawCanvas, getCanvasBlob])

  // 重置设置
  const resetSettings = () => {
    setBaseFontSize(DEFAULT_SETTINGS.baseFontSize)
    setAutoFitEnabled(DEFAULT_SETTINGS.autoFitEnabled)
    setLineHeight(DEFAULT_SETTINGS.lineHeight)
    setLetterSpacing(DEFAULT_SETTINGS.letterSpacing)
    setMaxLineWidth(DEFAULT_SETTINGS.maxLineWidth)
    setOffsetX(DEFAULT_SETTINGS.offsetX)
    setOffsetY(DEFAULT_SETTINGS.offsetY)
    setTextAlign(DEFAULT_SETTINGS.textAlign)
    setFontFamily(DEFAULT_SETTINGS.fontFamily)
    setTextColor(DEFAULT_SETTINGS.textColor)
    setFontWeight(DEFAULT_SETTINGS.fontWeight)
    setRotation(DEFAULT_SETTINGS.rotation)
  }

  // 格式化显示值
  const formatValue = (value: number, suffix = "") => (
    <span className="text-xs text-foreground font-mono bg-muted px-2 py-0.5 rounded tabular-nums">
      {value}
      {suffix}
    </span>
  )

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row items-start justify-center p-4 gap-6">
      {/* 左侧预览区 */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-4">
        <h1 className="text-xl font-semibold text-foreground mb-4 text-center lg:text-left">
          {title}
        </h1>
        <div className="relative w-full max-w-lg mx-auto">
          <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-lg bg-card" />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={downloadImage}
          disabled={!imageLoaded || isDownloading}
          className="mt-4 w-full max-w-lg mx-auto flex items-center justify-center gap-2 bg-foreground text-background py-3 px-4 rounded-lg hover:opacity-90 active:scale-95 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
        >
          <Download size={20} className={isDownloading ? "animate-bounce" : ""} />
          {isDownloading ? "下载中..." : "下载图片"}
        </button>
      </div>

      {/* 右侧控制面板 */}
      <div className="w-full lg:w-1/2 max-w-lg mx-auto space-y-4">
        {/* 文字输入 */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <label className="text-sm font-medium text-foreground mb-2 block">文字内容</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在这里输入文字...&#10;按 Enter 换行"
            className="w-full p-3 border border-border rounded-lg resize-none h-28 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* 字体设置 */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Type size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">字体设置</span>
          </div>

          <div className="space-y-4">
            {/* 字体选择 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">字体</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 自动适配开关 */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap
                  size={16}
                  className={autoFitEnabled ? "text-yellow-500" : "text-muted-foreground"}
                />
                <span className="text-sm font-medium text-foreground">自动适配字号</span>
              </div>
              <div className="flex items-center gap-3">
                {autoFitEnabled && (
                  <span className="text-xs text-muted-foreground">当前: {actualFontSize}px</span>
                )}
                <button
                  onClick={() => setAutoFitEnabled(!autoFitEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    autoFitEnabled ? "bg-foreground" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform ${
                      autoFitEnabled ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 字号 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">
                  {autoFitEnabled ? "最大字号" : "字号"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="24"
                    max="500"
                    value={baseFontSize}
                    onChange={(e) =>
                      setBaseFontSize(Math.min(500, Math.max(24, Number(e.target.value))))
                    }
                    className="w-16 px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <input
                type="range"
                min="24"
                max="500"
                value={baseFontSize}
                onChange={(e) => setBaseFontSize(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {FONT_SIZE_PRESETS.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBaseFontSize(size)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      baseFontSize === size
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 行高 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">行高</label>
                {formatValue(Number(lineHeight.toFixed(1)))}
              </div>
              <input
                type="range"
                min="0.8"
                max="4"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
            </div>

            {/* 字间距 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">字间距</label>
                {formatValue(letterSpacing, "px")}
              </div>
              <input
                type="range"
                min="-5"
                max="20"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
            </div>

            {/* 颜色和粗细 */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1.5 block">颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">粗细</label>
                <button
                  onClick={() => setFontWeight(fontWeight === "normal" ? "bold" : "normal")}
                  className={`px-4 py-2 rounded-lg border transition-colors h-10 ${
                    fontWeight === "bold"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:border-muted-foreground"
                  }`}
                >
                  <span className="font-bold">B</span>
                </button>
              </div>
            </div>

            {/* 对齐方式 */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">对齐方式</label>
              <div className="flex gap-2">
                {[
                  { value: "left", icon: AlignLeft },
                  { value: "center", icon: AlignCenter },
                  { value: "right", icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTextAlign(value as "left" | "center" | "right")}
                    className={`flex-1 p-2.5 rounded-lg border transition-colors ${
                      textAlign === value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Icon size={18} className="mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 位置设置 */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Move size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">位置设置</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">行宽度</label>
                {formatValue(maxLineWidth, "%")}
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={maxLineWidth}
                onChange={(e) => setMaxLineWidth(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">水平偏移</label>
                {formatValue(offsetX, "%")}
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">垂直偏移</label>
                {formatValue(offsetY, "%")}
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
            </div>
          </div>
        </div>

        {/* 旋转设置 */}
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <RotateCw size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">旋转</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">旋转角度</label>
                {formatValue(rotation, "°")}
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
            </div>
            <div className="flex gap-2">
              {[-90, -45, 0, 45, 90].map((angle) => (
                <button
                  key={angle}
                  onClick={() => setRotation(angle)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                    rotation === angle
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                  }`}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 重置按钮 */}
        <button
          onClick={resetSettings}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
        >
          <RotateCcw size={16} />
          重置所有设置
        </button>
      </div>
    </main>
  )
}
