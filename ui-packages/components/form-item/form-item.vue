<template>
  <div :class="className">
    <label :class="cls.e('label')" :style="labelStyles">
      {{ label }}
      <UIcon v-if="tips"><InfoFilled /></UIcon>
    </label>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@ui/utils'
import { FormItemProps } from '@ui/types/components/form-item'
import { UIcon } from '../icon'
import { InfoFilled } from 'icon-ultra'
import { type CSSProperties, computed } from 'vue'
import { useFormComponent } from '@ui/compositions'

defineOptions({
  name: 'FormItem'
})

const props = withDefaults(defineProps<FormItemProps>(), {
  size: 'default'
})

const cls = bem('form-item')

const { formProps } = useFormComponent(false)

const className = computed(() => {
  return [cls.b, cls.m(props.size)]
})

const labelStyles = computed<CSSProperties>(() => {
  return {
    width: withUnit(props.labelWidth ?? formProps.labelWidth, 'px')
  }
})
</script>
