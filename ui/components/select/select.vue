<template>
  <u-dropdown
    v-if="!readonly"
    trigger="click"
    :class="[cls.b, bem.is('disabled', disabled)]"
    ref="dropdownRef"
    v-model:visible="dropdownVisible"
    :content-class="[cls.e('panel'), cls.em('panel', size), contentClass]"
    :content-style="contentStyle"
    :disabled="disabled"
    :min-width="minWidth"
    :width="width"
    @keydown="handleKeydown"
    @update:visible="handleDropdownVisible"
  >
    <!-- 触发 -->
    <template #trigger>
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :model-value="selected ? (getChainValue(selected, labelKey) ?? label) : modelValue"
        @clear="handleClear"
        @keydown="handleKeydown"
        native-readonly
      >
        <template #prefix v-if="$slots.prefix">
          <slot name="prefix" />
        </template>

        <template #suffix>
          <u-icon :class="cls.e('arrow')">
            <ArrowDown />
          </u-icon>
        </template>
      </u-input>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="cls.e('content-filter')">
        <u-input placeholder="输入关键字进行搜索" tabindex="0" v-focus v-model="queryString">
          <template #suffix>
            <u-icon>
              <Search />
            </u-icon>
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
          bem.is('virtual', virtualEnabled),
          bem.is('grid', !!grid)
        ]"
        :content-style="{
          height: virtualEnabled ? withUnit(totalHeight, 'px') : undefined,
          gridTemplateColumns: grid ? `repeat(${grid.cols}, minmax(0px, 1fr))` : undefined,
          gridGap: grid ? withUnit(grid.gap, 'px') : undefined
        }"
      >
        <template v-if="virtualEnabled">
          <!-- @vue-ignore -->
          <li
            v-for="{ option, index, val, label, key, offset } of virtualOptions"
            :class="[optionClass, bem.is('selected', index === currentIndex)]"
            @click="handleSelect(option, index)"
            :key="key"
            :style="{ transform: `translateY(${offset}px)` }"
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
            :class="[optionClass, bem.is('selected', index === currentIndex)]"
            @click="handleSelect(option, index)"
            :data-index="index"
            :title="getChainValue(option, labelKey)"
            :key="getChainValue(option, valueKey)"
          >
            <slot v-bind="{ option, index }"> {{ getChainValue(option, labelKey) }} </slot>
          </li>
        </template>
      </u-scroll>

      <div v-else :class="cls.e('empty')">
        <UEmpty />
      </div>
    </template>
  </u-dropdown>

  <template v-else>
    {{ label || selected?.[labelKey] || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import {
  useFormComponent,
  useFormFallbackProps,
  useUserOpration,
  useVirtual
} from '@ui/compositions'
import { vFocus } from '@ui/directives'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import type {
  SelectEmits,
  SelectProps,
  _SelectExposed,
  DropdownExposed,
  ScrollExposed
} from '@ui/types'
import { bem, withUnit, scrollIntoContainerView } from '@ui/utils'
import { ArrowDown, Search } from '@ultra/icon'
import { getChainValue } from 'cat-kit/fe'
import { computed, nextTick, shallowRef, watch } from 'vue'

import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { UIcon } from '../icon'
import { UInput } from '../input'
import { UScroll } from '../scroll'
import { useKeyboard } from './use-keyboard'
import { useOptions } from './use-options'

defineOptions({ name: 'Select' })

const props = withDefaults(defineProps<SelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<SelectEmits>()

defineSlots<{
  /** 前缀插槽 */
  prefix?: () => any
  /** 默认插槽 */
  default?: (scope: { option: Record<string, any>; index: number }) => any
}>()

const cls = bem('select')

const optionClass = cls.e('option')

const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const currentIndex = shallowRef(-1)
const label = defineModel('text')
const selected = shallowRef<Record<string, any>>()

const dropdownRef = shallowRef<DropdownExposed>()
const scrollRef = shallowRef<ScrollExposed>()

const filterable = computed(() => {
  return props.filterable || typeof props.options === 'function'
})

const { queryString, options, temOptionsToCreatedOptions, clearCreatedOptions } = useOptions({
  props
})

const { isUserOprating, markAsUserOpration } = useUserOpration()

// 回显
watch(
  [() => props.modelValue, options],
  ([modelValue, options]) => {
    if (isUserOprating()) return

    if (!options?.length) return

    if (modelValue !== undefined) {
      const { valueKey } = props
      currentIndex.value = options.findIndex(
        (option) => getChainValue(option, valueKey) === modelValue
      )
      selected.value = options[currentIndex.value]
    } else {
      currentIndex.value = -1
      selected.value = undefined
    }
  },
  { immediate: true }
)

const {
  virtualList,
  totalHeight,
  virtualEnabled: _virtualEnabled,
  scrollTo,
  measureElement
} = useVirtual({
  count: computed(() => options.value.length),
  virtualThreshold: 80,
  scrollEl: computed(() => scrollRef.value?.containerRef ?? null),
  gap: 4,
  estimateSize: () => 40
})

const virtualEnabled = computed(() => {
  return _virtualEnabled.value && !props.grid
})

const virtualOptions = computed(() => {
  const _options = options.value
  const { labelKey, valueKey } = props
  return virtualList.value.map((item) => {
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

watch([scrollRef, virtualEnabled], ([scroll, virtualEnabled]) => {
  if (!scroll || !props.modelValue) return

  if (virtualEnabled) {
    const index = options.value.findIndex((option) => option === selected.value)
    index !== -1 && dropdownVisible.value && nextTick(() => scrollTo(index))
  } else {
    const selectedEl = scroll?.contentRef?.getElementsByClassName('is-selected')[0]
    if (selectedEl) {
      scrollIntoContainerView(selectedEl as HTMLElement, scroll.containerRef ?? null)
    }
  }
})

const dropdownVisible = shallowRef(false)

watch(dropdownVisible, (v) => {
  if (!v) {
    queryString.value = ''
  }
})

const handleDropdownVisible = (visible: boolean) => {
  if (!visible) {
    queryString.value = ''
  }
}

/** 单选 */
const handleSelect = markAsUserOpration((option: Record<string, any>, index: number) => {
  selected.value = option

  emit('update:modelValue', option?.[props.valueKey])
  label.value = option?.[props.labelKey]
  emit('change', option)
  if (option.__isTemp) {
    temOptionsToCreatedOptions()
  }
  currentIndex.value = index
  dropdownRef.value?.close()
})

/** 清除选项 */
const handleClear = markAsUserOpration(() => {
  selected.value = undefined
  currentIndex.value = -1
  clearCreatedOptions()
  emit('update:modelValue', undefined)
  emit('change', undefined)
})

function getCurrentEl() {
  return scrollRef.value?.contentRef?.querySelector('li.is-selected') as HTMLElement | undefined
}

const { handleKeydown } = useKeyboard({
  options,
  currentIndex,
  selectOption: handleSelect,
  getCurrentEl
})
</script>
