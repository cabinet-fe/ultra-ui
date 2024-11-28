import { useDrag } from '@ui/compositions'
import { reactive, shallowRef } from 'vue'

export function useCanvasThumb() {
  const canvasThumbRef = shallowRef<HTMLDivElement>()
  const canvasRef = shallowRef<HTMLDivElement>()

  const canvasParams = {
    width: 0,
    height: 0
  }

  const rangeX = [0, 0] as [number, number]
  const rangeY = [0, 0] as [number, number]

  const getCanvasParams = () => {
    if (!canvasRef.value) return
    const { width, height } = canvasRef.value.getBoundingClientRect()
    canvasParams.width = width
    canvasParams.height = height
    rangeX[1] = width
    rangeY[1] = height
  }

  const thumbTransform = reactive({
    x: 0,
    y: 0
  })

  const { update } = useDrag({
    target: canvasRef,
    rangeX,
    rangeY,

    onDrag({ offsetX, offsetY }) {
      thumbTransform.x = offsetX
      thumbTransform.y = offsetY
    },
    onDragStart(e) {
      update({
        offsetX: e.offsetX,
        offsetY: e.offsetY
      })
      getCanvasParams()
    }
  })

  function handleClickCanvas(e: MouseEvent) {
    thumbTransform.x = e.offsetX
    thumbTransform.y = e.offsetY
    update({
      offsetX: e.offsetX,
      offsetY: e.offsetY
    })
  }

  return {
    canvasThumbRef,
    canvasRef,
    thumbTransform,
    handleClickCanvas
  }
}
