import { useDrag } from '@ui/compositions'
import { n } from 'cat-kit'
import { reactive, shallowRef } from 'vue'

export function useSlider() {
  const sliderRef = shallowRef<HTMLElement>()
  const sliderThumbRef = shallowRef<HTMLElement>()

  const alphaSliderRef = shallowRef<HTMLElement>()
  const alphaSliderThumbRef = shallowRef<HTMLElement>()

  const sliderColor = reactive({
    r: 255,
    g: 0,
    b: 0,
    a: 1
  })

  const thumbOffsetX = shallowRef(0)

  // 滑块宽度
  let sliderWidth = 0
  // 每个色阶宽度（滑块宽度 / 6）
  let scaleWidth = 0

  const rangeX = [0, sliderWidth] as [number, number]

  function getSliderParams() {
    sliderWidth = sliderRef.value?.clientWidth ?? 0
    scaleWidth = sliderWidth / 6
    rangeX[1] = sliderWidth
  }

  const sliderDrag = useDrag({
    target: sliderThumbRef,
    rangeX,
    onDrag: ({ offsetX }) => {
      thumbOffsetX.value = offsetX
      updateColor(offsetX)
    },
    onDragStart() {
      getSliderParams()
    }
  })

  // 0 - 0.16666: 255,0,0 -> 255,255,0
  // 0.16666 - 0.33333: 255,255,0 -> 0,255,0
  // 0.33333 - 0.5: 0,255,0 -> 0,255,255
  // 0.5 - 0.66666: 0,255,255 -> 0,0,255
  // 0.66666 - 0.83333: 0,0,255 -> 255,0,255
  // 0.83333 - 1: 255,0,255 -> 255,0,0

  const scaleMap: Record<number, (rate: number) => void> = {
    0: rate => {
      sliderColor.r = 255
      sliderColor.g = Math.round(255 * rate)
      sliderColor.b = 0
    },
    1: rate => {
      sliderColor.r = 255 - Math.round(255 * rate)
      sliderColor.g = 255
      sliderColor.b = 0
    },
    2: rate => {
      sliderColor.r = 0
      sliderColor.g = 255
      sliderColor.b = Math.round(255 * rate)
    },
    3: rate => {
      sliderColor.r = 0
      sliderColor.g = 255 - Math.round(255 * rate)
      sliderColor.b = 255
    },
    4: rate => {
      sliderColor.r = Math.round(255 * rate)
      sliderColor.g = 0
      sliderColor.b = 255
    },
    5: rate => {
      sliderColor.r = 255
      sliderColor.g = 0
      sliderColor.b = 255 - Math.round(255 * rate)
    },
    6: () => {
      sliderColor.r = 255
      sliderColor.g = 0
      sliderColor.b = 0
    }
  }

  function updateColor(offsetX: number) {
    const colorScale = Math.floor(offsetX / scaleWidth)
    // 在当前色阶中的位置
    const colorScalePosition = offsetX - colorScale * scaleWidth

    scaleMap[colorScale]?.(colorScalePosition / scaleWidth)
  }

  function handleClickSlider(e: MouseEvent) {
    thumbOffsetX.value = e.offsetX
    sliderDrag.update({
      offsetX: e.offsetX
    })
    getSliderParams()
    updateColor(e.offsetX)
  }

  // 透明度
  let alphaSliderWidth = 0
  const alphaRangeX = [0, alphaSliderWidth] as [number, number]

  const alphaThumbOffsetX = shallowRef(0)

  function getAlphaSliderParams() {
    alphaSliderWidth = alphaSliderRef.value?.clientWidth ?? 0
    alphaRangeX[1] = alphaSliderWidth
  }

  const alphaDrag = useDrag({
    target: alphaSliderThumbRef,
    rangeX: alphaRangeX,
    onDrag: ({ offsetX }) => {
      alphaThumbOffsetX.value = offsetX
      sliderColor.a = +n(offsetX / alphaSliderWidth).fixed({ maxPrecision: 2 })
    },
    onDragStart() {
      getAlphaSliderParams()
    }
  })

  function handleClickAlphaSlider(e: MouseEvent) {
    alphaThumbOffsetX.value = e.offsetX
    alphaDrag.update({
      offsetX: e.offsetX
    })
    getAlphaSliderParams()
    sliderColor.a = +n(e.offsetX / alphaSliderWidth).fixed({ maxPrecision: 2 })
  }

  return {
    sliderColor,

    sliderRef,
    sliderThumbRef,
    thumbOffsetX,
    handleClickSlider,

    alphaSliderRef,
    alphaSliderThumbRef,
    alphaThumbOffsetX,
    handleClickAlphaSlider
  }
}
