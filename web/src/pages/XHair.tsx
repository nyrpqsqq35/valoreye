import { useEffect, useLayoutEffect, useRef } from 'react'
import { wrapCanvasContext, Wrapped2DContext } from '../canvasWrapper'
import Page from '../components/Page'
import xhairBg from '../img/xhairbg.png'
import {
  ValorantXHairColor,
  ValorantXHairLineVar,
  ValorantXHairProfile,
  ValorantXHairVar,
} from '../types'

export interface PageXHairPropTypes extends React.PropsWithChildren {
  className?: string
}

export interface TingPropTypes extends React.PropsWithChildren {
  className?: string
  profile: ValorantXHairProfile
}

const img = new Image(1334, 200)
img.src = xhairBg

const serializeColor = (
  { r, g, b, a }: ValorantXHairColor,
  realOpacity?: number
) => {
  if (typeof realOpacity === 'number') {
    a = realOpacity
  } else {
    a = a / 255
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function CrosshairPreview({
  className,
  profile,
  children,
}: TingPropTypes) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawLines = (
    fillRectOutlined: ReturnType<Wrapped2DContext['wrapFill']>,
    lineVariant: ValorantXHairLineVar,
    cx: number,
    cy: number
  ) => {
    const halfLT = lineVariant.lineThickness / 2

    fillRectOutlined(
      cx - lineVariant.lineOffset - lineVariant.lineLength,
      cy - halfLT,
      lineVariant.lineLength,
      lineVariant.lineThickness
    )
    fillRectOutlined(
      cx + lineVariant.lineOffset,
      cy - halfLT,
      lineVariant.lineLength,
      lineVariant.lineThickness
    )

    fillRectOutlined(
      cx - halfLT,
      cy - lineVariant.lineOffset - lineVariant.lineLength,
      lineVariant.lineThickness,
      lineVariant.lineLength
    )
    fillRectOutlined(
      cx - halfLT,
      cy + lineVariant.lineOffset,
      lineVariant.lineThickness,
      lineVariant.lineLength
    )
  }

  const drawVariant = (
    ctx: Wrapped2DContext,
    v: ValorantXHairVar,
    cx: number,
    cy: number
  ) => {
    // Rendering order (Bottom -> Top)
    // Inner lines (X, then Y)
    // Center dot
    // Outer lines (X, then Y)

    const color = v.bUseCustomColor ? v.colorCustom : v.color
    ctx.c.fillStyle = serializeColor(color)
    if (v.bHasOutline) {
      ctx.c.strokeStyle = serializeColor(v.outlineColor, v.outlineOpacity)
    }
    const fillRectOutlined = ctx.wrapFill(v.bHasOutline, v.outlineThickness)

    drawLines(fillRectOutlined, v.innerLines, cx, cy)
    if (v.bDisplayCenterDot) {
      let halfCDS = v.centerDotSize / 2
      fillRectOutlined(
        Math.floor(cx - halfCDS),
        Math.floor(cy - halfCDS),
        v.centerDotSize,
        v.centerDotSize
      )
    }
    drawLines(fillRectOutlined, v.outerLines, cx, cy)
  }

  const drawHeader = (
    ctx: Wrapped2DContext,
    text: string,
    tX: number,
    tY: number
  ) => {
    const tm = ctx.c.measureText(text)

    const bgPadX = 6,
      bgPadX2 = bgPadX * 2,
      bgPadY = 10,
      bgPadY2 = bgPadY * 2

    ctx.c.fillStyle = '#0008'
    ctx.c.fillRect(
      tX - bgPadX,
      tY - bgPadY,
      tm.actualBoundingBoxRight + bgPadX2 + 1,
      tm.fontBoundingBoxAscent + bgPadY2
    )

    ctx.c.fillStyle = 'white'
    ctx.c.fillText(text, tX, tY + tm.actualBoundingBoxAscent)
  }

  const draw = (ctx: Wrapped2DContext, frameCount: number) => {
    ctx.c.clearRect(0, 0, 1334, 200)
    ctx.drawImage(img, 0, 0, 1334, 200)

    // Header tings
    ctx.c.font = '16pt "DIN Next W1G"'

    drawVariant(ctx, profile.primary, 222, 99)
    drawVariant(
      ctx,
      profile.bUsePrimaryCrosshairForADS ? profile.primary : profile.aDS,
      666,
      99
    )

    drawHeader(ctx, 'PRIMARY', 180, 26)
    drawHeader(ctx, 'AIM DOWN SIGHTS', 580, 26)
    drawHeader(ctx, 'SNIPER SCOPE', 1043, 26)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = wrapCanvasContext(canvas.getContext('2d', { alpha: true })!)
    let frameCount = 0
    let hRAF: number
    const render = () => {
      draw(ctx, ++frameCount)
      hRAF = requestAnimationFrame(render)
    }
    render()

    return () => cancelAnimationFrame(hRAF)
  }, [])

  return (
    <>
      <p>Profile name is {profile.profileName}</p>
      <canvas className="mt-4" ref={canvasRef} width={1334} height={200} />
    </>
  )
}

export default function PageXHair({ className, children }: PageXHairPropTypes) {
  return (
    <Page>
      <Page.Header title="Crosshair" />
      <Page.Content>{/* <CrosshairPreview profile={prof1} /> */}</Page.Content>
    </Page>
  )
}
