<template>
  <u-grid tag="form" :cols="{ xs: 1, sm: 2, xl: 3, default: 4 }" :class="cls.b">
    <template
      v-for="{ node, isFormItem, formItemProps, field } of getSlotsNodes()"
      :key="node.key ?? undefined"
    >
      <u-form-item v-if="isFormItem" v-bind="formItemProps">
        <component
          :is="node"
          :model-value="getChainValue(model?.data ?? {}, field)"
          @update:model-value="handleUpdateValue(field, $event)"
        />
      </u-form-item>

      <component v-else :is="node" />
    </template>
  </u-grid>
</template>

<script lang="ts" setup generic="Model extends FormModel">
import type { FormProps } from '@ui/types/components/form'
import { UGrid } from '../grid'
import { bem } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import { useNodeInterceptor } from './use-node-interceptor'
import type { FormModel } from './form-model'
import { UFormItem } from '../form-item'
import { toRef } from 'vue'
import { getChainValue, setChainValue } from 'cat-kit/fe'

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

useFormComponent(props)

const { getSlotsNodes } = useNodeInterceptor({ props })

function handleUpdateValue(field: string, value: any) {
  const { data } = model.value ?? {}
  if (!data) return

  setChainValue(data, field, value)
}
</script>
