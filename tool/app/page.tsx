"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Download, Type, Move, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw, Zap } from "lucide-react"

export default function MemeGenerator() {
  const [text, setText] = useState("")
  const [baseFontSize, setBaseFontSize] = useState(350) // 基础字号，自动模式下作为最大字号
  const [autoFitEnabled, setAutoFitEnabled] = useState(true) // 自动适配开关
  const [lineHeight, setLineHeight] = useState(1.2)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [maxLineWidth, setMaxLineWidth] = useState(84)
  const [offsetX, setOffsetX] = useState(4)
  const [offsetY, setOffsetY] = useState(5)
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center")
  const [fontFamily, setFontFamily] = useState("Source Han Sans CN")
  const [textColor, setTextColor] = useState("#1a1a1a")
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("bold")
  const [rotation, setRotation] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [actualFontSize, setActualFontSize] = useState(350) // 实际使用的字号

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isQuickModeRef = useRef(false) // 快捷键模式标记

  const sketchbookArea = {
    x: 0.08,
    y: 0.72,
    width: 0.84,
    height: 0.26,
  }

  const fontFamilies = [
    { name: "Noto Sans SC", label: "思源黑体" },
    { name: "Noto Serif SC", label: "思源宋体" },
    { name: "Source Han Sans CN", label: "思源黑体 CN" },
    { name: "Microsoft YaHei", label: "微软雅黑" },
    { name: "SimHei", label: "黑体" },
    { name: "SimSun", label: "宋体" },
    { name: "KaiTi", label: "楷体" },
    { name: "FangSong", label: "仿宋" },
    { name: "Comic Sans MS", label: "Comic Sans" },
    { name: "Arial", label: "Arial" },
    { name: "Georgia", label: "Georgia" },
    { name: "Times New Roman", label: "Times" },
    { name: "Courier New", label: "等宽" },
    { name: "Impact", label: "Impact" },
    { name: "Verdana", label: "Verdana" },
    { name: "Trebuchet MS", label: "Trebuchet" },
  ]

  const fontSizePresets = [64, 96, 128, 160, 200, 256, 300, 350, 400, 450, 500]
  const MIN_FONT_SIZE = 24 // 最小字号

  const loadImage = useCallback(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      console.log("[v0] Image loaded successfully")
      imageRef.current = img
      setImageLoaded(true)
    }
    img.onerror = () => {
      console.log("[v0] Failed to load local image, using blob URL")
      const fallbackImg = new Image()
      fallbackImg.crossOrigin = "anonymous"
      fallbackImg.onload = () => {
        console.log("[v0] Fallback image loaded")
        imageRef.current = fallbackImg
        setImageLoaded(true)
      }
      fallbackImg.onerror = () => {
        console.log("[v0] Fallback also failed")
      }
      fallbackImg.src = "./images/img-3923.jpeg"
    }
    img.src = "./meme-template.png"
  }, [])

  useEffect(() => {
    loadImage()
  }, [loadImage])

  // 计算单行文字在指定字号下的宽度
  const measureTextWidth = useCallback((ctx: CanvasRenderingContext2D, lineText: string, fontSize: number) => {
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", cursive, sans-serif`
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`
    }
    return ctx.measureText(lineText).width
  }, [fontFamily, fontWeight, letterSpacing])

  // 计算最佳字号：使每行都能 fit 进最大宽度
  const calculateOptimalFontSize = useCallback((ctx: CanvasRenderingContext2D, lines: string[], maxWidth: number): number => {
    if (!autoFitEnabled) return baseFontSize
    if (lines.length === 0 || lines.every(l => l === "")) return baseFontSize

    let optimalSize = baseFontSize

    // 对每一行找到最大能 fit 的字号
    for (const line of lines) {
      if (line === "") continue
      
      let testSize = baseFontSize
      let lineWidth = measureTextWidth(ctx, line, testSize)
      
      // 如果当前字号超出宽度，逐步减小
      while (lineWidth > maxWidth - 20 && testSize > MIN_FONT_SIZE) {
        testSize -= 4 // 每次减少 4px
        lineWidth = measureTextWidth(ctx, line, testSize)
      }
      
      // 取所有行中最小的字号
      optimalSize = Math.min(optimalSize, testSize)
    }

    return Math.max(optimalSize, MIN_FONT_SIZE)
  }, [autoFitEnabled, baseFontSize, measureTextWidth])

  const drawCanvas = useCallback(() => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)

    if (!text.trim()) {
      setActualFontSize(baseFontSize)
      return
    }

    const areaX = img.width * sketchbookArea.x
    const areaY = img.height * sketchbookArea.y
    const areaWidth = img.width * sketchbookArea.width
    const areaHeight = img.height * sketchbookArea.height

    const textX = areaX + (areaWidth * offsetX) / 100
    const textY = areaY + (areaHeight * offsetY) / 100
    const textWidth = (areaWidth * maxLineWidth) / 100

    // 按用户换行分割
    const userLines = text.split("\n")
    
    // 计算最佳字号
    const fontSize = calculateOptimalFontSize(ctx, userLines, textWidth)
    setActualFontSize(fontSize)

    ctx.fillStyle = textColor
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", cursive, sans-serif`
    ctx.textBaseline = "middle"

    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`
    }

    if (textAlign === "left") {
      ctx.textAlign = "left"
    } else if (textAlign === "right") {
      ctx.textAlign = "right"
    } else {
      ctx.textAlign = "center"
    }

    // 用户换行 = 实际换行（不再自动换行）
    const lines = userLines

    const lineHeightPx = fontSize * lineHeight
    const totalTextHeight = lines.length * lineHeightPx

    const centerX = textX + textWidth / 2
    const centerY = textY + areaHeight / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)

    const startY = -totalTextHeight / 2 + lineHeightPx / 2

    let drawX: number
    if (textAlign === "left") {
      drawX = -textWidth / 2 + 10
    } else if (textAlign === "right") {
      drawX = textWidth / 2 - 10
    } else {
      drawX = 0
    }

    lines.forEach((line, index) => {
      ctx.fillText(line, drawX, startY + index * lineHeightPx)
    })

    ctx.restore()
  }, [
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
    calculateOptimalFontSize,
  ])

  // 延迟渲染：普通输入延迟 500ms，快捷键模式立即渲染
  const scheduleRender = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    if (isQuickModeRef.current) {
      // 快捷键模式：立即渲染
      drawCanvas()
    } else {
      // 普通模式：延迟 500ms 渲染
      renderTimeoutRef.current = setTimeout(() => {
        drawCanvas()
      }, 500)
    }
  }, [drawCanvas])

  // 立即渲染（用于非文字输入的参数变化）
  const renderImmediately = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }
    drawCanvas()
  }, [drawCanvas])

  // 文字变化时使用延迟渲染
  useEffect(() => {
    if (imageLoaded) {
      scheduleRender()
    }
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
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

  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageLoaded || isDownloading) {
      return
    }

    setIsDownloading(true)

    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsDownloading(false)
            return
          }

          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.download = `natsumeanan-meme-${Date.now()}.png`
          link.href = url

          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setTimeout(() => {
            URL.revokeObjectURL(url)
            setIsDownloading(false)
          }, 100)
        },
        "image/png",
        1.0,
      )
    } catch (error) {
      setIsDownloading(false)
    }
  }, [imageLoaded, isDownloading])

  const resetSettings = () => {
    setBaseFontSize(350)
    setAutoFitEnabled(true)
    setLineHeight(1.2)
    setLetterSpacing(0)
    setMaxLineWidth(84)
    setOffsetX(4)
    setOffsetY(5)
    setTextAlign("center")
    setFontFamily("Source Han Sans CN")
    setTextColor("#1a1a1a")
    setFontWeight("bold")
    setRotation(0)
  }

  const formatValue = (value: number, suffix = "") => (
    <span className="text-xs text-foreground font-mono bg-muted px-2 py-0.5 rounded tabular-nums">
      {value}
      {suffix}
    </span>
  )

  // Electron 快捷键模式
  useEffect(() => {
    if ((window as any).electron) {
      (window as any).electron.onGenerateMeme((incomingText: string) => {
        isQuickModeRef.current = true // 标记为快捷键模式
        setText(incomingText)
        setAutoGenerate(true)
      })
    }
  }, [])

  const [autoGenerate, setAutoGenerate] = useState(false)

  useEffect(() => {
    if (autoGenerate && imageLoaded) {
      // 快捷键模式下立即渲染并生成
      const generateMeme = () => {
        // 确保先渲染
        drawCanvas()
        
        const canvas = canvasRef.current
        if (canvas) {
          canvas.toBlob((blob) => {
            if (blob && (window as any).electron) {
              blob.arrayBuffer().then((buffer) => {
                (window as any).electron.sendMemeGenerated(buffer)
              })
            }
          }, "image/png")
        }
        setAutoGenerate(false)
        isQuickModeRef.current = false // 重置快捷键模式标记
      }

      // 给一个微小的延迟确保 state 更新完成
      requestAnimationFrame(() => {
        requestAnimationFrame(generateMeme)
      })
    }
  }, [autoGenerate, imageLoaded, drawCanvas])

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row items-start justify-center p-4 gap-6">
      <div className="w-full lg:w-1/2 lg:sticky lg:top-4">
        <h1 className="text-xl font-semibold text-foreground mb-4 text-center lg:text-left">夏目安安bot (Desktop)</h1>
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

      <div className="w-full lg:w-1/2 max-w-lg mx-auto space-y-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <label className="text-sm font-medium text-foreground mb-2 block">文字内容</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在这里输入文字...&#10;按 Enter 换行"
            className="w-full p-3 border border-border rounded-lg resize-none h-28 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Type size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">字体设置</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">字体</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {fontFamilies.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 自动适配开关 */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap size={16} className={autoFitEnabled ? "text-yellow-500" : "text-muted-foreground"} />
                <span className="text-sm font-medium text-foreground">自动适配字号</span>
              </div>
              <div className="flex items-center gap-3">
                {autoFitEnabled && (
                  <span className="text-xs text-muted-foreground">
                    当前: {actualFontSize}px
                  </span>
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
                    onChange={(e) => setBaseFontSize(Math.min(500, Math.max(24, Number(e.target.value))))}
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
                {fontSizePresets.map((size) => (
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
