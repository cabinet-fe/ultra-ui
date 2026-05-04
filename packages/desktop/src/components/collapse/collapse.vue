<template>
  <div :class="classList" role="region">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps, useModel } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, provide } from 'vue'

import type {
  CollapseEmits,
  CollapseModelValue,
  CollapseProps,
  CollapseValue,
  _CollapseExposed
} from '../../types'
import { CollapseDIKey } from './di'

defineOptions({
  name: 'Collapse'
})

const props = withDefaults(defineProps<CollapseProps>(), {
  accordion: false,
  bordered: true,
  iconPosition: 'right'
})
const emit = defineEmits<CollapseEmits>()

const cls = bem('collapse')

const { size } = useFormFallbackProps([props], { size: 'default' })

const iconPosition = computed(() => props.iconPosition ?? 'right')
const expandIcon = computed(() => props.expandIcon)

const classList = computed(() => [
  cls.b,
  cls.m(size.value),
  cls.m(`icon-${iconPosition.value}`),
  bem.is('bordered', props.bordered)
])

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

const expand = (value: CollapseValue) => {
  if (activeValues.value.includes(value)) return
  if (props.accordion) {
    update(value)
    return
  }
  update([...activeValues.value, value])
}

const collapse = (value: CollapseValue) => {
  if (!activeValues.value.includes(value)) return
  if (props.accordion) {
    update([])
    return
  }
  update(activeValues.value.filter((v) => v !== value))
}

const expandAll = (values: CollapseValue[]) => {
  if (props.accordion) {
    update(values[0] ?? [])
    return
  }
  update([...values])
}

const collapseAll = () => {
  update([])
}

provide(CollapseDIKey, {
  cls,
  size,
  iconPosition,
  expandIcon,
  activeValues,
  toggle
})

defineExpose<_CollapseExposed>({
  toggle,
  expand,
  collapse,
  expandAll,
  collapseAll
})
</script>
