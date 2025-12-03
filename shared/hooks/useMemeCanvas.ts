import { useCallback, useRef, useState, useEffect } from "react"

export interface MemeSettings {
  text: string
  baseFontSize: number
  autoFitEnabled: boolean
  lineHeight: number
  letterSpacing: number
  maxLineWidth: number
  offsetX: number
  offsetY: number
  textAlign: "left" | "center" | "right"
  fontFamily: string
  textColor: string
  fontWeight: "normal" | "bold"
  rotation: number
}

export interface SketchbookArea {
  x: number
  y: number
  width: number
  height: number
}

export const DEFAULT_SETTINGS: MemeSettings = {
  text: "",
  baseFontSize: 350,
  autoFitEnabled: true,
  lineHeight: 1.2,
  letterSpacing: 0,
  maxLineWidth: 84,
  offsetX: 4,
  offsetY: 5,
  textAlign: "center",
  fontFamily: "Source Han Sans CN",
  textColor: "#1a1a1a",
  fontWeight: "bold",
  rotation: 0,
}

export const DEFAULT_SKETCHBOOK_AREA: SketchbookArea = {
  x: 0.08,
  y: 0.72,
  width: 0.84,
  height: 0.26,
}

export const FONT_FAMILIES = [
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

export const FONT_SIZE_PRESETS = [64, 96, 128, 160, 200, 256, 300, 350, 400, 450, 500]
export const MIN_FONT_SIZE = 24

interface UseMemeCanvasOptions {
  imageSrc: string
  fallbackImageSrc?: string
  sketchbookArea?: SketchbookArea
  isElectron?: boolean
}

interface UseMemeCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  imageLoaded: boolean
  actualFontSize: number
  isDownloading: boolean
  drawCanvas: () => void
  downloadImage: () => void
  scheduleRender: () => void
  renderImmediately: () => void
  getCanvasBlob: () => Promise<Blob | null>
}

export function useMemeCanvas(
  settings: MemeSettings,
  options: UseMemeCanvasOptions
): UseMemeCanvasReturn {
  const {
    imageSrc,
    fallbackImageSrc,
    sketchbookArea = DEFAULT_SKETCHBOOK_AREA,
    isElectron = false,
  } = options

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isQuickModeRef = useRef(false)

  const [imageLoaded, setImageLoaded] = useState(false)
  const [actualFontSize, setActualFontSize] = useState(settings.baseFontSize)
  const [isDownloading, setIsDownloading] = useState(false)

  // 加载图片
  const loadImage = useCallback(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      console.log("[MemeCanvas] Image loaded successfully")
      imageRef.current = img
      setImageLoaded(true)
    }
    img.onerror = () => {
      console.log("[MemeCanvas] Failed to load image, trying fallback")
      if (fallbackImageSrc) {
        const fallbackImg = new Image()
        fallbackImg.crossOrigin = "anonymous"
        fallbackImg.onload = () => {
          console.log("[MemeCanvas] Fallback image loaded")
          imageRef.current = fallbackImg
          setImageLoaded(true)
        }
        fallbackImg.onerror = () => {
          console.log("[MemeCanvas] Fallback also failed")
        }
        fallbackImg.src = fallbackImageSrc
      }
    }
    img.src = imageSrc
  }, [imageSrc, fallbackImageSrc])

  useEffect(() => {
    loadImage()
  }, [loadImage])

  // 计算单行文字宽度
  const measureTextWidth = useCallback(
    (ctx: CanvasRenderingContext2D, lineText: string, fontSize: number) => {
      ctx.font = `${settings.fontWeight} ${fontSize}px "${settings.fontFamily}", cursive, sans-serif`
      if (settings.letterSpacing !== 0) {
        (ctx as any).letterSpacing = `${settings.letterSpacing}px`
      }
      return ctx.measureText(lineText).width
    },
    [settings.fontFamily, settings.fontWeight, settings.letterSpacing]
  )

  // 计算最佳字号
  const calculateOptimalFontSize = useCallback(
    (ctx: CanvasRenderingContext2D, lines: string[], maxWidth: number): number => {
      if (!settings.autoFitEnabled) return settings.baseFontSize
      if (lines.length === 0 || lines.every((l) => l === "")) return settings.baseFontSize

      let optimalSize = settings.baseFontSize

      for (const line of lines) {
        if (line === "") continue

        let testSize = settings.baseFontSize
        let lineWidth = measureTextWidth(ctx, line, testSize)

        while (lineWidth > maxWidth - 20 && testSize > MIN_FONT_SIZE) {
          testSize -= 4
          lineWidth = measureTextWidth(ctx, line, testSize)
        }

        optimalSize = Math.min(optimalSize, testSize)
      }

      return Math.max(optimalSize, MIN_FONT_SIZE)
    },
    [settings.autoFitEnabled, settings.baseFontSize, measureTextWidth]
  )

  // 绘制 Canvas
  const drawCanvas = useCallback(() => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    if (!settings.text.trim()) {
      setActualFontSize(settings.baseFontSize)
      return
    }

    const areaX = img.width * sketchbookArea.x
    const areaY = img.height * sketchbookArea.y
    const areaWidth = img.width * sketchbookArea.width
    const areaHeight = img.height * sketchbookArea.height

    const textX = areaX + (areaWidth * settings.offsetX) / 100
    const textY = areaY + (areaHeight * settings.offsetY) / 100
    const textWidth = (areaWidth * settings.maxLineWidth) / 100

    const userLines = settings.text.split("\n")
    const fontSize = calculateOptimalFontSize(ctx, userLines, textWidth)
    setActualFontSize(fontSize)

    ctx.fillStyle = settings.textColor
    ctx.font = `${settings.fontWeight} ${fontSize}px "${settings.fontFamily}", cursive, sans-serif`
    ctx.textBaseline = "middle"

    if (settings.letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${settings.letterSpacing}px`
    }

    if (settings.textAlign === "left") {
      ctx.textAlign = "left"
    } else if (settings.textAlign === "right") {
      ctx.textAlign = "right"
    } else {
      ctx.textAlign = "center"
    }

    const lines = userLines
    const lineHeightPx = fontSize * settings.lineHeight
    const totalTextHeight = lines.length * lineHeightPx

    const centerX = textX + textWidth / 2
    const centerY = textY + areaHeight / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((settings.rotation * Math.PI) / 180)

    const startY = -totalTextHeight / 2 + lineHeightPx / 2

    let drawX: number
    if (settings.textAlign === "left") {
      drawX = -textWidth / 2 + 10
    } else if (settings.textAlign === "right") {
      drawX = textWidth / 2 - 10
    } else {
      drawX = 0
    }

    lines.forEach((line, index) => {
      ctx.fillText(line, drawX, startY + index * lineHeightPx)
    })

    ctx.restore()
  }, [settings, sketchbookArea, calculateOptimalFontSize])

  // 延迟渲染
  const scheduleRender = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    if (isQuickModeRef.current) {
      drawCanvas()
    } else {
      renderTimeoutRef.current = setTimeout(() => {
        drawCanvas()
      }, 500)
    }
  }, [drawCanvas])

  // 立即渲染
  const renderImmediately = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }
    drawCanvas()
  }, [drawCanvas])

  // 下载图片
  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageLoaded || isDownloading) return

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
        1.0
      )
    } catch (error) {
      setIsDownloading(false)
    }
  }, [imageLoaded, isDownloading])

  // 获取 Canvas Blob（用于 Electron）
  const getCanvasBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      if (!canvas) {
        resolve(null)
        return
      }
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0)
    })
  }, [])

  // 设置快捷键模式
  const setQuickMode = useCallback((value: boolean) => {
    isQuickModeRef.current = value
  }, [])

  return {
    canvasRef,
    imageLoaded,
    actualFontSize,
    isDownloading,
    drawCanvas,
    downloadImage,
    scheduleRender,
    renderImmediately,
    getCanvasBlob,
  }
}
