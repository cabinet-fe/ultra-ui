<template>
  <u-grid-item :span="span" :class="className">
    <label
      v-if="props.label || $slots.label"
      :class="[cls.e('label'), bem.is('required', fieldRequired)]"
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

    <section :class="cls.e('content')">
      <slot></slot>

      <section v-if="!readonly" :class="cls.e('error')">
        <transition name="form-item-tips" mode="out-in">
          <span :class="cls.e('error-text')" v-if="!!errorTips">
            {{ errorTips }}
          </span>
        </transition>
      </section>
    </section>
  </u-grid-item>
</template>

<script lang="tsx" setup>
import { bem, withUnit } from '@ui/utils'
import type { FormItemProps } from '@ui/types/components/form-item'
import { type CSSProperties, computed } from 'vue'
import { useConfig, useFallbackProps, useFormComponent } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'
import { UGridItem } from '../grid'
import { UTip } from '../tip'

defineOptions({
  name: 'FormItem'
})

const props = withDefaults(defineProps<FormItemProps>(), {
  readonly: undefined
})

defineSlots<{
  /** 标签插槽 */
  label?: () => any
  default?: () => any
}>()

const cls = bem('form-item')

/** 表单组件上下文 */
const { formProps } = useFormComponent()

const { config } = useConfig()

const { size, readonly } = useFallbackProps([formProps ?? {}, props], {
  size: 'default' as ComponentSize,
  readonly: false
})

const className = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('error', !!errorTips.value)].join(
    ' '
  )
})

/** label样式 */
const labelStyles = computed<CSSProperties>(() => {
  return {
    width: withUnit(
      props.labelWidth ?? formProps?.labelWidth ?? config.form.labelWidth,
      'px'
    )
  }
})

/** 错误提示 */
const errorTips = computed<string | undefined>(() => {
  if (props.field) {
    return formProps?.model.errors.get(props.field)?.[0]
  }
})

/** 字段是否必须 */
const fieldRequired = computed<boolean>(() => {
  const { field } = props
  if (!field || readonly.value) return false
  const required = formProps?.model?.fields[field]?.required
  return required ? true : false
})
</script>
