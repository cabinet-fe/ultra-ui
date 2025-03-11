import type { PaletteRGB, PaletteSV } from '@ui/types'
import { n } from 'cat-kit'
import { reactive, ref, watch } from 'vue'

export function useRGBA() {
  /** 色调 */
  const hue = reactive<PaletteRGB>({ r: 255, g: 0, b: 0 })

  /** 饱和度 亮度 */
  const sv = reactive({ s: 1, v: 1 })

  /** 最终的颜色 */
  const RGB = reactive<PaletteRGB>({ r: 255, g: 0, b: 0 })

  /** 透明度 */
  const alpha = ref(1)

  /**
   * 将色调、饱和度和亮度转换为 RGB 颜色
   * @param hue 色调 RGB 值
   * @param sv 饱和度和亮度
   */
  function HSV2RGB(hue: PaletteRGB, sv: PaletteSV) {
    const { s, v } = sv

    // 如果饱和度为0，则为灰色
    if (s === 0) {
      const gray = Math.round(255 * v)
      RGB.r = gray
      RGB.g = gray
      RGB.b = gray
      return
    }

    // 获取当前色调
    const { r, g, b } = hue

    // 应用饱和度 (与白色混合)
    // 饱和度为1时，颜色最纯；饱和度为0时，颜色为白色
    let newR = r * s + 255 * (1 - s)
    let newG = g * s + 255 * (1 - s)
    let newB = b * s + 255 * (1 - s)

    // 应用亮度 (与黑色混合)
    // 亮度为1时，颜色最亮；亮度为0时，颜色为黑色
    newR = newR * v
    newG = newG * v
    newB = newB * v

    // 更新RGB对象
    RGB.r = Math.round(newR)
    RGB.g = Math.round(newG)
    RGB.b = Math.round(newB)
  }

  watch([hue, sv], () => {
    HSV2RGB(hue, sv)
  })

  // 调色盘色阶
  // r: 255, g: 0, b: 0
  // r: 255, g: 255, b: 0
  // r: 0, g: 255, b: 0
  // r: 0, g: 255, b: 255
  // r: 0, g: 0, b: 255
  // r: 255, g: 0, b: 255
  // r: 255, g: 0, b: 0

  const hueUpdaterMap: Record<number, (rate: number) => void> = {
    0: rate => {
      hue.r = 255
      hue.g = Math.round(255 * rate)
      hue.b = 0
    },
    1: rate => {
      hue.r = 255 + Math.round(-255 * rate)
      hue.g = 255
      hue.b = 0
    },
    2: rate => {
      hue.r = 0
      hue.g = 255
      hue.b = Math.round(255 * rate)
    },
    3: rate => {
      hue.r = 0
      hue.g = 255 + Math.round(-255 * rate)
      hue.b = 255
    },
    4: rate => {
      hue.r = Math.round(255 * rate)
      hue.g = 0
      hue.b = 255
    },
    5: rate => {
      hue.r = 255
      hue.g = 0
      hue.b = 255 + Math.round(-255 * rate)
    },
    6: () => {
      hue.r = 255
      hue.g = 0
      hue.b = 0
    }
  }

  function updateHue(index: number, rate: number) {
    hueUpdaterMap[index]!(rate)
  }

  function updateSV({ s, v }: { s?: number; v?: number }) {
    if (s !== undefined) {
      sv.s = s
    }
    if (v !== undefined) {
      sv.v = v
    }
  }

  /**
   * 更新调色盘的透明度
   * @param offsetX 调色指针偏移量
   * @param width 调色条宽度
   */
  function updateAlpha(offsetX: number, width: number) {
    alpha.value = +n(offsetX / width).fixed({ maxPrecision: 2 })
  }

  return {
    hue,
    sv,
    RGB,
    alpha,

    updateSV,
    updateHue,
    updateAlpha
  }
}
