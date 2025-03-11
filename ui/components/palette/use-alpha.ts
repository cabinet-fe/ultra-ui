import { useDrag } from '@ui/compositions'
import { computed, shallowRef } from 'vue'

interface Options {
  updateAlpha: (offsetX: number, sliderWidth: number) => void
}
export function useAlpha(options: Options) {
  const { updateAlpha } = options

  const alphaRef = shallowRef<HTMLElement>()
  const alphaThumbRef = shallowRef<HTMLElement>()

  const alphaThumbTransformX = shallowRef(0)

  const alphaThumbStyle = computed(() => {
    return { transform: `translateX(${alphaThumbTransformX.value}px)` }
  })

  let alphaWidth = 0
  const rangeX = [0, 0] as [number, number]

  function getAlphaWidth() {
    alphaWidth = alphaRef.value?.getBoundingClientRect().width ?? 0
    rangeX[1] = alphaWidth
  }

  function updateOffsetX(offsetX: number) {
    alphaThumbTransformX.value = offsetX
    updateAlpha(offsetX, alphaWidth)
  }

  const alphaDragger = useDrag({
    target: alphaRef,
    rangeX,
    onDrag({ offsetX }) {
      updateOffsetX(offsetX)
    },
    onDragStart(e) {
      getAlphaWidth()

      alphaSliderThumbDragger.update({ offsetX: e.offsetX })
      alphaDragger.update({ offsetX: e.offsetX })

      updateOffsetX(e.offsetX)
    },
    onDragEnd({ offsetX }) {
      alphaSliderThumbDragger.update({ offsetX })
    }
  })

  const alphaSliderThumbDragger = useDrag({
    target: alphaThumbRef,
    rangeX,
    onDrag({ offsetX }) {
      updateOffsetX(offsetX)
    },
    onDragStart(e) {
      getAlphaWidth()
    }
  })

  return {
    alphaRef,
    alphaThumbRef,
    alphaThumbStyle
  }
}
