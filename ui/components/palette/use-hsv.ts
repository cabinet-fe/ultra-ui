import { n } from 'cat-kit'
import { reactive, readonly, ref, computed } from 'vue'
import { HUE2RGB } from './color-transform'

export function useHSV() {
  const HSV = reactive({ h: 0, s: 1, v: 1 })
  /** 透明度 */
  const alpha = ref(1)
  /** 色调 RGB 值 */
  const hueRGB = computed(() => HUE2RGB(HSV.h))

  function updateHue(deg: number) {
    HSV.h = deg
  }

  function updateSV({ s, v }: { s: number; v: number }) {
    HSV.s = s
    HSV.v = v
  }

  /**
   * 更新调色盘的透明度
   * @param a 透明度
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
