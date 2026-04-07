import { n } from '@cat-kit/core'
import {
  reactive,
  readonly,
  ref,
  computed,
  type Ref,
  type ComputedRef
} from 'vue'
import { HUE2RGB } from './color-transform'
import type { PaletteRGB } from '@ultra-ui/desktop/types'

interface UseHSVReturned {
  HSV: { h: number; s: number; v: number }
  alpha: Ref<number>
  hueRGB: ComputedRef<PaletteRGB>
  updateHue: (deg: number) => void
  updateSV: ({ s, v }: { s: number; v: number }) => void
  updateAlpha: (a: number) => void
}

export function useHSV(): UseHSVReturned {
  const HSV = reactive({ h: 0, s: 1, v: 1 })
  /** 透明度 */
  const alpha = ref(1)
  /** 色调 RGB 值 */
  const hueRGB = computed(() => HUE2RGB(HSV.h))

  /**
   * 更新色相值
   * @param deg 色相值, 0-360
   */
  function updateHue(deg: number) {
    HSV.h = deg
  }

  /**
   * 更新饱和度和亮度
   * @param sv { s: 饱和度, v: 亮度 }
   */
  function updateSV({ s, v }: { s: number; v: number }) {
    HSV.s = s
    HSV.v = v
  }

  /**
   * 更新调色盘的透明度
   * @param a 透明度, 0-1
   */
  function updateAlpha(a: number) {
    alpha.value = +n(a).fixed({ maxPrecision: 2 })
  }

  return {
    HSV: readonly(HSV),
    alpha,
    hueRGB,

    updateHue,
    updateSV,
    updateAlpha
  }
}
