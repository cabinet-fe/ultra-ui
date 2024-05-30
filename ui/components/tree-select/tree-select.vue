<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, bem.is('disabled', disabled)]"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    ref="dropdownRef"
  >
    <template #trigger>
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :model-value="label"
        @clear="handleClear"
        native-readonly
      >
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
      <u-scroll tag="div" ref="scrollRef" :class="cls.e('content-tree')">
        <u-tree
          v-bind="treeProps"
          v-model:selected="model"
          @update:selected="handleSelect"
          ref="treeRef"
          selectable
        ></u-tree>
      </u-scroll>
    </template>
  </u-dropdown>

  <span v-else>{{ label }}</span>
</template>

<script lang="ts" setup>
import type {
  TreeSelectProps,
  TreeSelectEmits
} from '@ui/types/components/tree-select'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { bem } from '@ui/utils'
import { UDropdown } from '../dropdown'
import { UTree, type TreeExposed } from '../tree'
import { UScroll, type ScrollExposed } from '../scroll'
import { UInput } from '../input'
import { UIcon } from '../icon'
import { ArrowDown, Search } from 'icon-ultra'
import { computed, nextTick, shallowRef, watch } from 'vue'
import { Tree, omit } from 'cat-kit/fe'
defineOptions({
  name: 'TreeSelect'
})

const cls = bem('tree-select')

const props = withDefaults(defineProps<TreeSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  expandAll: true,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  filterable: false
})

const treeProps = computed(() => {
  return omit(props, [
    'tips',
    'field',
    'placeholder',
    'disabled',
    'label',
    'readonly'
  ])
})

const emit = defineEmits<TreeSelectEmits>()

/**过滤 */
const qs = shallowRef('')
watch(qs, qs => {
  treeRef.value?.filter(qs)
})

const model = defineModel<string | number>()

const label = shallowRef<string>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const treeRef = shallowRef<TreeExposed<Record<string, any>>>()

const dropdownRef = shallowRef<InstanceType<typeof UDropdown>>()

const scrollRef = shallowRef<ScrollExposed>()

/**清空 */
const handleClear = () => {
  model.value = undefined
  emit('clear')
}

let changedByEvent = false
watch(
  [() => props.data, model],
  ([data, model]) => {
    if (changedByEvent) return
    if (!data?.length || model === undefined) {
      label.value = undefined
      return
    }

    let founded = false
    data.some(item => {
      Tree.dft(item, v => {
        if (v[props.valueKey] === model) {
          label.value = v[props.labelKey]
          founded = true
          return false
        }
      })

      return founded
    })
  },
  {
    immediate: true
  }
)

const handleSelect = (
  selected?: string | number,
  selectedData?: Record<string, any>
) => {
  changedByEvent = true
  nextTick(() => {
    changedByEvent = false
  })

  label.value = selectedData?.[props.labelKey]
  emit('change', selected, selectedData)
  dropdownRef.value?.close()
}

watch(scrollRef, scroll => {
  if (scroll && model.value !== undefined) {
    const treeNode = scroll.contentRef?.querySelector('.is-selected')

    treeNode?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }
})
</script>
