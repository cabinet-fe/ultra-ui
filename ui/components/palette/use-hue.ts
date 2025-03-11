import { useDrag } from '@ui/compositions'
import { computed, shallowRef } from 'vue'

interface UseHueOptions {
  updateHue: (index: number, rate: number) => void
}

export function useHue(options: UseHueOptions) {
  const { updateHue } = options

  const hueRef = shallowRef<HTMLElement>()
  const hueThumbRef = shallowRef<HTMLElement>()

  const transformX = shallowRef(0)
  let sliderWidth = 0

  const hueThumbStyle = computed(() => {
    return { transform: `translateX(${transformX.value}px)` }
  })

  const rangeX = [0, 0] as [number, number]

  function getSliderWidth() {
    sliderWidth = hueRef.value?.getBoundingClientRect().width ?? 0
    rangeX[1] = sliderWidth
  }

  /**
   * 更新调色盘的颜色
   * @param offsetX 调色指针偏移量
   * @param width 调色条宽度
   */
  function updateHueRGB(offsetX: number, width: number) {
    const scale = (offsetX / width) * 6
    const scaleIndex = Math.floor(scale)
    const rate = scale % 1

    updateHue(scaleIndex, rate)
  }

  function updateOffsetX(offsetX: number) {
    transformX.value = offsetX
    updateHueRGB(offsetX, sliderWidth)
  }

  const sliderDragger = useDrag({
    target: hueRef,
    rangeX,
    onDrag({ offsetX }) {
      updateOffsetX(offsetX)
    },
    onDragStart(e) {
      getSliderWidth()

      // 更新拖拽指针位置
      sliderThumbDragger.update({ offsetX: e.offsetX })
      sliderDragger.update({ offsetX: e.offsetX })

      updateOffsetX(e.offsetX)
    },
    onDragEnd({ offsetX }) {
      sliderThumbDragger.update({ offsetX })
    }
  })

  const sliderThumbDragger = useDrag({
    target: hueThumbRef,
    rangeX,
    onDrag({ offsetX }) {
      updateOffsetX(offsetX)
    },
    onDragStart() {
      getSliderWidth()
    }
  })

  return {
    hueRef,
    hueThumbRef,
    hueThumbStyle
  }
}
