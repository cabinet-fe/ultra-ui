<template>
  <div :class="className">
    <label
      :class="[cls.e('label'), bem.is('required', fieldRequired)]"
      :style="labelStyles"
    >
      {{ label }}
    </label>

    <section :class="[cls.e('content'), bem.is('error', !!errorTips)]">
      <slot />

      <section v-if="showTips" :class="cls.e('tips')">
        <transition name="form-item-tips" mode="out-in">
          <span :class="cls.em('tips', 'error')" v-if="!!errorTips">{{
            errorTips
          }}</span>
          <span :class="cls.em('tips', 'info')" v-else>{{ tips }}</span>
        </transition>
      </section>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@ui/utils'
import type { FormItemProps } from '@ui/types/components/form-item'
import { type CSSProperties, computed } from 'vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'FormItem'
})

const props =  withDefaults(defineProps<FormItemProps>(), {
  readonly: undefined
})

const cls = bem('form-item')

/** 表单组件上下文 */
const { formProps } = useFormComponent()

const { size, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  readonly: false
})

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

/** label样式 */
const labelStyles = computed<CSSProperties>(() => {
  return {
    width: withUnit(props.labelWidth ?? formProps?.labelWidth, 'px')
  }
})

const showTips = computed<boolean>(() => {
  return !props.noTips && !formProps?.noTips && !readonly.value
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
  if (!field) return false
  const required = formProps?.model?.rules[field]?.required
  return required ? true : false
})
</script>
