<template>
  <u-dropdown
    v-if="!readonly"
    v-bind="$attrs"
    trigger="click"
    ref="dropdownRef"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('focus', dropdownVisible)]"
    :content-class="[cls.e('panel'), cls.em('panel', size), contentClass]"
    :content-style="contentStyle"
    :min-width="minWidth"
    :width="width"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    :disabled="disabled"
    @update:visible="handleDropdownVisible"
  >
    <!-- 触发 -->
    <template #trigger>
      <span :class="cls.e('placeholder')" v-if="!filterable && !model?.length">
        {{ placeholder }}
      </span>

      <div v-if="model?.length || filterable" :class="cls.e('tags')">
        <u-tag
          v-for="option of tags"
          :key="option[valueKey]"
          :closable="!disabled"
          size="small"
          @close="handleClose(option)"
        >
          {{ option[labelKey] }}
        </u-tag>
        <u-tag v-if="restTag" size="small"> {{ restTag }}+ </u-tag>

        <!-- 内嵌查询输入框：承载过滤与回车创建 -->
        <input
          v-if="filterable"
          ref="inputRef"
          :class="cls.e('input')"
          v-model="queryString"
          :placeholder="model?.length ? '' : placeholder"
          :disabled="disabled"
          @click.stop="handleInputClick"
          @focus="handleInputFocus"
          @keydown.enter.prevent="handleCreateByEnter"
        />
      </div>

      <transition name="zoom-in" mode="out-in">
        <u-icon
          v-if="clearable && model?.length && hovered && !disabled"
          :class="cls.e('clear')"
          @click.stop="handleClear"
        >
          <Close />
        </u-icon>

        <u-icon :class="cls.e('arrow')" v-else><ArrowDown /></u-icon>
      </transition>
    </template>

    <!-- 下拉内容 -->
    <template #content>
      <!-- 多选栏 -->
      <div :class="cls.e('content-header')">
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
          :disabled="max !== undefined"
        >
          全选
        </u-checkbox>

        <span> 已选 {{ model?.length }}/{{ max ?? options?.length ?? 0 }} </span>
      </div>

      <!-- 多选列表 -->
      <!--
        虚拟化启用时内容容器 height 由 useVirtualizer 命令式写入；
        模板不再绑定 totalSize，避免尺寸变化引起重渲染。
      -->
      <u-scroll
        tag="ul"
        :class="[cls.e('options')]"
        ref="scrollRef"
        v-if="options.length"
        :content-class="[cls.e('options-wrap'), bem.is('virtual', virtualEnabled)]"
      >
        <template v-if="virtualEnabled">
          <u-multi-select-option
            v-for="{ option, index, key, label, offset } of virtualOptions"
            :option="option"
            :disabled="isDisabled(option)"
            :key="key"
            :style="{ transform: `translateY(${offset}px)` }"
            @check="handleCheck(option, $event)"
            :checked="checkedSet.has(option)"
            :index="index"
            :measure-element="measureElement"
          >
            <slot v-bind="{ option, index }">
              {{ label }}
            </slot>
          </u-multi-select-option>
        </template>

        <template v-else>
          <u-multi-select-option
            v-for="(option, index) of options"
            :option="option"
            :disabled="isDisabled(option)"
            :key="chainObj(option).get(valueKey)"
            @check="handleCheck(option, $event)"
            :checked="checkedSet.has(option)"
          >
            <slot v-bind="{ option, index }">
              {{ chainObj(option).get(labelKey) }}
            </slot>
          </u-multi-select-option>
        </template>
      </u-scroll>

      <div v-else :class="cls.e('empty')">
        <UEmpty />
      </div>
    </template>
  </u-dropdown>

  <div v-else-if="model?.length" :class="[cls.m(size), cls.e('readonly-tags')]">
    <div :class="cls.e('tags')">
      <u-tag v-for="option of tags" :key="option[valueKey]" size="small">
        {{ option[labelKey] }}
      </u-tag>
    </div>
  </div>

  <template v-else>
    {{ FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { o as chainObj } from '@cat-kit/core'
import { useFormFallbackProps, useVirtualizer } from '@veltra/compositions'
import { ArrowDown, Close } from '@veltra/icons/normal'
import { bem, fieldKey, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import {
  computed,
  nextTick,
  shallowRef,
  shallowReactive,
  watch,
  provide,
  useTemplateRef
} from 'vue'

import type {
  MultiSelectEmits,
  MultiSelectProps,
  ScrollExposed,
  DropdownExposed
} from '../../types'
import { UCheckbox } from '../checkbox'
import { UDropdown } from '../dropdown'
import { UEmpty } from '../empty'
import { UIcon } from '../icon'
import { UScroll } from '../scroll'
import { useOptions } from '../select/use-options'
import { UTag } from '../tag'
import { MultiSelectDIKey } from './di'
import UMultiSelectOption from './multi-select-option.vue'

defineOptions({ name: 'UMultiSelect', inheritAttrs: false })

const props = withDefaults(defineProps<MultiSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  clearable: true,
  visibilityLimit: 3,
  disabled: undefined,
  readonly: undefined,
  minWidth: '220px'
})

const emit = defineEmits<MultiSelectEmits>()

const cls = bem('multi-select')

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const scrollRef = shallowRef<ScrollExposed>()

const hovered = shallowRef(false)

const { options: rawOptions, queryString, allOptions: rawAllOptions } = useOptions({ props })

const createdOptions = shallowRef<Record<string, any>[]>([])

const options = computed(() => {
  const base = rawOptions.value
  if (!props.creatable || !createdOptions.value.length) return base

  const createdValues = new Set(createdOptions.value.map((o) => chainObj(o).get(valueKey.value)))
  const deduped = base.filter(
    (o) => !(o.__isTemp && createdValues.has(chainObj(o).get(valueKey.value)))
  )
  const dedupedValues = new Set(deduped.map((o) => chainObj(o).get(valueKey.value)))
  const toAdd = createdOptions.value.filter(
    (o) => !dedupedValues.has(chainObj(o).get(valueKey.value))
  )
  return [...toAdd, ...deduped]
})

const allOptions = computed(() => {
  if (!props.creatable || !createdOptions.value.length) return rawAllOptions.value
  return [...createdOptions.value, ...rawAllOptions.value]
})

const virtualEnabled = computed(() => options.value.length > 80)

const { virtualizer, items } = useVirtualizer({
  estimateSize: () => 40,
  count: computed(() => options.value.length),
  scrollEl: () => scrollRef.value?.containerRef ?? null,
  contentEl: () => (virtualEnabled.value ? (scrollRef.value?.contentRef ?? null) : null)
})

const virtualOptions = computed(() => {
  const _options = options.value
  return items.value.map((v) => {
    const option = _options[v.index]!
    const val = chainObj(option).get(valueKey.value)
    return {
      option,
      index: v.index,
      val,
      key: v.index,
      offset: v.start,
      label: chainObj(option).get(labelKey.value)
    }
  })
})

const measureElement: (index: number, el: Element | null) => void = (index, el) =>
  virtualizer.measureElement(index, el)

const filterable = computed(() => {
  return props.filterable || props.creatable || typeof props.options === 'function'
})

const model = defineModel<Array<string | number>>()

const checkedSet = shallowReactive<Set<Record<string, any>>>(new Set())
const allChecked = computed(() => {
  return checkedSet.size === options.value.length
})
const indeterminate = computed(() => {
  return checkedSet.size > 0 && !allChecked.value
})

const optionsMap = computed(() => {
  return new Map<string | number, Record<string, any>>(
    allOptions.value.map((option) => [option[valueKey.value], option])
  )
})

const dropdownRef = shallowRef<DropdownExposed>()

let internalChange = false

watch(
  [model, optionsMap],
  ([model, optionsMap]) => {
    if (internalChange) {
      internalChange = false
      return
    }
    checkedSet.clear()
    if (optionsMap.size && model?.length) {
      model.forEach((v) => {
        const option = optionsMap.get(v)
        option && checkedSet.add(option)
      })
    }
  },
  { immediate: true }
)

const emitChange = () => {
  emit('change', Array.from(checkedSet))
}

const tags = computed(() => {
  let tags: Record<string, any>[] = []
  let { visibilityLimit } = props
  if (visibilityLimit < 0) {
    visibilityLimit = 0
  }

  // 禁用时，显示全部
  if (disabled.value || readonly.value) {
    visibilityLimit = model.value?.length ?? 0
  }

  model.value?.slice(0, visibilityLimit).forEach((k) => {
    const option = optionsMap.value.get(k)
    option && tags.push(option)
  })

  return tags
})

const restTag = computed(() => {
  return (model.value?.length ?? 0) - tags.value.length
})

const dropdownVisible = shallowRef(false)

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

const handleDropdownVisible = (visible: boolean) => {
  dropdownVisible.value = visible
  if (!visible) {
    queryString.value = ''
  }
}

/**
 * 拦截输入区域的点击（@click.stop）：阻止 dropdown 的 trigger 开合切换，
 * 保持面板展开以不中断输入。
 */
const handleInputClick = () => {
  if (!dropdownVisible.value) dropdownRef.value?.open()
}

const handleInputFocus = () => {
  if (!dropdownVisible.value) dropdownRef.value?.open()
}

/** 勾选后把焦点还给输入框，便于连续输入过滤 */
const refocusInput = () => {
  if (!filterable.value) return
  nextTick(() => inputRef.value?.focus())
}

const handleCheck = (option: Record<string, any>, checked: boolean) => {
  if (checked) {
    if (option.__isTemp && props.creatable) {
      const created: Record<string, any> = {
        [labelKey.value]: chainObj(option).get(labelKey.value),
        [valueKey.value]: chainObj(option).get(valueKey.value)
      }
      createdOptions.value = [...createdOptions.value, created]
      checkedSet.add(created)
      internalChange = true
      model.value = [...(model.value ?? []), chainObj(created).get(valueKey.value)!]
      queryString.value = ''
    } else if (!checkedSet.has(option)) {
      checkedSet.add(option)
      internalChange = true
      model.value = [...(model.value ?? []), chainObj(option).get(valueKey.value)!]
    }
  } else {
    checkedSet.delete(option)
    const val = chainObj(option).get(valueKey.value)
    internalChange = true
    model.value = (model.value ?? []).filter((v) => v !== val)
    removeCreatedOption(option)
  }

  emitChange()
  dropdownRef.value?.updateDropdown()
  refocusInput()
}

/** 全选 */
const handleCheckAll = (checked: boolean) => {
  if (checked) {
    options.value.forEach((option) => {
      if (!option.__isTemp) checkedSet.add(option)
    })
    internalChange = true
    model.value = Array.from(checkedSet).map((o) => chainObj(o).get(valueKey.value)!)
  } else {
    checkedSet.clear()
    internalChange = true
    model.value = []
    if (props.creatable) {
      createdOptions.value = []
    }
  }

  emitChange()
  dropdownRef.value?.updateDropdown()
}

/** 清除选项 */
const handleClear = () => {
  checkedSet.clear()
  internalChange = true
  model.value = []
  if (props.creatable) {
    createdOptions.value = []
  }
  emit('change', [])
}

const handleClose = (option: Record<string, any>) => {
  checkedSet.delete(option)
  const val = chainObj(option).get(valueKey.value)
  internalChange = true
  model.value = (model.value ?? []).filter((v) => v !== val)
  removeCreatedOption(option)
  emitChange()
}

const removeCreatedOption = (option: Record<string, any>) => {
  if (!props.creatable || !createdOptions.value.length) return
  const val = chainObj(option).get(valueKey.value)
  createdOptions.value = createdOptions.value.filter((o) => chainObj(o).get(valueKey.value) !== val)
}

const handleCreateByEnter = () => {
  if (!props.creatable) return
  const qs = queryString.value?.trim()
  if (!qs) return

  const existingCreated = createdOptions.value.find((o) => chainObj(o).get(valueKey.value) === qs)
  if (existingCreated) {
    if (!checkedSet.has(existingCreated)) {
      checkedSet.add(existingCreated)
      internalChange = true
      model.value = [...(model.value ?? []), chainObj(existingCreated).get(valueKey.value)!]
    }
    queryString.value = ''
    emitChange()
    dropdownRef.value?.updateDropdown()
    return
  }

  const exactMatch = rawOptions.value.find(
    (o) => !o.__isTemp && chainObj(o).get(labelKey.value) === qs
  )
  if (exactMatch) {
    if (!checkedSet.has(exactMatch)) {
      checkedSet.add(exactMatch)
      internalChange = true
      model.value = [...(model.value ?? []), chainObj(exactMatch).get(valueKey.value)!]
    }
    queryString.value = ''
    emitChange()
    dropdownRef.value?.updateDropdown()
    return
  }

  const created: Record<string, any> = { [labelKey.value]: qs, [valueKey.value]: qs }
  createdOptions.value = [...createdOptions.value, created]
  checkedSet.add(created)
  internalChange = true
  model.value = [...(model.value ?? []), qs]
  queryString.value = ''
  emitChange()
  dropdownRef.value?.updateDropdown()
}

const isDisabled = (option: Record<string, any>) => {
  const { max } = props
  return max !== undefined && checkedSet.size >= max && !checkedSet.has(option)
}

const optionClass = cls.e('option')
const rippleClass = cls.e('ripple')
const checkboxClass = cls.e('checkbox')

provide(MultiSelectDIKey, { optionClass, rippleClass, checkboxClass })
</script>
