<template>
  <div
    v-if="!readonly"
    v-bind="$attrs"
    ref="trackRef"
    :class="[cls.b, bem.is('block', block), bem.is('disabled', disabled), cls.m(size)]"
    role="radiogroup"
  >
    <div
      :class="[cls.e('thumb'), bem.is('ready', thumbReady)]"
      :style="thumbStyle"
      aria-hidden="true"
    />
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
import { bem, fieldKey, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'

import type { SegmentEmits, SegmentItem, SegmentProps } from '../../types'

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
// 首次定位完成（且已渲染一帧）后才允许 thumb 过渡，避免从 (0,0) 滑入
const thumbReady = shallowRef(false)

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
  const trackBox = track.getBoundingClientRect()
  const box = active.getBoundingClientRect()
  thumbX.value = box.left - trackBox.left
  thumbY.value = box.top - trackBox.top
  thumbW.value = box.width
  thumbH.value = box.height
  thumbRadius.value = getComputedStyle(active).borderRadius
  thumbOn.value = true

  if (!thumbReady.value) {
    requestAnimationFrame(() => {
      thumbReady.value = true
    })
  }
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
