"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Download, Type, Move, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw } from "lucide-react"

export default function MemeGenerator() {
  const [text, setText] = useState("")
  const [fontSize, setFontSize] = useState(160)
  const [lineHeight, setLineHeight] = useState(1.2)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [maxLineWidth, setMaxLineWidth] = useState(100)
  const [offsetX, setOffsetX] = useState(-5)
  const [offsetY, setOffsetY] = useState(5)
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center")
  const [fontFamily, setFontFamily] = useState("Noto Sans SC")
  const [textColor, setTextColor] = useState("#1a1a1a")
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal")
  const [rotation, setRotation] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

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

  const fontSizePresets = [12, 16, 24, 32, 48, 64, 96, 128, 160, 200, 256, 300, 400, 500]

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
      fallbackImg.src = "/images/img-3923.jpeg"
    }
    img.src = "/meme-template.png"
  }, [])

  useEffect(() => {
    loadImage()
  }, [loadImage])

  const drawCanvas = useCallback(() => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)

    const areaX = img.width * sketchbookArea.x
    const areaY = img.height * sketchbookArea.y
    const areaWidth = img.width * sketchbookArea.width
    const areaHeight = img.height * sketchbookArea.height

    const textX = areaX + (areaWidth * offsetX) / 100
    const textY = areaY + (areaHeight * offsetY) / 100
    const textWidth = (areaWidth * maxLineWidth) / 100

    ctx.fillStyle = textColor
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", cursive, sans-serif`
    ctx.textBaseline = "middle"

    if (letterSpacing !== 0) {
      ;(ctx as any).letterSpacing = `${letterSpacing}px`
    }

    if (textAlign === "left") {
      ctx.textAlign = "left"
    } else if (textAlign === "right") {
      ctx.textAlign = "right"
    } else {
      ctx.textAlign = "center"
    }

    const words = text.split("")
    const lines: string[] = []
    let currentLine = ""

    for (const char of words) {
      if (char === "\n") {
        lines.push(currentLine)
        currentLine = ""
        continue
      }
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      if (metrics.width > textWidth - 20 && currentLine !== "") {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)

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
    fontSize,
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
  ])

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [imageLoaded, drawCanvas])

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
    setFontSize(160)
    setLineHeight(1.2)
    setLetterSpacing(0)
    setMaxLineWidth(100)
    setOffsetX(-5)
    setOffsetY(5)
    setTextAlign("center")
    setFontFamily("Noto Sans SC")
    setTextColor("#1a1a1a")
    setFontWeight("normal")
    setRotation(0)
  }

  const formatValue = (value: number, suffix = "") => (
    <span className="text-xs text-foreground font-mono bg-muted px-2 py-0.5 rounded tabular-nums">
      {value}
      {suffix}
    </span>
  )

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row items-start justify-center p-4 gap-6">
      <div className="w-full lg:w-1/2 lg:sticky lg:top-4">
        <h1 className="text-xl font-semibold text-foreground mb-4 text-center lg:text-left">夏目安安bot</h1>
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
            placeholder="在这里输入文字...&#10;支持换行"
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-muted-foreground">字号</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="4"
                    max="300"
                    value={fontSize}
                    onChange={(e) => setFontSize(Math.min(300, Math.max(4, Number(e.target.value))))}
                    className="w-16 px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <input
                type="range"
                min="4"
                max="300"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-foreground h-2"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {fontSizePresets.map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      fontSize === size
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
