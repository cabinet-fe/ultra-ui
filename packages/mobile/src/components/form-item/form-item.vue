<template>
  <div :class="className">
    <label
      v-if="props.label || $slots.label"
      :class="[cls.e('label'), bem.is('required', !!rules?.required)]"
      :style="labelStyles"
    >
      <slot name="label">{{ label }}</slot>
    </label>

    <section :class="cls.e('wrapper')">
      <div :class="cls.e('content')">
        <ContentSlot>
          <slot></slot>
        </ContentSlot>
      </div>

      <!-- 只有表单控件处于非只读状态时，才显示错误提示（行内下方，不弹桌面 tooltip） -->
      <transition name="form-item-tips">
        <span :class="cls.e('error-text')" v-if="!readonly && !formProps?.noTips && !!errorTip">
          {{ errorTip }}
        </span>
      </transition>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { useFallbackProps } from '@veltra/compositions'
import { extractNormalVNodes, injectFormContext, withUnit } from '@veltra/utils'
import type { ComponentSize } from '@veltra/utils'
import {
  type CSSProperties,
  type SetupContext,
  type VNode,
  cloneVNode,
  computed,
  onBeforeUnmount,
  shallowRef,
  watch
} from 'vue'

import { bem } from '../../shared/bem'
import type { FormItemEmits, FormItemProps } from '../../types/form-item'
import { formItemCls as cls, defineField } from './helper'
import { validateField } from './validate'

defineOptions({ name: 'UFormItem' })

const props = withDefaults(defineProps<FormItemProps>(), { readonly: undefined })

const emit = defineEmits<FormItemEmits>()

defineSlots<{
  /** 标签插槽 */
  label?: () => any
  default?: () => any
}>()

/** 表单组件上下文 */
const { formProps, registerField, unregisterField, shouldValidate, handleFieldUpdate } =
  injectFormContext()

function wrapControlChange(node: VNode) {
  if (!node || typeof node.type === 'symbol') return node

  return cloneVNode(node, {
    onChange: (...args: any[]) => {
      emit('change', ...args)
    }
  })
}

/**
 * 承载默认插槽并拦截控件 change。
 * 必须经填充插槽接收内容（而非直接读 UFormItem 的 $slots）：
 * 读父级 $slots 时组件自身没有更新路径，父级重渲染后动态 props（disabled、data 等）会冻结在首帧。
 */
function ContentSlot(_: unknown, { slots }: SetupContext) {
  return extractNormalVNodes(slots.default?.() ?? []).map(wrapControlChange)
}

const { size, readonly } = useFallbackProps([formProps ?? {}, props], {
  size: 'default' as ComponentSize,
  readonly: false
})

const errorTip = shallowRef<string>()
/** 递增序号，丢弃过期的异步校验结果 */
let validateSeq = 0
/** 最近一次 validate 的 Promise，供过期调用等待最新结果 */
let latestValidatePromise: Promise<boolean> = Promise.resolve(true)

/** 移动端默认列表行式：label 在左、控件占右侧；'top' 时纵向堆叠 */
const labelPosition = computed(() => props.labelPosition ?? formProps?.labelPosition ?? 'left')

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('error', !!errorTip.value),
    bem.is('label-top', labelPosition.value === 'top')
  ].join(' ')
})

/** label 宽度：传了 labelWidth（自身或 UForm）用固定宽，否则按内容自适应 */
const labelStyles = computed<CSSProperties>(() => {
  if (labelPosition.value !== 'left') return {}
  const width = props.labelWidth ?? formProps?.labelWidth
  return width === undefined ? {} : { width: withUnit(width, 'px') }
})

const fieldItem = defineField({
  clearValidate() {
    errorTip.value = ''
  },
  async validate() {
    if (!props.field || !formProps?.model || !props.rules || !shouldValidate?.()) return true

    const seq = ++validateSeq

    latestValidatePromise = validateField(formProps.model!, props.field!, props.rules!).then(
      (tip) => {
        if (seq !== validateSeq) return latestValidatePromise

        errorTip.value = tip
        return !errorTip.value
      }
    )
    return latestValidatePromise
  }
})

watch(
  () => props.field,
  (field, oldField) => {
    if (oldField) {
      unregisterField?.(oldField)
    }
    if (field) {
      registerField?.(field, fieldItem)
    }
  },
  { immediate: true }
)

let stopWatchFieldValue: (() => void) | undefined

watch(
  [() => formProps?.model, () => props.field],
  ([model, field]) => {
    stopWatchFieldValue?.()

    if (!field || !model) return

    stopWatchFieldValue = watch(
      () => o(model).get(field),
      (value) => {
        handleFieldUpdate?.(field, value)
        fieldItem.validate()
      }
    )
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  props.field && unregisterField?.(props.field)
})
</script>
