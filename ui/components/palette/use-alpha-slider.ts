import { useDrag } from '@ui/compositions'
import { computed, shallowRef } from 'vue'

interface Options {
  updateAlpha: (offsetX: number, sliderWidth: number) => void
}
export function useAlphaSlider(options: Options) {
  const { updateAlpha } = options

  const alphaSliderRef = shallowRef<HTMLElement>()
  const alphaSliderThumbRef = shallowRef<HTMLElement>()

  const alphaThumbTransformX = shallowRef(0)

  const alphaSliderThumbStyle = computed(() => {
    return { transform: `translateX(${alphaThumbTransformX.value}px)` }
  })

  let alphaSliderWidth = 0
  const rangeX = [0, 0] as [number, number]

  function getAlphaSliderWidth() {
    alphaSliderWidth = alphaSliderRef.value?.getBoundingClientRect().width ?? 0
    rangeX[1] = alphaSliderWidth
  }

  function updateOffsetX(offsetX: number) {
    alphaThumbTransformX.value = offsetX
    updateAlpha(offsetX, alphaSliderWidth)
  }

  const alphaSliderDragger = useDrag({
    target: alphaSliderRef,
    rangeX,
    onDrag({ offsetX }) {
      updateOffsetX(offsetX)
    },
    onDragStart(e) {
      getAlphaSliderWidth()

      alphaSliderThumbDragger.update({ offsetX: e.offsetX })
      alphaSliderDragger.update({ offsetX: e.offsetX })

      updateOffsetX(e.offsetX)
    },
    onDragEnd({ offsetX }) {
      alphaSliderThumbDragger.update({ offsetX })
    }
  })

  const alphaSliderThumbDragger = useDrag({
    target: alphaSliderThumbRef,
    rangeX,
    onDrag({ offsetX }) {
      updateOffsetX(offsetX)
    },
    onDragStart(e) {
      getAlphaSliderWidth()
    }
  })

  return {
    alphaSliderRef,
    alphaSliderThumbRef,
    alphaSliderThumbStyle
  }
}
