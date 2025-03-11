import { useDrag } from '@ui/compositions'
import { computed, reactive, shallowRef } from 'vue'

export function useSV() {
  const svRef = shallowRef<HTMLDivElement>()
  const svThumbRef = shallowRef<HTMLDivElement>()

  const canvasSize = {
    width: 0,
    height: 0
  }

  const rangeX = [0, 0] as [number, number]
  const rangeY = [0, 0] as [number, number]

  const getCanvasSize = () => {
    if (!svRef.value) return
    const { width, height } = svRef.value.getBoundingClientRect()

    canvasSize.width = width
    rangeX[1] = width

    canvasSize.height = height
    rangeY[1] = height
  }

  const transform = reactive({
    x: 0,
    y: 0
  })

  const svThumbStyle = computed(() => {
    return {
      transform: `translate(${transform.x}px, ${transform.y}px)`
    }
  })

  function updateThumb(offsetX: number, offsetY: number) {
    transform.x = offsetX
    transform.y = offsetY
  }

  const svDragger = useDrag({
    target: svRef,
    rangeX,
    rangeY,

    onDrag({ offsetX, offsetY }) {
      updateThumb(offsetX, offsetY)
    },
    onDragStart(e) {
      getCanvasSize()

      const { offsetX, offsetY } = e

      updateThumb(offsetX, offsetY)

      svDragger.update({ offsetX, offsetY })
      svThumbDragger.update({ offsetX, offsetY })
    },
    onDragEnd({ offsetX, offsetY }) {
      svThumbDragger.update({ offsetX, offsetY })
    }
  })

  const svThumbDragger = useDrag({
    target: svThumbRef,
    rangeX,
    rangeY,
    onDrag({ offsetX, offsetY }) {
      updateThumb(offsetX, offsetY)
    },
    onDragStart(e) {
      getCanvasSize()
    }
  })

  return {
    svThumbRef,
    svRef,
    svThumbStyle
  }
}
