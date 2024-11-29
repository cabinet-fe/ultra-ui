import type { PaletteRGBA } from '@ui/types'
import { n } from 'cat-kit'
import { reactive } from 'vue'

export function useRGBA() {
  const RGBA = reactive<PaletteRGBA>({ r: 255, g: 0, b: 0, a: 1 })

  // 调色盘色阶
  // r: 255, g: 0, b: 0
  // r: 255, g: 255, b: 0
  // r: 0, g: 255, b: 0
  // r: 0, g: 255, b: 255
  // r: 0, g: 0, b: 255
  // r: 255, g: 0, b: 255
  // r: 255, g: 0, b: 0

  const scaleUpdaterMap: Record<number, (rate: number) => void> = {
    0: rate => {
      RGBA.r = 255
      RGBA.g = Math.round(255 * rate)
      RGBA.b = 0
    },
    1: rate => {
      RGBA.r = 255 + Math.round(-255 * rate)
      RGBA.g = 255
      RGBA.b = 0
    },
    2: rate => {
      RGBA.r = 0
      RGBA.g = 255
      RGBA.b = Math.round(255 * rate)
    },
    3: rate => {
      RGBA.r = 0
      RGBA.g = 255 + Math.round(-255 * rate)
      RGBA.b = 255
    },
    4: rate => {
      RGBA.r = Math.round(255 * rate)
      RGBA.g = 0
      RGBA.b = 255
    },
    5: rate => {
      RGBA.r = 255
      RGBA.g = 0
      RGBA.b = 255 + Math.round(-255 * rate)
    },
    6: () => {
      RGBA.r = 255
      RGBA.g = 0
      RGBA.b = 0
    }
  }

  /**
   * 更新调色盘的颜色
   * @param offsetX 调色指针偏移量
   * @param width 调色条宽度
   */
  function updateRGB(offsetX: number, width: number) {
    const scale = (offsetX / width) * 6
    const scaleIndex = Math.floor(scale)
    const rate = scale % 1

    scaleUpdaterMap[scaleIndex]!(rate)
  }

  /**
   * 更新调色盘的透明度
   * @param offsetX 调色指针偏移量
   * @param width 调色条宽度
   */
  function updateAlpha(offsetX: number, width: number) {
    RGBA.a = +n(offsetX / width).fixed({ maxPrecision: 2 })
  }

  return {
    RGBA,

    updateRGB,

    updateAlpha
  }
}
