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
        :model-value="displayedValue"
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

      <!--
        单选列表。虚拟化启用时，内容容器 height 由 useVirtualizer 命令式写入；
        此处 content-style 仅承担 grid 相关样式，避免 height 变化触发模板重渲染。
      -->
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
            :ref="(el) => measureElement(index, el as Element | null)"
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
            :title="o(option).get(labelKey)"
            :key="o(option).get(valueKey)"
          >
            <slot v-bind="{ option, index }">
              {{ o(option).get(labelKey) }}
            </slot>
          </li>
        </template>
      </u-scroll>

      <div v-else :class="cls.e('empty')">
        <UEmpty />
      </div>
    </template>
  </u-dropdown>

  <template v-else>
    {{ displayedValue || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { useFormFallbackProps, useVirtualizer } from '@veltra/compositions'
import { vFocus } from '@veltra/directives'
import { ArrowDown, Search } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT, scrollIntoContainerView, withUnit } from '@veltra/utils'
import { computed, nextTick, shallowRef, watch } from 'vue'

import type {
  SelectEmits,
  SelectProps,
  _SelectExposed,
  DropdownExposed,
  ScrollExposed
} from '../../types'
import { injectFormContext } from '../../utils/form-context'
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

const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const currentIndex = shallowRef(-1)
const label = defineModel('text')
const selected = shallowRef<Record<string, any>>()

const displayedValue = computed(() => {
  if (label.value) return label.value

  return selected.value ? o(selected.value).get(props.labelKey) : String(props.modelValue ?? '')
})

const dropdownRef = shallowRef<DropdownExposed>()
const scrollRef = shallowRef<ScrollExposed>()

const filterable = computed(() => {
  return props.filterable || typeof props.options === 'function'
})

const { queryString, options, temOptionsToCreatedOptions, clearCreatedOptions } = useOptions({
  props
})

// TODO: 优化
let userSelecting = false
function lock() {
  userSelecting = true
}

function unlock() {
  nextTick(() => {
    userSelecting = false
  })
}

// 回显
watch(
  [() => props.modelValue, options],
  ([modelValue, options]) => {
    if (userSelecting) return

    if (!options?.length) return

    if (modelValue !== undefined) {
      const { valueKey } = props
      currentIndex.value = options.findIndex((option) => o(option).get(valueKey) === modelValue)

      selected.value = options[currentIndex.value]
    } else {
      currentIndex.value = -1
      selected.value = undefined
    }
  },
  { immediate: true }
)

const baseVirtualEnabled = computed(() => options.value.length > 80)
const virtualEnabled = computed(() => baseVirtualEnabled.value && !props.grid)

const { virtualizer, items } = useVirtualizer({
  count: computed(() => options.value.length),
  scrollEl: () => scrollRef.value?.containerRef ?? null,
  contentEl: () => (virtualEnabled.value ? (scrollRef.value?.contentRef ?? null) : null),
  gap: 4,
  estimateSize: () => 40
})

const virtualOptions = computed(() => {
  const _options = options.value
  const { labelKey, valueKey } = props
  return items.value.map((item) => {
    const option = _options[item.index]!
    return {
      option,
      index: item.index,
      label: o(option).get(labelKey),
      val: o(option).get(valueKey),
      key: item.index,
      offset: item.start
    }
  })
})

const measureElement: (index: number, el: Element | null) => void = (index, el) =>
  virtualizer.measureElement(index, el)

function scrollTo(index: number): void {
  virtualizer.scrollToIndex(index, { align: 'center' })
}

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
const handleSelect = (option: Record<string, any>, index: number) => {
  lock()
  selected.value = option

  emit('update:modelValue', option?.[props.valueKey])
  label.value = option?.[props.labelKey]
  emit('change', option)
  if (option.__isTemp) {
    temOptionsToCreatedOptions()
  }
  currentIndex.value = index
  dropdownRef.value?.close()

  unlock()
}

/** 清除选项 */
const handleClear = () => {
  lock()
  selected.value = undefined
  clearCreatedOptions()
  emit('update:modelValue', undefined)
  emit('change', undefined)
  unlock()
}

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
