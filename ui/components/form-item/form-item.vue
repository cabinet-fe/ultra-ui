<template>
  <div :class="className">
    <label
      v-if="label"
      :class="[cls.e('label'), bem.is('required', fieldRequired)]"
      :style="labelStyles"
    >
      {{ label }}
    </label>

    <section :class="cls.e('content')">
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
import { useFallbackProps, useFormComponent } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'

defineOptions({
  name: 'FormItem'
})

const props = withDefaults(defineProps<FormItemProps>(), {
  readonly: undefined
})

const cls = bem('form-item')

/** 表单组件上下文 */
const { formProps } = useFormComponent()

const { size, readonly, labelWidth } = useFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default' as ComponentSize,
    readonly: false,
    labelWidth: '80px' as string | number
  }
)

const className = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('error', !!errorTips.value)].join(
    ' '
  )
})

/** label样式 */
const labelStyles = computed<CSSProperties>(() => {
  return {
    width: withUnit(labelWidth.value, 'px')
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
  if (!field || readonly.value) return false
  const required = formProps?.model?.rules[field]?.required
  return required ? true : false
})
</script>
