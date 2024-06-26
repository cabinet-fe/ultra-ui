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
          <CascadeItem
            v-for="option of filteredOptions"
            v-bind="{ $attrs, ...props,option }"
          />
          <!-- <li
            v-for="(option, index) of filteredOptions"
            :class="[
              cls.e('option'),
              bem.is('selected', option[valueKey] === model),
            ]"
            @click="handleSelect(option[valueKey])"
            :data-key="option[valueKey]"
            :key="option[valueKey]"
          >
            <slot v-bind="{ option, index }">
              {{ option[labelKey] }}
            </slot>
          </li> -->
        </u-scroll>
      </template>
    </u-dropdown>
  </div>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import type { CascadeProps, CascadeEmits } from "@ui/types/components/cascade"
import { bem } from "@ui/utils"
import { computed, shallowRef, watch } from "vue"
import { ArrowDown } from "icon-ultra"
import { useOptions } from "./use-options"
import CascadeItem from "./cascade-item.vue"
import { omit } from "cat-kit/fe"

defineOptions({
  name: "Cascade",
})

const cls = bem("cascade")

const emit = defineEmits<CascadeEmits<Option>>()

const props = withDefaults(defineProps<CascadeProps>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  childrenKey: "children",
})

const model = defineModel<string | number>()

const { formProps } = useFormComponent()
const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: "default",
  disabled: false,
  readonly: false,
})

const cascade = shallowRef<string>()

const selected = shallowRef<Record<string, any>>()

/** 清除选项 */
const handleClear = () => {
  selected.value = undefined
}

const filteredOptions = shallowRef<Record<string, any>>([])

watch(
  () => [props.options, model],
  () => {
    const { options } = useOptions({ ...props })

    filteredOptions.value = options
    console.log(filteredOptions.value)
  },
  { immediate: true }
)

</script>
