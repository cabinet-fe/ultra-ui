<template>
  <template v-if="readonly">{{ displayedValue || FORM_EMPTY_CONTENT }}</template>

  <div
    v-else
    v-bind="$attrs"
    :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('active', sheetVisible)]"
    :aria-expanded="sheetVisible"
    aria-haspopup="dialog"
    role="combobox"
    @click="handleTriggerClick"
  >
    <span v-if="$slots.prefix" :class="cls.e('prefix')">
      <slot name="prefix" />
    </span>

    <span :class="[cls.e('value'), bem.is('placeholder', !displayedValue)]">
      {{ displayedValue || placeholder }}
    </span>

    <span :class="cls.e('icons')">
      <button
        v-if="showClear"
        :class="cls.e('clear')"
        type="button"
        aria-label="清除"
        @click.stop="handleClear"
      >
        <Close />
      </button>
      <span v-else :class="cls.e('arrow')" aria-hidden="true">
        <ArrowDown />
      </span>
    </span>
  </div>

  <BottomSheet
    v-model:visible="sheetVisible"
    :title="placeholder"
    :content-class="contentClass"
    :content-style="contentStyle"
  >
    <div v-if="filterable" :class="cls.e('search')">
      <input
        ref="searchRef"
        v-model="qs"
        :class="cls.e('search-input')"
        type="text"
        placeholder="搜索"
        enterkeyhint="search"
      />
    </div>

    <div v-if="loading" :class="cls.e('loading')">加载中...</div>

    <template v-else-if="searching">
      <ul v-if="filteredItems.length" :class="cls.e('options')">
        <li
          v-for="item of filteredItems"
          :key="item.value"
          :class="getOptionCls(item)"
          role="option"
          :aria-selected="isSelected(item)"
          :aria-disabled="item.disabled || undefined"
          @click="handleSelect(item)"
        >
          <span :class="cls.e('option-main')">
            <span :class="cls.e('option-label')">{{ item.label }}</span>
            <span v-if="ancestorLabel(item)" :class="cls.e('option-path')">
              {{ ancestorLabel(item) }}
            </span>
          </span>

          <span v-if="isSelected(item)" :class="cls.e('check')" aria-hidden="true">
            <Check />
          </span>
        </li>
      </ul>

      <div v-else :class="cls.e('empty')">暂无数据</div>
    </template>

    <template v-else>
      <ul v-if="treeRows.length" :class="cls.e('options')">
        <li
          v-for="item of treeRows"
          :key="item.value"
          :class="getOptionCls(item)"
          :style="{ '--depth': item.depth }"
          role="option"
          :aria-selected="isSelected(item)"
          :aria-disabled="item.disabled || undefined"
          @click="handleSelect(item)"
        >
          <button
            v-if="item.children.length"
            :class="[cls.e('expand'), bem.is('expanded', expandedSet.has(item))]"
            type="button"
            :aria-label="expandedSet.has(item) ? '收起' : '展开'"
            :aria-expanded="expandedSet.has(item)"
            @click.stop="toggleExpand(item)"
          >
            <ArrowRight />
          </button>
          <span v-else :class="[cls.e('expand'), bem.is('leaf', true)]" aria-hidden="true" />

          <span :class="cls.e('option-label')">{{ item.label }}</span>

          <span v-if="isSelected(item)" :class="cls.e('check')" aria-hidden="true">
            <Check />
          </span>
        </li>
      </ul>

      <div v-else :class="cls.e('empty')">暂无数据</div>
    </template>
  </BottomSheet>
</template>

<script lang="ts" setup>
import { debounce, o } from '@cat-kit/core'
import { ArrowDown, ArrowRight, Check, Close } from '@veltra/icons/normal'
import { FORM_EMPTY_CONTENT, fieldKey, injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import { bem } from '../../shared/bem'
import type { TreeSelectEmits, TreeSelectProps } from '../../types/tree-select'
import { BottomSheet } from '../_internal/bottom-sheet'

defineOptions({ name: 'UTreeSelect', inheritAttrs: false })

const props = withDefaults(defineProps<TreeSelectProps>(), {
  valueKey: 'value',
  labelKey: 'label',
  childrenKey: 'children',
  placeholder: '请选择',
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  filterable: false,
  expandAll: false,
  data: () => []
})

const emit = defineEmits<TreeSelectEmits>()

defineSlots<{ prefix?: () => any }>()

const cls = bem('tree-select')

const { formProps } = injectFormContext()

// 表单回滚属性：组件自身优先于表单（与 desktop 行为一致）
const size = computed(() => props.size ?? formProps?.size ?? 'default')
const disabled = computed(() => props.disabled ?? formProps?.disabled ?? false)
const readonly = computed(() => props.readonly ?? formProps?.readonly ?? false)

const valueKey = computed(() => fieldKey(props.valueKey, 'value'))
const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const childrenKey = computed(() => props.childrenKey || 'children')

const filterable = computed(() => props.filterable || typeof props.data === 'function')

/** 树节点（内部实现）：扁平化渲染所需的展示字段与层级 */
interface TreeItem {
  data: Record<string, any>
  value: string | number
  label: string
  depth: number
  parent?: TreeItem
  disabled: boolean
  children: TreeItem[]
}

/** 节点禁用判定：函数由调用方自定义，字段名按节点数据真值判断 */
function isNodeDisabled(data: Record<string, any>): boolean {
  if (!props.disabledNode) return false
  if (typeof props.disabledNode === 'function') return !!props.disabledNode(data)
  return !!o(data).get(props.disabledNode)
}

function buildItems(
  data: Record<string, any>[] | undefined,
  depth: number,
  parent?: TreeItem
): TreeItem[] {
  const result: TreeItem[] = []
  for (const datum of data ?? []) {
    const item: TreeItem = {
      data: datum,
      value: o(datum).get(valueKey.value) ?? '',
      label: o(datum).get(labelKey.value) ?? '',
      depth,
      parent,
      disabled: isNodeDisabled(datum),
      children: []
    }
    item.children = buildItems(o(datum).get(childrenKey.value), depth + 1, item)
    result.push(item)
  }
  return result
}

/** 远程搜索返回的树数据；data 为静态数组时直接使用 */
const remoteData = shallowRef<Record<string, any>[]>()
const treeData = computed(() =>
  typeof props.data === 'function' ? remoteData.value : (props.data as Record<string, any>[])
)

/** 全量嵌套节点（含各级），供行渲染递归下钻 */
const allItems = computed(() => buildItems(treeData.value, 0))

/** 扁平化全量节点（先序遍历），供回显查找 / 搜索 / 展开初始化遍历 */
const flatItems = computed(() => {
  const list: TreeItem[] = []
  const walk = (items: TreeItem[]) => {
    for (const item of items) {
      list.push(item)
      walk(item.children)
    }
  }
  walk(allItems.value)
  return list
})

const dataMap = computed(() => {
  const map = new Map<string, TreeItem>()
  for (const item of flatItems.value) {
    if (item.value !== undefined && item.value !== null && item.value !== '') {
      map.set(String(item.value), item)
    }
  }
  return map
})

/** 值比较：兼容数字 / 字符串形态的 id */
function isSameValue(a: TreeItem['value'], b: string | number | undefined) {
  return a === b || String(a) === String(b)
}

/** 内部展示文案，仅由数据推导（未命中时展示 text 兜底）；经 update:text 通知父级 */
const label = shallowRef<string>()

const displayedValue = computed(() => {
  if (label.value) return label.value
  return props.text ?? String(props.modelValue ?? '')
})

/** 抑制内部写入引起的外部回显同步 */
let suppressEcho = false

/** 更新内部文案；值变化时 emit update:text（readonly 纯展示，不通知父级） */
function setLabel(next?: string) {
  if (label.value === next) return
  label.value = next
  if (!readonly.value) emit('update:text', next)
}

/** 按 modelValue 与全量节点同步展示文案（外部回显用，O(n)） */
function syncSelected(modelValue: string | number | undefined) {
  if (modelValue !== undefined && modelValue !== null && modelValue !== '') {
    const item = dataMap.value.get(String(modelValue))
    if (item) {
      setLabel(item.label)
    } else if (props.text) {
      // 未命中但有 text 兜底：文案以父级为准，不回发
      label.value = undefined
    } else {
      // 未命中且无兜底：如实通知父级当前没有可展示文案
      setLabel(undefined)
    }
  } else {
    setLabel(undefined)
  }
}

watch(
  [() => props.modelValue, dataMap],
  ([modelValue]) => {
    if (suppressEcho) {
      suppressEcho = false
      return
    }
    syncSelected(modelValue)
  },
  { immediate: true }
)

// 远程搜索：data 为函数时按查询词拉取；序号守卫丢弃过期响应
const qs = shallowRef('')
const loading = shallowRef(false)
const searching = computed(() => filterable.value && !!qs.value.trim())
const searchRef = useTemplateRef<HTMLInputElement>('searchRef')

let remoteSeq = 0

const debouncedRemoteSearch = debounce(
  async (
    query: string,
    dataFn: (qs: string) => Promise<Record<string, any>[]> | Record<string, any>[]
  ) => {
    const seq = ++remoteSeq
    loading.value = true
    try {
      const data = await dataFn(query)
      // 响应到达时查询词可能已变化或已有更新的请求，过期结果直接丢弃
      if (seq !== remoteSeq || query !== qs.value) return
      remoteData.value = data ?? []
    } finally {
      if (seq === remoteSeq) loading.value = false
    }
  },
  200
)

watch(
  [qs, () => props.data],
  ([query, data]) => {
    if (typeof data !== 'function') return
    debouncedRemoteSearch(query, data)
  },
  { immediate: true }
)

/** 本地搜索：平铺命中项，路径作为副标题 */
const filteredItems = computed(() => {
  const keyword = qs.value.trim().toLowerCase()
  if (!keyword) return [] as TreeItem[]
  return flatItems.value.filter((item) => item.label.toLowerCase().includes(keyword))
})

/** 搜索结果副标题：祖先路径 */
function ancestorLabel(item: TreeItem): string {
  const labels: string[] = []
  let parent = item.parent
  while (parent) {
    labels.unshift(parent.label)
    parent = parent.parent
  }
  return labels.join('/')
}

const expandedSet = shallowRef(new Set<TreeItem>())

/** 当前可见行：根始终可见，父节点展开后渲染其子级 */
const treeRows = computed(() => {
  const rows: TreeItem[] = []
  const walk = (items: TreeItem[]) => {
    for (const item of items) {
      rows.push(item)
      if (item.children.length && expandedSet.value.has(item)) walk(item.children)
    }
  }
  walk(allItems.value)
  return rows
})

function toggleExpand(item: TreeItem) {
  const next = new Set(expandedSet.value)
  if (next.has(item)) {
    next.delete(item)
  } else {
    next.add(item)
  }
  expandedSet.value = next
}

const sheetVisible = shallowRef(false)

/** 移动端无 hover：有值且可清除即展示清除按钮 */
const showClear = computed(() => {
  return props.clearable && !disabled.value && !!displayedValue.value
})

/** 面板展开时初始化展开状态：expandAll 或选中节点的祖先链 */
function initExpanded() {
  const next = new Set<TreeItem>()
  if (props.expandAll) {
    for (const item of flatItems.value) {
      if (item.children.length) next.add(item)
    }
  } else {
    const selected = dataMap.value.get(String(props.modelValue))
    if (selected) {
      if (selected.children.length) next.add(selected)
      let parent = selected.parent
      while (parent) {
        next.add(parent)
        parent = parent.parent
      }
    }
  }
  expandedSet.value = next
}

watch(sheetVisible, (visible) => {
  if (visible) {
    qs.value = ''
    initExpanded()
    if (filterable.value) {
      nextTick(() => searchRef.value?.focus())
    }
  } else {
    qs.value = ''
    suppressEcho = false
  }
})

function isSelected(item: TreeItem) {
  return item.value !== '' && isSameValue(item.value, props.modelValue)
}

function getOptionCls(item: TreeItem) {
  return [cls.e('option'), bem.is('active', isSelected(item)), bem.is('disabled', item.disabled)]
}

function handleTriggerClick() {
  if (disabled.value) return
  sheetVisible.value = true
}

/** 单选：写入值与文案后收起面板；禁用节点不可选中 */
function handleSelect(item: TreeItem) {
  if (item.disabled) return

  suppressEcho = true
  emit('update:modelValue', item.value)
  setLabel(item.label)
  emit('change', item.data)

  sheetVisible.value = false
}

function handleClear() {
  setLabel(undefined)
  suppressEcho = true
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
}
</script>
