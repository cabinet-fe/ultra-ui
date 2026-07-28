<template>
  <u-dropdown
    v-if="!readonly"
    v-bind="$attrs"
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
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- 触发 -->
    <template #trigger>
      <u-input
        ref="inputRef"
        :size="size"
        :disabled="disabled"
        :placeholder="inputPlaceholder"
        :clearable="false"
        :model-value="inputValue"
        @update:model-value="handleQueryInput"
        @keydown="handleKeydown"
        :native-readonly="!filterable || !querying"
        @click.capture="handleTriggerClickCapture"
      >
        <template #prefix v-if="$slots.prefix">
          <slot name="prefix" />
        </template>

        <template #suffix>
          <transition name="zoom-in" mode="out-in">
            <u-icon
              v-if="showClear"
              :class="cls.e('clear')"
              title="清除"
              key="clear"
              @click.stop="handleClear"
            >
              <Close />
            </u-icon>
            <u-icon v-else :class="cls.e('arrow')" key="arrow">
              <ArrowDown />
            </u-icon>
          </transition>
        </template>
      </u-input>
    </template>

    <!-- 下拉内容 -->
    <template #content>
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
import { useFormFallbackProps, useUserAction, useVirtualizer } from '@veltra/compositions'
import { ArrowDown, Close } from '@veltra/icons/normal'
import { bem, fieldKey, FORM_EMPTY_CONTENT, scrollIntoContainerView, withUnit } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import type {
  SelectEmits,
  SelectProps,
  _SelectExposed,
  DropdownExposed,
  InputExposed,
  ScrollExposed
} from '../../types'
import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { UIcon } from '../icon'
import { UInput } from '../input'
import { UScroll } from '../scroll'
import { useKeyboard } from './use-keyboard'
import { useOptions } from './use-options'

defineOptions({ name: 'USelect', inheritAttrs: false })

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

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

const optionClass = cls.e('option')

const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const currentIndex = shallowRef(-1)
/** 内部展示文案，仅由选项推导；通过 update:text 单向通知父级 */
const label = shallowRef<string>()
const selected = shallowRef<Record<string, any>>()

const displayedValue = computed(() => {
  if (label.value) return label.value

  return selected.value ? o(selected.value).get(labelKey.value) : String(props.modelValue ?? '')
})

const dropdownRef = shallowRef<DropdownExposed>()
const scrollRef = shallowRef<ScrollExposed>()
const inputRef = useTemplateRef<InputExposed>('inputRef')

const filterable = computed(() => {
  return props.filterable || typeof props.options === 'function'
})

const { queryString, options, allOptions, temOptionsToCreatedOptions, clearCreatedOptions } =
  useOptions({ props })

const dropdownVisible = shallowRef(false)

/**
 * 是否处于查询态：决定触发输入框显示查询串还是选中标签。
 * 与面板可见状态解耦 —— 选择后立即退出查询态，
 * 不等面板关闭动画结束（否则显示值会延迟一个动画时长才恢复）。
 */
const querying = shallowRef(false)

/** 触发输入框的值：查询态下承载查询串，否则展示选中标签 */
const inputValue = computed(() => {
  if (filterable.value && querying.value) return queryString.value
  return displayedValue.value
})

/** 查询态下已选标签降级为占位提示 */
const inputPlaceholder = computed(() => {
  if (filterable.value && querying.value && displayedValue.value) {
    return displayedValue.value
  }
  return props.placeholder
})

function handleQueryInput(value: string) {
  if (!filterable.value) return
  queryString.value = value
}

const hovered = shallowRef(false)

/** 悬停且存在选中值时展示清除按钮（替代下拉箭头） */
const showClear = computed(() => {
  return props.clearable && !disabled.value && hovered.value && !!displayedValue.value
})

/**
 * 过滤模式下拦截输入区域的点击：
 * 阻止 dropdown 的 trigger 开合切换，保持面板展开以不中断输入。
 * 非输入区域（箭头、留白）放行，维持原开合行为。
 */
function handleTriggerClickCapture(e: MouseEvent) {
  if (!filterable.value || disabled.value) return
  if (!(e.target instanceof HTMLInputElement)) return

  e.stopPropagation()
  if (!dropdownVisible.value) dropdownRef.value?.open()
}

const { userAction, isUserActive } = useUserAction()

/** 更新内部文案；值变化时单向 emit update:text */
function setLabel(next?: string) {
  if (label.value === next) return
  label.value = next
  emit('update:text', next)
}

/** 按 modelValue 与完整选项列表同步高亮索引、选中项与显示标签（外部回显用，O(n)） */
function syncSelected(modelValue: any, sourceOptions: Record<string, any>[] | undefined) {
  // 查询输入期间高亮第一项（创建模式下通常是临时项，便于回车创建）
  if (queryString.value) {
    currentIndex.value = options.value.length ? 0 : -1
    return
  }

  if (!sourceOptions?.length) return

  if (modelValue !== undefined && modelValue !== null && modelValue !== '') {
    currentIndex.value = sourceOptions.findIndex(
      (option) => o(option).get(valueKey.value) === modelValue
    )
    selected.value = currentIndex.value >= 0 ? sourceOptions[currentIndex.value] : undefined
    setLabel(selected.value ? o(selected.value).get(labelKey.value) : undefined)
  } else {
    currentIndex.value = -1
    selected.value = undefined
    setLabel(undefined)
  }
}

// 回显：以 allOptions 匹配，避免过滤列表缺项时清掉已选文案；用户动作期内跳过
watch(
  [() => props.modelValue, allOptions],
  ([modelValue]) => {
    if (isUserActive()) return
    syncSelected(modelValue, allOptions.value)
  },
  { immediate: true }
)

// 过滤时单独同步高亮（allOptions 不变，不会触发上方回显 watch）
watch([queryString, options], () => {
  if (!queryString.value) return
  currentIndex.value = options.value.length ? 0 : -1
})

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
  return items.value.map((item) => {
    const option = _options[item.index]!
    return {
      option,
      index: item.index,
      label: o(option).get(labelKey.value),
      val: o(option).get(valueKey.value),
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

watch(dropdownVisible, (visible) => {
  if (visible) {
    // 面板展开后进入查询态并聚焦输入框，可以立即输入查询
    if (filterable.value) {
      queryString.value = ''
      querying.value = true
      nextTick(() => inputRef.value?.el?.focus())
    }
  } else {
    querying.value = false
    queryString.value = ''
  }
})

const handleDropdownVisible = (visible: boolean) => {
  if (!visible) {
    queryString.value = ''
  }
}

/** 单选：用户动作内 O(1) 写入值与文案，跳过 modelValue 回显的 O(n) 查找 */
const handleSelect = userAction((option: Record<string, any>, _index: number) => {
  const value = option?.[valueKey.value]
  selected.value = option

  emit('update:modelValue', value)
  setLabel(option?.[labelKey.value])
  emit('change', option)
  if (option.__isTemp) {
    // 转正后列表同步重建为完整源（临时项置顶索引失效），必须按 value 重定位
    temOptionsToCreatedOptions()
  }
  // 立即退出查询态，输入框同步恢复显示选中标签
  querying.value = false
  queryString.value = ''
  // 按当前列表定位高亮，避免创建项转正后仍停留在点击时的临时索引（通常为 0）
  currentIndex.value = options.value.findIndex((item) => o(item).get(valueKey.value) === value)
  if (currentIndex.value >= 0) {
    selected.value = options.value[currentIndex.value]
  }
  dropdownRef.value?.close()
})

/** 清除选项 */
const handleClear = userAction(() => {
  selected.value = undefined
  currentIndex.value = -1
  setLabel(undefined)
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
