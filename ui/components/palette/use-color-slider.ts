import { useDrag } from '@ui/compositions'
import { computed, shallowRef } from 'vue'

interface UseColorSliderOptions {
  updateRGB: (offsetX: number, sliderWidth: number) => void
}

export function useColorSlider(options: UseColorSliderOptions) {
  const { updateRGB } = options

  const sliderRef = shallowRef<HTMLElement>()
  const sliderThumbRef = shallowRef<HTMLElement>()

  const transformX = shallowRef(0)
  let sliderWidth = 0

  const sliderThumbStyle = computed(() => {
    return { transform: `translateX(${transformX.value}px)` }
  })

  const rangeX = [0, 0] as [number, number]

  function getSliderWidth() {
    sliderWidth = sliderRef.value?.getBoundingClientRect().width ?? 0
    rangeX[1] = sliderWidth
  }

  function updateOffsetX(offsetX: number) {
    transformX.value = offsetX
    updateRGB(offsetX, sliderWidth)
  }

  const sliderDragger = useDrag({
    target: sliderRef,
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
    target: sliderThumbRef,
    rangeX,
    onDrag({ offsetX }) {
      updateOffsetX(offsetX)
    },
    onDragStart() {
      getSliderWidth()
    }
  })

  return {
    sliderRef,
    sliderThumbRef,
    sliderThumbStyle
  }
}
