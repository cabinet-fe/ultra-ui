<template>
  <div
    :class="className"
    :style="rateStyle"
    :tabindex="interactive ? 0 : -1"
    role="slider"
    :aria-valuemin="0"
    :aria-valuemax="count"
    :aria-valuenow="model"
    @mouseleave="hoverValue = undefined"
    @keydown="handleKeydown"
  >
    <div
      v-for="star in count"
      :key="star"
      :class="cls.e('item')"
      @mousemove="handleItemMove(star, $event)"
      @click="handleItemClick(star, $event)"
    >
      <span :class="cls.e('base')">
        <u-icon v-if="!character"><StarFilled /></u-icon>
        <template v-else>{{ character }}</template>
      </span>

      <span :class="cls.e('overlay')" :style="{ width: overlayWidth(star) }">
        <u-icon v-if="!character"><StarFilled /></u-icon>
        <template v-else>{{ character }}</template>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { StarFilled } from '@veltra/icons/normal'
import { bem, injectFormContext } from '@veltra/utils'
import { computed, ref, type CSSProperties } from 'vue'

import type { RateEmits, RateProps } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'Rate' })

const props = defineProps<RateProps>()

const emit = defineEmits<RateEmits>()

const cls = bem('rate')

const model = defineModel<number>({ default: 0 })

const { formProps } = injectFormContext()

const { disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const count = computed(() => props.count ?? 5)

/** 步长：允许半星时 0.5，否则 1 */
const step = computed(() => (props.allowHalf ? 0.5 : 1))

/** 悬浮预览的分值，未悬浮时为 undefined */
const hoverValue = ref<number | undefined>()

const interactive = computed(() => !disabled.value && !readonly.value)

const className = computed(() => [
  cls.b,
  bem.is('disabled', disabled.value),
  bem.is('readonly', readonly.value)
])

/** color 属性经 CSS 变量注入，未传时走 token 默认值 */
const rateStyle = computed<CSSProperties>(() => ({ '--u-rate-active-color': props.color }))

/** 当前展示分值：悬浮预览优先 */
const displayValue = computed(() => hoverValue.value ?? model.value)

/** 第 star 颗星彩色层的裁剪宽度 */
const overlayWidth = (star: number) => {
  const value = displayValue.value
  if (value >= star) return '100%'
  if (props.allowHalf && value >= star - 0.5) return '50%'
  return '0%'
}

/** 按事件位置算分值：左半颗 0.5（allowHalf 时），右半颗整颗 */
const eventToValue = (star: number, e: MouseEvent) => {
  if (!props.allowHalf) return star

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  return e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star
}

const handleItemMove = (star: number, e: MouseEvent) => {
  if (!interactive.value) return
  hoverValue.value = eventToValue(star, e)
}

const handleItemClick = (star: number, e: MouseEvent) => {
  if (!interactive.value) return
  setValue(eventToValue(star, e))
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!interactive.value) return

  const keyMap: Record<string, number> = {
    ArrowRight: step.value,
    ArrowUp: step.value,
    ArrowLeft: -step.value,
    ArrowDown: -step.value
  }
  const delta = keyMap[e.key]
  if (delta === undefined) return

  e.preventDefault()
  setValue(clamp(model.value + delta))
}

const clamp = (value: number) => Math.min(Math.max(value, 0), count.value)

const setValue = (value: number) => {
  if (value === model.value) return
  model.value = value
  emit('change', value)
}
</script>
