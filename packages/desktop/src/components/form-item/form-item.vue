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
import { useConfig, useFallbackProps } from '@veltra/compositions'
import { bem, withUnit } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { type CSSProperties, computed, onBeforeUnmount, shallowRef } from 'vue'

import type { FormItemProps, ComponentSize } from '../../types'
import { UGridItem } from '../grid'
import { UTip } from '../tip'
import { formItemCls as cls, defineField } from './helper'
import { validateField } from './validate'

defineOptions({ name: 'FormItem' })

const props = withDefaults(defineProps<FormItemProps>(), { readonly: undefined })

defineSlots<{
  /** 标签插槽 */
  label?: () => any
  default?: () => any
}>()

/** 表单组件上下文 */
const { formProps, registerField, unregisterField } = injectFormContext()

const { config } = useConfig()

const { size, readonly } = useFallbackProps([formProps ?? {}, props], {
  size: 'default' as ComponentSize,
  readonly: false
})

const errorTip = shallowRef<string>()

const className = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('error', !!errorTip.value)].join(' ')
})

/** label样式 */
const labelStyles = computed<CSSProperties>(() => {
  return {
    width: withUnit(props.labelWidth ?? formProps?.labelWidth ?? config.form.labelWidth, 'px')
  }
})

if (props.field) {
  const fieldItem = defineField({
    clearValidate() {
      errorTip.value = ''
    },
    async validate() {
      if (!props.field || !formProps?.model || !props.rules) return true

      errorTip.value = await validateField(formProps.model, props.field, props.rules)

      return !errorTip.value
    }
  })
  registerField?.(props.field, fieldItem)
}

onBeforeUnmount(() => {
  props.field && unregisterField?.(props.field)
})
</script>
