<template>
  <div :class="classList" role="region">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useModel } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, provide, watch } from 'vue'

import type { CollapseEmits, CollapseProps } from '../../types'
import { CollapseDIKey } from './di'

defineOptions({
  name: 'Collapse'
})

const props = withDefaults(defineProps<CollapseProps>(), {
  accordion: false
})
const emit = defineEmits<CollapseEmits>()

const cls = bem('collapse')

const classList = computed(() => {
  return [cls.b]
})

const modelValue = useModel(props, emit, 'modelValue')

const activeValues = computed<(string | number)[]>(() => {
  if (modelValue.value === undefined || modelValue.value === null) {
    return []
  }
  return Array.isArray(modelValue.value) ? modelValue.value : [modelValue.value]
})

const handleItemClick = (value: string | number) => {
  if (props.accordion) {
    if (activeValues.value[0] === value) {
      modelValue.value = []
    } else {
      modelValue.value = value
    }
  } else {
    const values = [...activeValues.value]
    const index = values.indexOf(value)
    if (index > -1) {
      values.splice(index, 1)
    } else {
      values.push(value)
    }
    modelValue.value = values
  }
  emit('change', modelValue.value!)
}

provide(CollapseDIKey, {
  cls,
  collapseProps: props,
  activeValues,
  handleItemClick
})
</script>
