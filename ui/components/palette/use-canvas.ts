import { useDrag } from '@ui/compositions'
import { computed, reactive, shallowRef } from 'vue'

export function useCanvasThumb() {
  const canvasRef = shallowRef<HTMLDivElement>()
  const canvasThumbRef = shallowRef<HTMLDivElement>()

  const canvasSize = {
    width: 0,
    height: 0
  }

  const rangeX = [0, 0] as [number, number]
  const rangeY = [0, 0] as [number, number]

  const getCanvasSize = () => {
    if (!canvasRef.value) return
    const { width, height } = canvasRef.value.getBoundingClientRect()

    canvasSize.width = width
    rangeX[1] = width

    canvasSize.height = height
    rangeY[1] = height
  }

  const transform = reactive({
    x: 0,
    y: 0
  })

  const canvasThumbStyle = computed(() => {
    return {
      transform: `translate(${transform.x}px, ${transform.y}px)`
    }
  })

  function updateThumb(offsetX: number, offsetY: number) {
    transform.x = offsetX
    transform.y = offsetY
  }

  const canvasDragger = useDrag({
    target: canvasRef,
    rangeX,
    rangeY,

    onDrag({ offsetX, offsetY }) {
      updateThumb(offsetX, offsetY)
    },
    onDragStart(e) {
      getCanvasSize()

      const { offsetX, offsetY } = e

      updateThumb(offsetX, offsetY)

      canvasDragger.update({ offsetX, offsetY })
      canvasThumbDragger.update({ offsetX, offsetY })
    },
    onDragEnd({ offsetX, offsetY }) {
      canvasThumbDragger.update({ offsetX, offsetY })
    }
  })

  const canvasThumbDragger = useDrag({
    target: canvasThumbRef,
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
    canvasThumbRef,
    canvasRef,
    canvasThumbStyle
  }
}
