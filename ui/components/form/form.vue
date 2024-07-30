<template>
  <u-grid tag="form" ref="gridRef" :cols="breakpointCols" :class="cls.b">
    <template
      v-for="{
        node,
        isFormItem,
        formItemProps,
        field,
        modelValue
      } of getSlotsNodes()"
      :key="node.key ?? undefined"
    >
      <u-form-item v-if="isFormItem" v-bind="formItemProps">
        <component
          :is="node"
          :model-value="modelValue ?? getChainValue(model?.data ?? {}, field)"
          @update:model-value="handleUpdateValue(field, $event)"
        />
      </u-form-item>

      <component v-else :is="node" />
    </template>
  </u-grid>
</template>

<script lang="ts" setup generic="Model extends FormModel | DynamicFormModel">
import type { FormProps, _FormExposed } from '@ui/types/components/form'
import { UGrid, type GridExposed } from '../grid'
import { bem } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import { useNodeInterceptor } from './use-node-interceptor'
import { UFormItem } from '../form-item'
import { shallowRef, toRef } from 'vue'
import { getChainValue, setChainValue } from 'cat-kit/fe'
import type { DynamicFormModel, FormModel } from './form-model'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Model>>()

const model = toRef(() => props.model)

defineSlots<{
  default(props: {
    /** 表单数据 */
    data: Model['data']
    /** 表单模型 */
    model: Model
  }): any
}>()

const cls = bem('form')

const breakpointCols = { xs: 1, sm: 2, xl: 3, default: 4 }

useFormComponent(props)

const { getSlotsNodes } = useNodeInterceptor({ props })

function handleUpdateValue(field: string, value: any) {
  const { data } = model.value ?? {}
  if (!data) return

  setChainValue(data, field, value)
}

const gridRef = shallowRef<GridExposed>()

defineExpose<_FormExposed>({
  el: toRef(() => gridRef.value?.el)
})
</script>
