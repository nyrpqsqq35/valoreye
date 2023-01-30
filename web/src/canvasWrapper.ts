export interface Wrapped2DContext {
  c: CanvasRenderingContext2D
  drawImage: CanvasRenderingContext2D['drawImage']
  // fillRect, outlined: boolean): void
  wrapFill(
    outlined: boolean,
    outlineThickness: number
  ): (x: number, y: number, w: number, h: number) => void
}

export function wrapCanvasContext(
  ctx: CanvasRenderingContext2D
): Wrapped2DContext {
  const wc: Wrapped2DContext = {
    c: ctx,
    drawImage: ctx.drawImage.bind(ctx),

    wrapFill(outlined = false, outlineThickness) {
      if (!outlined) return ctx.fillRect.bind(ctx)
      return (x, y, w, h) => {
        // Swap
        ;[ctx.fillStyle, ctx.strokeStyle] = [ctx.strokeStyle, ctx.fillStyle]

        // Draw outline as filled rects behind the actual line
        // Fixes any oddities with antialiasing
        for (let i = 0; i < outlineThickness; ++i) {
          let z = i + 1
          ctx.fillRect(x - z, y - z, w + z * 2, h + z * 2)
        }

        // Restore
        ;[ctx.strokeStyle, ctx.fillStyle] = [ctx.fillStyle, ctx.strokeStyle]

        ctx.fillRect(x, y, w, h)
      }
    },

    // (x, y, w, h, outlined = false) {
    //   ctx.fillRect(x, y, w, h)
    //   if (outlined) ctx.strokeRect(x, y, w, h)
    // },
  }
  return wc
}
