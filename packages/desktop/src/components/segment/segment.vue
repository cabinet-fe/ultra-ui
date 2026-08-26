<template>
  <div
    v-if="!readonly"
    v-bind="$attrs"
    :class="[cls.b, bem.is('block', block), bem.is('disabled', disabled), cls.m(size)]"
    role="radiogroup"
  >
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
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, fieldKey, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

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

const handleSelect = (item: SegmentItem) => {
  if (disabled.value || props.disabledItem?.(item)) return
  const val = item[valueKey.value]
  if (model.value === val) return
  model.value = val
  emit('change', item)
}
</script>
