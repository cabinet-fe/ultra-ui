<template>
  <div
    v-if="!readonly"
    v-bind="$attrs"
    ref="trackRef"
    :class="[cls.b, bem.is('block', block), bem.is('disabled', disabled), cls.m(size)]"
    role="radiogroup"
  >
    <div :class="cls.e('thumb')" :style="thumbStyle" aria-hidden="true" />
    <div
      v-for="item of items"
      :key="item[valueKey]"
      :class="[
        cls.e('item'),
        bem.is('active', item[valueKey] === model),
        bem.is('disabled', disabled || Boolean(disabledItem?.(item)))
      ]"
      role="radio"
      :aria-checked="item[valueKey] === model"
      :aria-disabled="disabled || Boolean(disabledItem?.(item))"
      tabindex="0"
      @click="handleSelect(item)"
      @keydown.enter.prevent="handleSelect(item)"
      @keydown.space.prevent="handleSelect(item)"
    >
      <slot name="item" :item="item" :active="item[valueKey] === model">
        <span :class="cls.e('item-label')">{{ item[labelKey] }}</span>
      </slot>
    </div>
  </div>

  <template v-else>
    {{ items.find((item) => item[valueKey] === model)?.[labelKey] || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { useFormFallbackProps, useResizeObserver } from '@veltra/compositions'
import { fieldKey, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'

import { bem } from '../../shared/bem'
import type { SegmentEmits, SegmentItem, SegmentProps } from '../../types/segment'

defineOptions({ name: 'USegment', inheritAttrs: false })

const props = withDefaults(defineProps<SegmentProps>(), {
  items: () => [],
  labelKey: 'label',
  valueKey: 'value',
  disabled: undefined,
  readonly: undefined,
  block: false
})

const model = defineModel<any>()

const emit = defineEmits<SegmentEmits>()

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const cls = bem('segment')

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

const trackRef = shallowRef<HTMLElement>()
const thumbX = shallowRef(0)
const thumbY = shallowRef(0)
const thumbW = shallowRef(0)
const thumbH = shallowRef(0)
const thumbRadius = shallowRef('0px')
const thumbOn = shallowRef(false)

const thumbStyle = computed(() => ({
  width: `${thumbW.value}px`,
  height: `${thumbH.value}px`,
  borderRadius: thumbRadius.value,
  transform: `translate(${thumbX.value}px, ${thumbY.value}px)`,
  opacity: thumbOn.value ? '1' : '0'
}))

function measure() {
  const track = trackRef.value
  if (!track) return
  const active = track.querySelector<HTMLElement>(':scope > .is-active')
  if (!active) {
    thumbOn.value = false
    return
  }
  // 用布局坐标（offset*）：thumb 是 track 内的绝对定位元素，需要的正是 track 坐标系内的
  // 位置与尺寸。getBoundingClientRect 是视觉坐标，祖先链上有 transform: scale（如演示用
  // 设备壳）时会把缩放差引入 translate，导致滑块越偏离原点偏移越大。
  thumbX.value = active.offsetLeft
  thumbY.value = active.offsetTop
  thumbW.value = active.offsetWidth
  thumbH.value = active.offsetHeight
  thumbRadius.value = getComputedStyle(active).borderRadius
  thumbOn.value = true
}

useResizeObserver({ targets: trackRef, onResize: () => measure() })

watch([model, () => props.items, size], () => nextTick(measure), { deep: true })

onMounted(() => nextTick(measure))

const handleSelect = (item: SegmentItem) => {
  if (disabled.value || props.disabledItem?.(item)) return
  const val = item[valueKey.value]
  if (model.value === val) return
  model.value = val
  emit('change', item)
}
</script>
