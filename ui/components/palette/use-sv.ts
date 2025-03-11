import { useDrag } from '@ui/compositions'
import { computed, inject, reactive, shallowRef } from 'vue'
import { PaletteDIKey } from './di'

export function useSV() {
  const svRef = shallowRef<HTMLDivElement>()
  const svThumbRef = shallowRef<HTMLDivElement>()
  const { updateSV } = inject(PaletteDIKey)!

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

    // 根据画布位置计算饱和度和亮度
    // 水平方向表示饱和度，从左到右饱和度逐渐增高
    // 垂直方向表示亮度，上亮下暗
    const s = Math.max(0, Math.min(1, offsetX / canvasSize.width))
    const v = Math.max(0, Math.min(1, 1 - offsetY / canvasSize.height))

    // 更新饱和度和亮度
    updateSV({ s, v })
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
