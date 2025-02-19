import { defineComponent, shallowRef, toRef, cloneVNode } from 'vue'
import { UGrid } from '../grid'
import { bem } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import { useNodeInterceptor } from './use-node-interceptor'
import { UFormItem } from '../form-item'
import { getChainValue, setChainValue } from 'cat-kit/fe'
import type { FormModel } from './form-model'
import type { DynamicFormModel } from './dynamic-form-model'
import type { BreakCols, GridExposed, FormProps, _FormExposed } from '@ui/types'

export default defineComponent<FormProps<FormModel | DynamicFormModel>>({
  name: 'Form',
  props: {
    model: {
      type: Object,
      required: true
    },
    showInitialData: Boolean,
    labelWidth: [String, Number],
    noTips: Boolean,
    readonly: Boolean,
    disabled: Boolean
  },
  setup(props, { expose }) {
    const model = toRef(() => props.model)
    const cls = bem('form')
    const gridRef = shallowRef<GridExposed>()

    useFormComponent(props)
    const { getSlotsNodes } = useNodeInterceptor({ props })

    function handleUpdateValue(field: string, value: any) {
      const { data } = model.value ?? {}
      if (!data) return

      setChainValue(data, field, value)
    }

    const exposed: _FormExposed = {
      el: toRef(() => gridRef.value?.el)
    }

    expose(exposed)

    const breakpointCols: BreakCols = {
      xs: 1,
      md: 2,
      lg: 3,
      xl: 4,
      default: 4
    }

    return () => {
      const nodes = getSlotsNodes() || []
      const { readonly, showInitialData } = props
      return (
        <UGrid
          tag='form'
          ref='gridRef'
          cols={breakpointCols}
          class={[cls.b, bem.is('readonly', readonly)]}
        >
          {nodes.map(
            ({ node, isFormItem, formItemProps, field, modelValue }) => {
              if (isFormItem || !field) return node

              const currentValue = getChainValue(model.value?.data ?? {}, field)
              const initialValue = getChainValue(
                model.value?.initialData ?? {},
                field
              )

              const newNode = cloneVNode(node, {
                modelValue: modelValue ?? currentValue,
                'onUpdate:modelValue': (event: any) =>
                  handleUpdateValue(field, event)
              })

              const notEqual = !(
                initialValue === currentValue ||
                (!initialValue && !currentValue)
              )

              const showInitialNode = showInitialData && notEqual

              // 不相等，
              const initialNode = showInitialNode ? (
                <div class={cls.e('data-before')}>
                  <i class={cls.e('changed-tag')}>变更前：</i>
                  {cloneVNode(node, {
                    modelValue: initialValue,
                    readonly: true
                  })}
                </div>
              ) : null

              return (
                <UFormItem key={node.key!} {...formItemProps}>
                  {newNode}
                  {initialNode}
                </UFormItem>
              )
            }
          )}
        </UGrid>
      )
    }
  }
})
