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
  >
    <!-- 触发 -->
    <template #trigger>
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :model-value="
          selected ? (getChainValue(selected, labelKey) ?? label) : modelValue
        "
        @clear="handleClear"
        @keydown="handleKeydown"
        native-readonly
      >
        <template #prefix v-if="$slots.prefix">
          <slot name="prefix" />
        </template>

        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="cls.e('content-filter')">
        <u-input
          placeholder="输入关键字进行搜索"
          tabindex="0"
          v-focus
          v-model="queryString"
        >
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
            :class="[optionClass, bem.is('selected', index === currentIndex)]"
            @click="handleSelect(option, index)"
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
            :class="[optionClass, bem.is('selected', index === currentIndex)]"
            @click="handleSelect(option, index)"
            :data-index="index"
            :title="getChainValue(option, labelKey)"
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

  <template v-else>
    {{ label || selected?.[labelKey] || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { computed, nextTick, shallowRef, watch } from 'vue'
import type {
  SelectEmits,
  SelectProps,
  _SelectExposed,
  DropdownExposed,
  ScrollExposed
} from '@ui/types'
import { bem, withUnit, scrollIntoContainerView } from '@ui/utils'
import {
  useFormComponent,
  useFormFallbackProps,
  useUpdateLock,
  useVirtual
} from '@ui/compositions'
import { UDropdown } from '../dropdown'
import { UScroll } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { ArrowDown, Search } from '@ultra/icon'
import { useOptions } from './use-options'
import { useKeyboard } from './use-keyboard'
import { UEmpty } from '../empty'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import { getChainValue } from 'cat-kit/fe'
import { vFocus } from '@ui/directives'

defineOptions({
  name: 'Select'
})

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
}>()

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
const currentIndex = shallowRef(-1)
const label = defineModel('text')
const selected = shallowRef<Record<string, any>>()

const dropdownRef = shallowRef<DropdownExposed>()
const scrollRef = shallowRef<ScrollExposed>()

const filterable = computed(() => {
  return props.filterable || typeof props.options === 'function'
})

const { queryString, options, temOptionsToCreatedOptions } = useOptions({
  props
})

const { update, updateAndLock } = useUpdateLock()

watch(
  [model, options],
  ([modelValue, options]) => {
    update(() => {
      if (!options?.length) return

      if (modelValue !== undefined) {
        const { valueKey } = props
        currentIndex.value = options.findIndex(
          option => getChainValue(option, valueKey) === modelValue
        )
        selected.value = options[currentIndex.value]
      } else {
        currentIndex.value = -1
        selected.value = undefined
      }
    })
  },
  { immediate: true }
)

watch(selected, selected => {
  updateAndLock(() => {
    model.value = selected?.[props.valueKey]
    label.value = selected?.[props.labelKey]
  })
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

watch([scrollRef, virtualEnabled], ([scroll, virtualEnabled]) => {
  if (!scroll || !model.value) return

  if (virtualEnabled) {
    const index = options.value.findIndex(option => option === selected.value)
    index !== -1 && dropdownVisible.value && nextTick(() => scrollTo(index))
  } else {
    const selectedEl =
      scroll?.contentRef?.getElementsByClassName('is-selected')[0]
    if (selectedEl) {
      scrollIntoContainerView(
        selectedEl as HTMLElement,
        scroll.containerRef ?? null
      )
    }
  }
})

const dropdownVisible = shallowRef(false)

watch(dropdownVisible, v => {
  if (!v) {
    queryString.value = ''
  }
})

/** 单选 */
const handleSelect = (option: Record<string, any>, index: number) => {
  selected.value = option
  emit('change', option)
  if (option.__isTemp) {
    temOptionsToCreatedOptions()
  }
  currentIndex.value = index
  dropdownRef.value?.close()
}

/** 清除选项 */
const handleClear = () => {
  selected.value = undefined
  emit('change', undefined)
}

function getCurrentEl() {
  return scrollRef.value?.contentRef?.querySelector('li.is-selected') as
    | HTMLElement
    | undefined
}

const { handleKeydown } = useKeyboard({
  options,
  currentIndex,
  selectOption: handleSelect,
  getCurrentEl
})
</script>
