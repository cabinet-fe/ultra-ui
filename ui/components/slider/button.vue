<template>
  <div :style="warpStyles" ref="slideButtonRef" :class="cls.e('button-wrap')">
    <div :class="cls.e('button')" />
  </div>
</template>
<script lang="ts" setup>
import {
  computed,
  inject,
  nextTick,
  shallowReactive,
  shallowRef,
  watch
} from 'vue'
import { sliderContextKey } from './di'
import { useDrag } from '@ui/compositions'
import type {
  SliderButtonEmits,
  SliderButtonTransform
} from '@ui/types/components/slider'
import { useStops } from './use-stops'

let injected = inject(sliderContextKey)!

let { cls, sliderSize, sliderProps, setSliderBarSize } = injected

const buttonValue = defineModel<number>()

const { setStepButtonPosition } = useStops({ sliderProps, sliderSize })

let slideButtonRef = shallowRef<HTMLDivElement>()

let emit = defineEmits<SliderButtonEmits>()

const transform = shallowReactive<SliderButtonTransform>({
  x: 0,
  y: 0
})

const currentTransform = {
  x: 0,
  y: 0
}

watch(transform, transform => {
  setSliderBarSize(transform)
})

/** button的位移距离 */
const warpStyles = computed(() => {
  return {
    transform: `translate(${transform.x}px, ${transform.y}px)`
  }
})

/** 百分比 */
const percentage = shallowRef(0)

/** 是否拖拽 */
let isDragging = false

watch([percentage, sliderSize], ([p, sliderSize]) => {
  if (!sliderSize) return
  if (isDragging) {
    const { min, max } = sliderProps
    buttonValue.value = Math.round(min! + (max! - min!) * p)
  } else {
    if (sliderProps.vertical) {
      transform.y = -p * sliderSize
      currentTransform.y = transform.y
    } else {
      transform.x = p * sliderSize
      currentTransform.x = transform.x
    }
  }

  /** 拖拽结束之后的事件 */
  emit('dragEnd', buttonValue.value!)

  if (!sliderProps.range) return

  if (sliderProps.vertical) {
    emit('dragPosition', transform.y)
  } else {
    emit('dragPosition', transform.x)
  }
})

watch(
  buttonValue,
  value => {
    percentage.value =
      ((value as number) - sliderProps.min!) /
      (sliderProps.max! - sliderProps.min!)
  },
  {
    immediate: true
  }
)

useDrag({
  target: slideButtonRef,
  onDragStart(e) {
    isDragging = true
  },
  onDrag(x, y, e) {
    if (sliderProps.disabled) return

    const { vertical } = sliderProps
    let newPosition = vertical ? currentTransform.y + y : currentTransform.x + x

    if (vertical) {
      if (newPosition > 0) {
        newPosition = 0
      } else if (newPosition < -sliderSize.value) {
        newPosition = -sliderSize.value
      }
    } else {
      if (newPosition < 0) {
        newPosition = 0
      } else if (newPosition > sliderSize.value) {
        newPosition = sliderSize.value
      }
    }

    if (sliderProps.vertical) {
      transform.y = newPosition
    } else {
      transform.x = newPosition
    }

    /** step */
    if (sliderProps.step && sliderProps.step > 0) {
      if (sliderProps.vertical) {
        transform.y = -setStepButtonPosition(Math.abs(newPosition))
      } else {
        transform.x = setStepButtonPosition(newPosition)
      }
    }

    if (!sliderProps.range) return

    if (sliderProps.vertical) {
      emit('dragPosition', transform.y)
    } else {
      emit('dragPosition', transform.x)
    }
  },

  onDragEnd(x, y, e) {
    currentTransform.x = transform.x
    currentTransform.y = transform.y

    /** 算出百分比 */
    percentage.value = sliderProps.vertical
      ? -currentTransform.y / sliderSize.value
      : currentTransform.x / sliderSize.value

    nextTick(() => {
      isDragging = false
    })
  }
})
</script>
<style lang="scss" scoped></style>
