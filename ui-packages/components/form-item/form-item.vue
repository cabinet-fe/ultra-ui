<template>
  <div :class="className">
    <label :class="cls.e('label')" :style="labelStyles">
      {{ label }}
      <UIcon v-if="tips"><InfoFilled /></UIcon>
    </label>

    <section :class="cls.e('content')">
      <slot />
      <section v-if="showTips" :class="[cls.e('tips'), bem.is('error')]">
        1111
      </section>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@ui/utils'
import type { FormItemProps } from '@ui/types/components/form-item'
import { UIcon } from '../icon'
import { InfoFilled } from 'icon-ultra'
import { type CSSProperties, computed, inject } from 'vue'
import { useFormComponent } from '@ui/compositions'

defineOptions({
  name: 'FormItem'
})

const props = withDefaults(defineProps<FormItemProps>(), {
  size: 'default'
})

const cls = bem('form-item')

/** 表单组件上下文 */
const { formProps } = useFormComponent(false)

const className = computed(() => {
  return [cls.b, cls.m(props.size)]
})

const labelStyles = computed<CSSProperties>(() => {
  return {
    width: withUnit(props.labelWidth ?? formProps.labelWidth, 'px')
  }
})

const showTips = computed<boolean>(() => {
  return !props.noTips && !formProps.noTips
})
</script>
