<template>
  <u-grid-item :span="span" :class="className">
    <label
      v-if="props.label || $slots.label"
      :class="[cls.e('label'), bem.is('required', !!rules?.required)]"
      :style="labelStyles"
    >
      <u-tip v-if="tips" :content="tips" :class="cls.e('tips')">
        <span :class="cls.e('tip-label')">
          <slot name="label">{{ label }}:</slot>
        </span>
      </u-tip>
      <template v-else>
        <slot name="label">{{ label }}:</slot>
      </template>
    </label>

    <section :class="cls.e('wrapper')">
      <div :class="cls.e('content')">
        <slot></slot>
      </div>

      <!-- 只有表单控件处于非只读状态时，才显示错误提示 -->
      <section :class="cls.e('error')" v-if="!readonly && !formProps?.noTips">
        <transition name="form-item-tips" mode="out-in">
          <span :class="cls.e('error-text')" v-if="!!errorTip">
            {{ errorTip }}
          </span>
        </transition>
      </section>
    </section>
  </u-grid-item>
</template>

<script lang="tsx" setup>
import { o } from '@cat-kit/core'
import { useConfig, useFallbackProps } from '@veltra/compositions'
import { bem, withUnit } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { type CSSProperties, computed, onBeforeUnmount, shallowRef, watch } from 'vue'

import type { FormItemProps, ComponentSize } from '../../types'
import { UGridItem } from '../grid'
import { UTip } from '../tip'
import { formItemCls as cls, defineField } from './helper'
import { validateField } from './validate'

defineOptions({ name: 'UFormItem' })

const props = withDefaults(defineProps<FormItemProps>(), { readonly: undefined })

defineSlots<{
  /** 标签插槽 */
  label?: () => any
  default?: () => any
}>()

/** 表单组件上下文 */
const { formProps, registerField, unregisterField, shouldValidate, handleFieldChange } =
  injectFormContext()

const { config } = useConfig()

const { size, readonly } = useFallbackProps([formProps ?? {}, props], {
  size: 'default' as ComponentSize,
  readonly: false
})

const errorTip = shallowRef<string>()
/** 递增序号，丢弃过期的异步校验结果 */
let validateSeq = 0
/** 最近一次 validate 的 Promise，供过期调用等待最新结果 */
let latestValidatePromise: Promise<boolean> = Promise.resolve(true)

const className = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('error', !!errorTip.value)].join(' ')
})

/** label样式 */
const labelStyles = computed<CSSProperties>(() => {
  return {
    width: withUnit(props.labelWidth ?? formProps?.labelWidth ?? config.form.labelWidth, 'px')
  }
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
        handleFieldChange?.(field, value)
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
