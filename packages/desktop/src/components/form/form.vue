<template>
  <u-grid
    tag="form"
    ref="gridRef"
    @submit.prevent
    :cols="cols || breakpointCols"
    :class="[cls.b, bem.is('readonly', readonly)]"
  >
    <template
      v-for="{ node, isFormItem, formItemProps, field, modelValue } of getSlotsNodes()"
      :key="node.key"
    >
      <component v-if="isFormItem || !field" :is="node" />

      <u-form-item v-else v-bind="formItemProps">
        <component
          :is="node"
          :model-value="modelValue ?? o(model?.data ?? {}).get(field)"
          @update:model-value="handleUpdateValue(field, $event)"
        />

        <div :class="cls.e('data-before')" v-if="showInitialNode(field)">
          <i :class="cls.e('changed-tag')">变更前：</i>

          <component :is="node" readonly :model-value="o(model?.initialData ?? {}).get(field)" />
        </div>
      </u-form-item>
    </template>
  </u-grid>
</template>

<script lang="tsx" setup generic="Model extends FormModel | DynamicFormModel">
import { o } from '@cat-kit/core'
import { bem } from '@veltra/utils'
import { provideFormContext } from '@veltra/utils'
import { shallowRef, toRef } from 'vue'

import type { BreakCols, GridExposed, FormProps, _FormExposed } from '../../types'
import { UFormItem } from '../form-item'
import { UGrid } from '../grid'
import type { DynamicFormModel } from './dynamic-form-model'
import type { FormModel } from './form-model'
import { useNodeInterceptor } from './use-node-interceptor'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Model>>()

defineSlots<{
  default(props: {
    /** 表单数据 */
    data: Model['data']
    /** 表单模型 */
    model: Model
  }): any
}>()

const cls = bem('form')

const breakpointCols: BreakCols = {
  xs: 1,
  md: 2,
  lg: 3,
  xl: 4,
  default: 4
}

provideFormContext(props)

const { getSlotsNodes } = useNodeInterceptor({ props })

function handleUpdateValue(field: string, value: any) {
  const { model } = props
  if (!model) return
  o(model.data).set(field, value)
}

function showInitialNode(field: string) {
  const { data, initialData } = props.model || {}

  const currentValue = o(data ?? {}).get(field)
  const initialValue = o(initialData ?? {}).get(field)
  const notEqual = !(initialValue === currentValue || (!initialValue && !currentValue))

  return props.showInitialData && notEqual
}

const gridRef = shallowRef<GridExposed>()

defineExpose<_FormExposed>({
  el: toRef(() => gridRef.value?.el)
})
</script>
