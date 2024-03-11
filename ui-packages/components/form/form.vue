<template>
  <u-grid tag="form" :cols="{ xs: 1, sm: 2, xl: 3, default: 4 }" :class="cls.b">
    <UNodeRender :content="renderSlots()" />
  </u-grid>
</template>

<script lang="ts" setup generic="Rules extends Record<string, ValidateRule>">
import type { FormProps } from '@ui/types/components/form'
import type { ValidateRule } from '@ui/types/utils/form/validate'
import { UGrid } from '../grid'
import { Validator, bem } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import {
  computed,
  inject,
  useSlots,
  type ShallowRef,
  type VNode
} from 'vue'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Rules>>()

const cls = bem('form')

const validator = computed(() => {
  return props.rules ? new Validator(props.rules) : undefined
})

const injected = useFormComponent(true, props)!

const slots = useSlots()

let renderSlots: () => VNode[] | null

if (props.use) {
  // 注入useForm组合式方法中提供的表单方法和数据

  const { data } = inject<{
    data: Record<string, any>
    errors: ShallowRef<Record<string, any>>
    validate: () => Promise<Boolean>
  }>(props.use) || {}

  renderSlots = () => {
    const nodes = slots.default?.()
    if (!nodes?.length) return null

    return nodes.map(node => {
      if (node.props?.field && data) {
        const field = node.props.field
        node.props.modelValue = data[field]
        node.props['onUpdate:modelValue'] = value => {
          data[field] = value
        }
      }
      return node
    })
  }
} else {
  renderSlots = () => {
    const nodes = slots.default?.()
    if (!nodes?.length) return null

    return nodes.map(node => {

      if (node.props?.field) {
        const field = node.props.field
        node.props.modelValue = props.data?.[field]
        node.props.onUpdateModelValue = value => {
          props.data[field] = value
        }
      }
      return node
    })
  }
}

defineExpose({
  /** 表单校验 */
  async validate(fields?: keyof Rules | (keyof Rules)[]) {
    const errors = await validator.value?.validate(props.data, fields)

    for (const _ in errors) {
      return false
    }
    return true
  }
})
</script>
