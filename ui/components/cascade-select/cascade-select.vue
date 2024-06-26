<template>
  <div :class="cls.b">
    <u-dropdown>
      <template #trigger>
        <u-input
          :size="size"
          :disabled="disabled"
          :placeholder="placeholder"
          :clearable="clearable"
          v-model="cascade"
          @clear="handleClear"
          native-readonly
        >
          <template #suffix>
            <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
          </template>
        </u-input>
      </template>

      <template #content>
        <u-scroll tag="ul" :class="cls.e('options')" ref="scrollRef">
          <li
            v-for="(option, index) of options"
            :class="[
              cls.e('option'),
              bem.is('selected', option[valueKey] === model)
            ]"
            @click="handleSelect(option)"
            v-ripple="cls.e('ripple')"
            :data-key="option[valueKey]"
            :key="option[valueKey]"
          >
            <slot v-bind="{ option, index }">
              {{ option[labelKey] }}
            </slot>
          </li>
        </u-scroll>
      </template>
    </u-dropdown>
  </div>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type { CascadeSelectProps } from '@ui/types/components/cascade-select'
import { bem } from '@ui/utils'
import { ref, shallowRef } from 'vue'
import { ArrowDown } from 'icon-ultra'
import { useOptions } from './use-options'
import type { CascadeSelectEmits } from '.'

defineOptions({
  name: 'CascadeSelect'
})

const cls = bem('cascade-select')

const emit = defineEmits<CascadeSelectEmits<Option>>()

const props = withDefaults(defineProps<CascadeSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const { formProps } = useFormComponent()
const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const cascade = ref([])

const selected = shallowRef<Record<string, any>>()

/** 清除选项 */
const handleClear = () => {
  selected.value = undefined
}

const { options } = useOptions(props)

/** 单选 */
const handleSelect = (option: any[]) => {
  selected.value = option
  // dropdownRef.value?.close()
  emit('change', option)
}
</script>
