<template>
  <u-dropdown :class="cls.b" trigger="click" width="300px">
    <template #trigger>
      <span :class="cls.e('placeholder')">
        {{ model ? model : placeholder }}{{ valueTree }}
      </span>
    </template>
    <template #content>
      <u-scroll height="300px">
        <u-tree v-model="valueTree" :data="options" :label-key="labelKey" :value-key="valueKey" :size="size"
          :disabled="disabled" :checkable="checkable" :expandAll="expandAll" :disabled-node="disabledNode"
          @check="handleCheck" />
      </u-scroll>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import type { TreeSelectProps } from '@ui/types/components/tree-select'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { bem } from '@ui/utils'
import { UDropdown } from '../dropdown'
import { UTree } from '../tree'
import { UScroll } from '../scroll'
import { shallowRef } from 'vue'

defineOptions({
  name: 'TreeSelect'
})

const cls = bem('tree-select')

const props = withDefaults(defineProps<TreeSelectProps<Option>>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  expandAll: true
})

/** 实际值 */
const model = defineModel<Array<string | number>>()

const valueTree = shallowRef<Record<string, any>[]>([])
valueTree.value = [{ "name": "烤冷面", "id": 1 }]

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const handleCheck = (selectd) => {
  model.value = selectd
  valueTree.value = selectd
}


</script>
