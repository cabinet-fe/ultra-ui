<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled)]"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    ref="dropdownRef"
    :min-width="minWidth"
  >
    <template #trigger>
      <!-- 默认展示 -->
      <span :class="cls.e('placeholder')" v-show="!tags.length">
        {{ placeholder }}
      </span>
      <!-- 选择的数据项 -->
      <div v-if="tags.length" :class="cls.e('tags')">
        <u-tag
          v-for="(tag, index) in visibleTags"
          :key="tag[valueKey]"
          :closable="!disabled"
          @close="handleRemove(index)"
        >
          {{ tag[labelKey] }}
        </u-tag>
        <u-tag v-if="hiddenCount > 0">+{{ hiddenCount }}</u-tag>
      </div>
      <!-- 清空 icon -->
      <transition name="zoom-in">
        <u-icon
          v-if="clearable && model?.length && hovered && !disabled"
          :class="cls.e('clear')"
          @click.stop="handleClear"
        >
          <Close />
        </u-icon>
      </transition>
      <!-- 下拉 icon -->
      <u-icon :class="cls.e(`arrow`)" v-if="!readonly">
        <ArrowDown />
      </u-icon>
    </template>
    <template #content>
      <!-- 全选 -->
      <div :class="[cls.e('content-header'), cls.m(size)]">
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
        >
          全选
        </u-checkbox>
      </div>
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
          v-model:checked="model"
          @update:checked="handleCheck"
          ref="treeRef"
          checkable
          :data="data"
        ></u-tree>
      </u-scroll>
    </template>
  </u-dropdown>

  <div v-else-if="model.length" :class="[cls.m(size), cls.e('readonly-tags')]">
    <div :class="cls.e('tags')">
      <u-tag v-for="option of tags" :key="option[valueKey]">
        {{ option[labelKey] }}
      </u-tag>
    </div>
  </div>

  <span v-else>{{ FORM_EMPTY_CONTENT }}</span>
</template>

<script lang="ts" setup>
import type {
  MultiTreeSelectProps,
  MultiTreeSelectEmits
} from '@ui/types/components/multi-tree-select'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { bem } from '@ui/utils'
import { UDropdown } from '../dropdown'
import { UTree, type TreeExposed } from '../tree'
import { UScroll, type ScrollExposed } from '../scroll'
import { UTag } from '../tag'
import { UIcon } from '../icon'
import { UInput } from '../input'
import { ArrowDown, Close, Search } from 'icon-ultra'
import { computed, nextTick, shallowReactive, shallowRef, watch } from 'vue'
import { UCheckbox } from '../checkbox'
import { omit, Tree } from 'cat-kit/fe'
import { FORM_EMPTY_CONTENT } from '@ui/shared'

defineOptions({
  name: 'MultiTreeSelect'
})

const cls = bem('multi-tree-select')

const props = withDefaults(defineProps<MultiTreeSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  expandAll: true,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  filterable: false,
  visibilityLimit: 3,
  minWidth: '280px'
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

const emit = defineEmits<MultiTreeSelectEmits>()

/**过滤 */
const qs = shallowRef('')
watch(qs, qs => {
  treeRef.value?.filter(qs)
})

const model = defineModel<(string | number)[]>({
  default: () => []
})

const hovered = shallowRef(false)

const tags = shallowRef<Record<string, any>[]>([])

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const treeRef = shallowRef<TreeExposed<Record<string, any>>>()

const dropdownRef = shallowRef<InstanceType<typeof UDropdown>>()

const scrollRef = shallowRef<ScrollExposed>()

let changedByEvent = false

function markEvent() {
  changedByEvent = true
  nextTick(() => {
    changedByEvent = false
  })
}

/**是否全选 */
const allChecked = computed(() => {
  return model.value?.length === treeRef.value?.forest.size
})

/**部分 */
const indeterminate = computed(() => {
  return model.value.length! > 0 && !allChecked.value
})

/** 全选*/
const handleCheckAll = (checked: boolean) => {
  treeRef.value?.checkAll(checked)
}

/**选中 */
const handleCheck = (
  checked: (string | number)[],
  checkedData: Record<string, any>[]
) => {
  markEvent()
  tags.value = checkedData
  emit('change', checkedData!)
}

/**删除 */
const handleRemove = (index: number) => {
  markEvent()
  tags.value = tags.value.filter((_, i) => i !== index)
  model.value = model.value.filter((_, i) => i !== index)
  emit('change', tags.value)
}

/**清空 */
const handleClear = () => {
  markEvent()
  tags.value = []
  model.value = []
  emit('clear')
}

const keyDicts = shallowReactive(
  new Map<string | number, Record<string, any>>()
)

watch(
  () => props.data,
  data => {
    if (!data?.length) {
      keyDicts.clear()
    } else {
      data.forEach(item => {
        Tree.dft(
          item,
          v => {
            keyDicts.set(v[props.valueKey], v)
          },
          props.childrenKey
        )
      })
    }
  },
  { immediate: true }
)

watch(
  [keyDicts, model],
  ([keyDicts, model]) => {
    if (changedByEvent) return

    if (!keyDicts.size || !model.length) {
      tags.value = []
      return
    }

    tags.value = model.filter(v => keyDicts.has(v)).map(v => keyDicts.get(v)!)
  },
  { immediate: true }
)

watch(scrollRef, scroll => {
  if (scroll && model.value !== undefined) {
    const treeNode =
      scroll.contentRef!.getElementsByClassName('is-checked')[
        model.value.length - 1
      ]!
    treeNode?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }
})

const limit = () => {
  let { visibilityLimit } = props

  if (visibilityLimit < 0) {
    visibilityLimit = 0
  }
  if (disabled.value || readonly.value) {
    visibilityLimit = model.value?.length ?? 0
  }
  return visibilityLimit
}

const visibleTags = computed(() => {
  if (tags.value.length > limit()) {
    return tags.value.slice(0, limit())
  }
  return tags.value
})

const hiddenCount = computed(() => {
  if (tags.value.length > limit()) {
    return tags.value.length - limit()
  }
  return 0
})
</script>
