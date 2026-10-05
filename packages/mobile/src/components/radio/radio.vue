<template>
  <label :class="classList">
    <input
      type="radio"
      :class="cls.e('native')"
      :value="value"
      v-model="model"
      :disabled="disabled"
    />

    <span :class="cls.e('label')">
      <slot>{{ label }}</slot>
    </span>

    <!-- 右侧圆形选中标记：列表行式选项的移动端惯例 -->
    <span :class="cls.e('indicator')">
      <transition name="zoom-in">
        <span :class="cls.e('dot')" v-if="radioChecked"></span>
      </transition>
    </span>
  </label>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import { bem } from '../../shared/bem'
import type { RadioEmits, RadioProps } from '../../types/radio'

defineOptions({ name: 'URadio' })

const model = defineModel<any>()

const props = withDefaults(defineProps<RadioProps>(), { disabled: undefined })

defineEmits<RadioEmits>()

const cls = bem('radio')

const { formProps } = injectFormContext()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const radioChecked = computed(() => model.value === props.value)

const classList = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('checked', radioChecked.value)
  ]
})
</script>
