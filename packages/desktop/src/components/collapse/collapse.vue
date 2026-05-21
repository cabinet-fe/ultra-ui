<template>
  <div :class="classList" role="region">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps, useModel } from '@veltra/compositions'
import { bem, ExpandTransition } from '@veltra/utils'
import { computed, provide, ref } from 'vue'

import type { CollapseEmits, CollapseModelValue, CollapseProps, CollapseValue } from '../../types'
import { CollapseDIKey } from './di'

defineOptions({
  name: 'Collapse'
})

const props = withDefaults(defineProps<CollapseProps>(), {
  accordion: false,
  defaultCollapseAll: false
})
const emit = defineEmits<CollapseEmits>()

const cls = bem('collapse')

const expandTransition = new ExpandTransition({
  transition: 'height 0.24s cubic-bezier(0.4, 0, 0.2, 1)'
})

const { size } = useFormFallbackProps([props], { size: 'default' })

const expandIcon = computed(() => props.expandIcon)

const classList = computed(() => [cls.b, cls.m(size.value)])

const modelValue = useModel<CollapseProps, 'modelValue'>({
  props,
  emit,
  propName: 'modelValue'
})

const activeValues = computed<CollapseValue[]>(() => {
  const v = modelValue.value
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
})

const update = (next: CollapseModelValue) => {
  modelValue.value = next
  emit('change', next)
}

const toggle = (value: CollapseValue) => {
  if (props.accordion) {
    update(activeValues.value[0] === value ? [] : value)
    return
  }

  const values = activeValues.value.slice()
  const index = values.indexOf(value)
  if (index > -1) values.splice(index, 1)
  else values.push(value)
  update(values)
}

// 收集子组件已注册的 values
const registeredValues = ref<CollapseValue[]>([])

// 初始捕获 modelValue 是否具有有效初值
const hasInitialValue =
  modelValue.value !== undefined &&
  modelValue.value !== null &&
  (!Array.isArray(modelValue.value) || modelValue.value.length > 0)

const register = (value: CollapseValue) => {
  if (!registeredValues.value.includes(value)) {
    registeredValues.value.push(value)

    // 若默认展开全部（defaultCollapseAll 为 false）且外部未指定初始值，则自动展开该子项
    if (!props.defaultCollapseAll && !hasInitialValue) {
      if (props.accordion) {
        if (registeredValues.value.length === 1) {
          update(value)
        }
      } else {
        const current = Array.isArray(modelValue.value)
          ? modelValue.value
          : modelValue.value !== undefined && modelValue.value !== null
            ? [modelValue.value]
            : []
        if (!current.includes(value)) {
          update([...current, value])
        }
      }
    }
  }
}

const unregister = (value: CollapseValue) => {
  const idx = registeredValues.value.indexOf(value)
  if (idx > -1) {
    registeredValues.value.splice(idx, 1)
  }
}

provide(CollapseDIKey, {
  cls,
  size,
  expandIcon,
  activeValues,
  toggle,
  expandTransition,
  register,
  unregister
})
</script>
