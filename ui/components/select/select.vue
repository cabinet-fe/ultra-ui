<template>
  <u-dropdown
    v-if="!readonly"
    trigger="click"
    :class="[cls.b, bem.is('disabled', disabled)]"
    ref="dropdownRef"
    v-model:visible="dropdownVisible"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    :disabled="disabled"
  >
    <!-- 触发 -->
    <template #trigger>
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :model-value="selected?.[labelKey] || label"
        @clear="handleClear"
        native-readonly
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="cls.e('content-filter')">
        <u-input placeholder="输入关键字进行搜索" v-model="queryString">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <!-- 单选列表 -->
      <u-scroll
        v-if="options.length"
        tag="ul"
        :class="cls.e('options')"
        ref="scrollRef"
        :content-class="[
          cls.e('options-wrap'),
          bem.is('virtual', virtualEnabled)
        ]"
        :content-style="{
          height: virtualEnabled ? withUnit(totalHeight, 'px') : undefined
        }"
      >
        <template v-if="virtualEnabled">
          <!-- @vue-ignore -->
          <li
            v-for="{ option, index, val, label, key, offset } of virtualOptions"
            :class="[optionClass, bem.is('selected', val === model)]"
            @click="handleSelect(option)"
            v-ripple="cls.e('ripple')"
            :key="key"
            :style="{
              transform: `translateY(${offset}px)`
            }"
            :data-index="index"
            :ref="measureElement"
          >
            <slot v-bind="{ option, index }">
              {{ label }}
            </slot>
          </li>
        </template>

        <template v-else>
          <li
            v-for="(option, index) of options"
            :class="[
              optionClass,
              bem.is('selected', getChainValue(option, valueKey) === model)
            ]"
            @click="handleSelect(option)"
            v-ripple="cls.e('ripple')"
            :key="getChainValue(option, valueKey)"
          >
            <slot v-bind="{ option, index }">
              {{ getChainValue(option, labelKey) }}
            </slot>
          </li>
        </template>
      </u-scroll>

      <div v-else :class="cls.e('empty')">
        <UEmpty />
      </div>
    </template>
  </u-dropdown>

  <span v-else>{{ label || selected?.[labelKey] || FORM_EMPTY_CONTENT }}</span>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { computed, nextTick, shallowRef, watch } from 'vue'
import type {
  SelectEmits,
  SelectProps,
  _SelectExposed
} from '@ui/types/components/select'
import { bem, withUnit } from '@ui/utils'
import {
  useFormComponent,
  useFormFallbackProps,
  useVirtual
} from '@ui/compositions'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { UScroll, type ScrollExposed } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { ArrowDown, Search } from 'icon-ultra'
import { vRipple } from '@ui/directives'
import { useOptions } from './use-options'
import { UEmpty } from '../empty'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import { getChainValue } from 'cat-kit/fe'

defineOptions({
  name: 'Select'
})

const props = withDefaults(defineProps<SelectProps<Option>>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<SelectEmits<Option>>()

const cls = bem('select')

const optionClass = cls.e('option')

const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const model = defineModel<string | number>()
const label = defineModel('text')
const selected = shallowRef<Record<string, any>>()

const dropdownRef = shallowRef<DropdownExposed>()
const scrollRef = shallowRef<ScrollExposed>()

const filterable = computed(() => {
  return props.filterable || typeof props.options === 'function'
})

const { queryString, options } = useOptions({
  props
})

let modelIsChangedBySelected = false
let setIsChangedByModel = false
watch(
  [model, options],
  ([modelValue, options]) => {
    if (!options?.length || modelIsChangedBySelected) return
    setIsChangedByModel = true
    if (modelValue !== undefined) {
      const { valueKey } = props
      selected.value = options.find(option => option[valueKey] === modelValue)
    } else {
      selected.value = undefined
    }
    setIsChangedByModel = false
  },
  { immediate: true }
)

watch(selected, selected => {
  if (setIsChangedByModel) return

  modelIsChangedBySelected = true

  model.value = selected?.[props.valueKey]
  label.value = selected?.[props.labelKey]

  modelIsChangedBySelected = false
})

const { virtualList, totalHeight, virtualEnabled, scrollTo, measureElement } =
  useVirtual({
    count: computed(() => options.value.length),
    virtualThreshold: 80,
    scrollEl: computed(() => scrollRef.value?.containerRef ?? null),
    gap: 2,
    estimateSize: () => 40
  })

const virtualOptions = computed(() => {
  const _options = options.value
  const { labelKey, valueKey } = props
  return virtualList.value.map(item => {
    const option = _options[item.index]!
    return {
      option,
      index: item.index,
      label: getChainValue(option, labelKey),
      val: getChainValue(option, valueKey),
      key: item.key,
      offset: item.start
    }
  })
})

watch(scrollRef, scroll => {
  if (scroll && model.value !== undefined) {
    nextTick(() => {
      if (virtualEnabled.value) {
        const index = virtualList.value.find(
          option => option === selected.value
        )?.index
        index !== undefined && scrollTo(index)
      } else {
        scrollRef.value?.contentRef
          ?.getElementsByClassName('is-selected')[0]
          ?.scrollIntoView()
      }
    })
  }
})

const dropdownVisible = shallowRef(false)

watch(dropdownVisible, v => {
  if (!v) {
    queryString.value = ''
  }
})

/** 单选 */
const handleSelect = (option: Option) => {
  selected.value = option
  dropdownRef.value?.close()
  emit('change', option)
}

/** 清除选项 */
const handleClear = () => {
  selected.value = undefined
}
</script>
