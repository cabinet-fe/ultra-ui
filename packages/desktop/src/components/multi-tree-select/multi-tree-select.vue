<template>
  <u-dropdown
    v-if="!readonly"
    v-bind="$attrs"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('focus', dropdownVisible)]"
    trigger="click"
    :content-class="[cls.e('panel'), cls.em('panel', size), contentClass]"
    :content-style="contentStyle"
    :disabled="disabled"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    ref="dropdownRef"
    :min-width="minWidth"
    :width="width"
    @update:visible="handleDropdownVisible"
  >
    <template #trigger>
      <!-- 默认展示 -->
      <span :class="cls.e('placeholder')" v-if="!filterable && !tags.length">
        {{ placeholder }}
      </span>

      <!-- 选择的数据项 -->
      <div v-if="tags.length || filterable" :class="cls.e('tags')">
        <u-tag
          v-for="(tag, index) in visibleTags"
          :key="tag[valueKey]"
          :closable="!disabled"
          @close="handleRemove(index)"
        >
          {{ tag[labelKey] }}
        </u-tag>
        <u-tag v-if="hiddenCount > 0">+{{ hiddenCount }}</u-tag>

        <!-- 内嵌查询输入框：承载过滤 -->
        <input
          v-if="filterable"
          ref="inputRef"
          :class="cls.e('input')"
          v-model="qs"
          :placeholder="tags.length ? '' : placeholder"
          :disabled="disabled"
          @click.stop="handleInputClick"
          @focus="handleInputFocus"
        />
      </div>
      <!-- 清空 icon -->
      <transition name="zoom-in" mode="out-in">
        <u-icon v-if="showClear" :class="cls.e('clear')" @click.stop="handleClear">
          <Close />
        </u-icon>

        <!-- 下拉 icon -->
        <u-icon :class="cls.e(`arrow`)" v-else-if="!readonly">
          <ArrowDown />
        </u-icon>
      </transition>
    </template>
    <template #content>
      <div :class="[cls.e('content-header'), cls.m(size)]">
        <!-- 全选 -->
        <u-checkbox
          :model-value="allChecked"
          :indeterminate="indeterminate"
          @update:model-value="handleCheckAll"
        >
          全选
        </u-checkbox>

        <u-button size="small" text type="primary" @click="handleToggleExpandAll">
          {{ allExpanded ? '收起全部' : '展开全部' }}
        </u-button>
      </div>
      <div v-if="remoteLoading" :class="cls.e('loading')">
        <ULoading type="dual-ring" />
      </div>
      <!-- 菜单列表 -->
      <u-tree
        v-else
        v-bind="treeProps"
        v-model:checked="model"
        @update:checked="handleCheck"
        ref="treeRef"
        :class="cls.e('content-tree')"
        checkable
        :data="treeData"
        :slots="slots"
        scroll-to-view
      ></u-tree>
    </template>
  </u-dropdown>

  <div v-else-if="model.length" :class="[cls.m(size), cls.e('readonly-tags')]">
    <div :class="cls.e('tags')">
      <u-tag v-for="option of tags" :key="option[valueKey]">
        {{ option[labelKey] }}
      </u-tag>
    </div>
  </div>

  <template v-else>
    {{ FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { debounce, dfs, o } from '@cat-kit/core'
import { useFormFallbackProps } from '@veltra/compositions'
import { ArrowDown, Close } from '@veltra/icons/normal'
import { bem, fieldKey, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import type { MultiTreeSelectProps, MultiTreeSelectEmits, TreeExposed } from '../../types'
import type { DropdownExposed } from '../../types'
import { UButton } from '../button'
import { UCheckbox } from '../checkbox'
import { UDropdown } from '../dropdown'
import { UIcon } from '../icon'
import { ULoading } from '../loading'
import { UTag } from '../tag'
import { UTree } from '../tree'
import type { TreeSlotsScope } from '../tree/di'

defineOptions({ name: 'UMultiTreeSelect', inheritAttrs: false })

const cls = bem('multi-tree-select')

const props = withDefaults(defineProps<MultiTreeSelectProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  expandAll: false,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  filterable: false,
  visibilityLimit: 3,
  minWidth: '280px',
  checkStrictly: false,
  checkOnClickNode: true
})

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

const treeProps = computed(() => {
  return o(props as Record<string, any>).omit([
    'tips',
    'field',
    'placeholder',
    'disabled',
    'label',
    'readonly',
    'modelValue',
    'data',
    'contentClass',
    'contentStyle',
    'minWidth',
    'width'
  ])
})

const emit = defineEmits<MultiTreeSelectEmits>()

const slots = defineSlots<{ default?: (props: TreeSlotsScope) => any }>()

/** 是否可搜索：显式声明或数据源为远程函数 */
const filterable = computed(() => props.filterable || typeof props.data === 'function')

/** 过滤 */
const qs = shallowRef('')

const treeRef = shallowRef<TreeExposed>()

/** 远程搜索返回的树数据 */
const remoteData = shallowRef<Record<string, any>[]>()

/** 面板渲染的树数据：data 为函数时来自远程搜索，否则为静态数据 */
const treeData = computed(() => (typeof props.data === 'function' ? remoteData.value : props.data))

const remoteLoading = shallowRef(false)
/** 远程请求序号；响应返回时序号不一致说明已有更新的请求，结果作废 */
let remoteSeq = 0

const debouncedRemoteSearch = debounce(
  async (
    query: string,
    dataFn: (qs: string) => Promise<Record<string, any>[]> | Record<string, any>[]
  ) => {
    const seq = ++remoteSeq
    remoteLoading.value = true
    try {
      const data = await dataFn(query)
      // 响应到达时查询词可能已变化或已有更新的请求，过期结果直接丢弃
      if (seq !== remoteSeq || query !== qs.value) return
      remoteData.value = data ?? []
      // 搜索结果展示完整命中路径，与本地过滤自动展开祖先的行为对齐
      if (query) nextTick(() => treeRef.value?.expandAll())
    } finally {
      if (seq === remoteSeq) remoteLoading.value = false
    }
  },
  200
)

watch(
  [qs, () => props.data],
  ([query, data]) => {
    if (typeof data === 'function') {
      debouncedRemoteSearch(query, data)
      return
    }
    treeRef.value?.filter(query)
  },
  { immediate: true }
)

const model = defineModel<(string | number)[]>({ default: () => [] })

const hovered = shallowRef(false)

const tags = shallowRef<Record<string, any>[]>([])

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const showClear = computed(() => {
  return props.clearable && model.value?.length && hovered.value && !disabled.value
})

const dropdownRef = shallowRef<DropdownExposed>()

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

  dropdownRef.value?.updateDropdown()
}

/**选中 */
const handleCheck = (checked: (string | number)[], checkedData: Record<string, any>[]) => {
  markEvent()
  tags.value = checkedData
  emit('change', checkedData!)

  dropdownRef.value?.updateDropdown()
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

const keyDicts = shallowRef(new Map<string | number, Record<string, any>>())

watch(
  treeData,
  (data) => {
    if (!data?.length) {
      keyDicts.value = new Map()
    } else {
      const newDict = new Map()
      data.forEach((item) => {
        dfs(
          item,
          (v) => {
            newDict.set(v[valueKey.value], v)
          },
          props.childrenKey
        )
      })
      keyDicts.value = newDict
    }
  },
  { immediate: true }
)

watch(
  [keyDicts, model],
  ([keyDicts, model]) => {
    if (changedByEvent) return

    if (!keyDicts.size || !model?.length) {
      tags.value = []
      return
    }

    tags.value = model.filter((v) => keyDicts.has(v)).map((v) => keyDicts.get(v)!)
  },
  { immediate: true }
)

const allExpanded = shallowRef(props.expandAll)
function handleToggleExpandAll() {
  allExpanded.value = !allExpanded.value
  allExpanded.value ? treeRef.value?.expandAll() : treeRef.value?.collapseAll()
}

watch(treeRef, (treeRef) => {
  if (!treeRef) {
    allExpanded.value = props.expandAll
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

const dropdownVisible = shallowRef(false)

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

const handleDropdownVisible = (visible: boolean) => {
  dropdownVisible.value = visible
  if (!visible) {
    qs.value = ''
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
</script>
