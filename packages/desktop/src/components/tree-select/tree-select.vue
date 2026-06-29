<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, bem.is('disabled', disabled)]"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size), contentClass]"
    :content-style="contentStyle"
    ref="dropdownRef"
    :min-width="minWidth"
    :width="width"
    :disabled="disabled"
    @update:visible="handleDropdownVisible"
  >
    <template #trigger>
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :model-value="text ?? (model ? label : undefined)"
        @clear="handleClear"
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
    <template #content>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="[cls.e('content-filter'), cls.m(size)]">
        <u-input placeholder="输入关键字进行过滤" v-model="qs">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>
      <!-- 菜单列表 -->

      <u-tree
        v-bind="treeProps"
        :selected="model"
        @update:selected="handleSelect"
        ref="treeRef"
        selectable
        :class="cls.e('content-tree')"
        :slots="slots"
        scroll-to-view
      />
    </template>
  </u-dropdown>

  <template v-else>
    {{ text || label || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { dfs, o } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
import { ArrowDown, Search } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, watch } from 'vue'

import type { TreeSelectProps, TreeSelectEmits, TreeExposed } from '../../types'
import { UDropdown } from '../dropdown'
import { UIcon } from '../icon'
import { UInput } from '../input'
import { UTree } from '../tree'
import type { TreeSlotsScope } from '../tree/di'

defineOptions({ name: 'UTreeSelect' })

const props = withDefaults(defineProps<TreeSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  expandAll: false,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  filterable: false,
  minWidth: '280px'
})

const emit = defineEmits<TreeSelectEmits>()

const slots = defineSlots<{
  /** 默认插槽 */
  default?: (props: TreeSlotsScope) => any
  /** 前缀插槽 */
  prefix?: () => any
}>()

const treeProps = computed(() => {
  return o(props as Record<string, any>).omit([
    'tips',
    'field',
    'placeholder',
    'disabled',
    'label',
    'readonly',
    'contentClass',
    'contentStyle',
    'minWidth',
    'width'
  ])
})

const cls = bem('tree-select')

/**过滤 */
const qs = shallowRef('')
watch(qs, (qs) => {
  treeRef.value?.filter(qs)
})

const model = defineModel<string | number>()

const label = shallowRef<string>()

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const treeRef = shallowRef<TreeExposed>()

const dropdownRef = shallowRef<InstanceType<typeof UDropdown>>()

/**清空 */
const handleClear = () => {
  model.value = ''
  label.value = undefined
  emit('clear')
  emit('change', '', undefined)
  emit('update:text', '')
}

let changedByEvent = false
watch(
  [() => props.data, model],
  ([data, model]) => {
    if (changedByEvent) return
    if (!data?.length || model === undefined) {
      label.value = undefined
      model = undefined
      return
    }

    let founded = false
    const childrenKey = props.childrenKey ?? 'children'
    data.some((item) => {
      dfs(
        item,
        (v) => {
          if (v[props.valueKey] === model) {
            label.value = v[props.labelKey]
            founded = true
            return true
          }
        },
        childrenKey
      )

      return founded
    })
  },
  { immediate: true }
)

const handleSelect = (selected?: string | number, selectedData?: Record<string, any>) => {
  changedByEvent = true
  nextTick(() => {
    changedByEvent = false
  })

  model.value = selected ?? ''

  if (selectedData) {
    label.value = o(selectedData).get(props.labelKey)
  } else {
    label.value = ''
  }

  emit('change', selected, selectedData)
  emit('update:text', label.value)
  dropdownRef.value?.close()
}

const handleDropdownVisible = (visible: boolean) => {
  if (!visible) {
    qs.value = ''
  }
}
</script>
