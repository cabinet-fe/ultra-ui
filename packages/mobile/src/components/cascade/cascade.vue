<template>
  <!-- 只读态：单选纯文本，多选纯标签 -->
  <template v-if="readonly">
    <template v-if="multiple">
      <div v-if="allTagNodes.length" :class="[cls.b, cls.m(size), bem.is('readonly', true)]">
        <div :class="cls.e('tags')">
          <span v-for="tag of allTagNodes" :key="tag.value" :class="cls.e('tag')">
            {{ tag.label }}
          </span>
        </div>
      </div>
      <template v-else>{{ FORM_EMPTY_CONTENT }}</template>
    </template>
    <template v-else>{{ displayedValue || FORM_EMPTY_CONTENT }}</template>
  </template>

  <template v-else>
    <div
      v-bind="$attrs"
      :class="[cls.b, cls.m(size), bem.is('disabled', disabled), bem.is('active', sheetVisible)]"
      :aria-expanded="sheetVisible"
      aria-haspopup="dialog"
      role="combobox"
      @click="handleTriggerClick"
    >
      <template v-if="multiple">
        <span v-if="!modelValues.length" :class="[cls.e('value'), bem.is('placeholder', true)]">
          {{ placeholder }}
        </span>

        <div v-if="modelValues.length" ref="tagsRef" :class="cls.e('tags')">
          <span v-for="tag of tags" :key="tag.value" :class="cls.e('tag')">
            <span :class="cls.e('tag-label')">{{ tag.label }}</span>

            <button
              v-if="!disabled"
              :class="cls.e('tag-close')"
              type="button"
              :aria-label="`移除 ${tag.label}`"
              @click.stop="handleTagClose(tag)"
            >
              <Close />
            </button>
          </span>

          <span v-if="restTag" :class="[cls.e('tag'), bem.is('rest', true)]"> {{ restTag }}+ </span>
        </div>
      </template>

      <span v-else :class="[cls.e('value'), bem.is('placeholder', !displayedValue)]">
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

    <!-- 底部级联面板：单选选中即落值收起；多选暂存后点确定落盘 -->
    <BottomSheet
      v-model:visible="sheetVisible"
      :title="placeholder"
      :content-class="contentClass"
      :content-style="contentStyle"
    >
      <template v-if="multiple" #header>
        <button :class="cls.e('cancel')" type="button" @click="sheetVisible = false">取消</button>
        <span :class="cls.e('title')">{{ placeholder }}</span>
        <button :class="cls.e('confirm')" type="button" @click="handleConfirm">确定</button>
      </template>

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

      <!-- 搜索结果：平铺命中项，路径作为副标题 -->
      <template v-if="searching">
        <ul v-if="filteredNodes.length" :class="cls.e('options')">
          <li
            v-for="node of filteredNodes"
            :key="node.value"
            :class="getOptionCls(node)"
            role="option"
            :aria-selected="isSelected(node)"
            @click="handleSearchClick(node)"
          >
            <span
              v-if="multiple"
              :class="[cls.e('checkbox'), bem.is('checked', checkedSet.has(node))]"
              @click.stop="toggleCheck(node)"
            >
              <Check v-if="checkedSet.has(node)" />
            </span>

            <span :class="cls.e('option-main')">
              <span :class="cls.e('option-label')">{{ node.label }}</span>
              <span v-if="parentLabel(node)" :class="cls.e('option-path')">
                {{ parentLabel(node) }}
              </span>
            </span>

            <span v-if="node.children?.length" :class="cls.e('arrow-right')" aria-hidden="true">
              <ArrowRight />
            </span>
            <span
              v-else-if="!multiple && isSelected(node)"
              :class="cls.e('check')"
              aria-hidden="true"
            >
              <Check />
            </span>
          </li>
        </ul>

        <div v-else :class="cls.e('empty')">暂无数据</div>
      </template>

      <template v-else>
        <div :class="cls.e('tabs')" role="tablist">
          <button
            v-for="(label, index) of tabs"
            :key="index"
            type="button"
            role="tab"
            :aria-selected="index === activeTabIndex"
            :class="[cls.e('tab'), bem.is('active', index === activeTabIndex)]"
            @click="handleTabClick(index)"
          >
            {{ label }}
          </button>
        </div>

        <ul v-if="currentNodes.length" :class="cls.e('options')">
          <li
            v-for="node of currentNodes"
            :key="node.value"
            :class="getOptionCls(node)"
            role="option"
            :aria-selected="isSelected(node)"
            @click="handleOptionClick(node)"
          >
            <span
              v-if="multiple"
              :class="[cls.e('checkbox'), bem.is('checked', checkedSet.has(node))]"
              @click.stop="toggleCheck(node)"
            >
              <Check v-if="checkedSet.has(node)" />
            </span>

            <span :class="cls.e('option-label')">{{ node.label }}</span>

            <span v-if="node.children?.length" :class="cls.e('arrow-right')" aria-hidden="true">
              <ArrowRight />
            </span>
            <span
              v-else-if="!multiple && isSelected(node)"
              :class="cls.e('check')"
              aria-hidden="true"
            >
              <Check />
            </span>
          </li>
        </ul>

        <div v-else :class="cls.e('empty')">暂无数据</div>
      </template>
    </BottomSheet>
  </template>
</template>

<script lang="ts" setup>
import { Forest, dfs, o } from '@cat-kit/core'
import { useResizeObserver } from '@veltra/compositions'
import { ArrowDown, ArrowRight, Check, Close } from '@veltra/icons/normal'
import { FORM_EMPTY_CONTENT, fieldKey, injectFormContext } from '@veltra/utils'
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import { bem } from '../../shared/bem'
import type { CascadeEmits, CascadeProps } from '../../types/cascade'
import { BottomSheet } from '../_internal/bottom-sheet'
import { CascadeItem } from './node'

defineOptions({ name: 'UCascade', inheritAttrs: false })

const props = withDefaults(defineProps<CascadeProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  placeholder: '请选择',
  separator: '/',
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  childrenKey: 'children',
  filterable: false,
  multiple: false,
  data: () => [],
  visibilityLimit: 3,
  showFullPath: true
})

const emit = defineEmits<CascadeEmits>()

const cls = bem('cascade')

const { formProps } = injectFormContext()

// 表单回滚属性：组件自身优先于表单（与 desktop 行为一致）
const size = computed(() => props.size ?? formProps?.size ?? 'default')
const disabled = computed(() => props.disabled ?? formProps?.disabled ?? false)
const readonly = computed(() => props.readonly ?? formProps?.readonly ?? false)

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

const multiple = computed(() => props.multiple)

// 值
const modelValues = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

// 树
const forest = computed(() => {
  return new Forest<Record<string, unknown>, any>({
    data: (props.data ?? []) as Record<string, unknown>[],
    childrenKey: props.childrenKey,
    createNode: (data, index, depth, _forest, parent) => {
      if (!data) {
        return new CascadeItem({ data, index, depth, value: '', label: '', parent })
      }

      return new CascadeItem({
        data,
        index,
        depth,
        value: o(data).get(valueKey.value) ?? '',
        label: o(data).get(labelKey.value) ?? '',
        parent
      })
    }
  })
})

const dataMap = computed(() => {
  const map = new Map<string, CascadeItem>()
  forest.value.dfs((node) => {
    if (node.value !== undefined && node.value !== null && node.value !== '') {
      map.set(node.value, node)
    }
  })
  return map
})

/** 当前层级的面包屑路径（不含当前层节点） */
const path = shallowRef<CascadeItem[]>([])

/** 单选中高亮的节点 */
const currentSelected = shallowRef<CascadeItem>()

const currentNodes = computed(() => {
  const parent = path.value[path.value.length - 1]
  return parent ? ((parent.children ?? []) as CascadeItem[]) : (forest.value.roots as CascadeItem[])
})

const tabs = computed(() => [props.placeholder, ...path.value.map((node) => node.label)])
const activeTabIndex = computed(() => path.value.length)

// 搜索
const qs = shallowRef('')
const searching = computed(() => props.filterable && !!qs.value.trim())
const searchRef = useTemplateRef<HTMLInputElement>('searchRef')

const filteredNodes = computed(() => {
  const keyword = qs.value.trim().toLowerCase()
  if (!keyword) return [] as CascadeItem[]

  const result: CascadeItem[] = []
  forest.value.dfs((node) => {
    if (node.label?.toLowerCase().includes(keyword)) result.push(node)
  })
  return result
})

// 多选暂存
const checkedSet = shallowRef(new Set<CascadeItem>())

const sheetVisible = shallowRef(false)

/** 单选展示文案：按完整路径或叶子值解析，未命中回退 text */
const displayedValue = computed(() => {
  const { modelValue, separator, showFullPath, text } = props
  if (!modelValue || typeof modelValue !== 'string') return ''

  if (showFullPath) {
    const keys = modelValue.split(separator)
    // 末级未命中视为整条路径无效，回退 text 兜底
    if (!dataMap.value.has(keys[keys.length - 1]!)) return text ?? modelValue
    return keys.map((key) => dataMap.value.get(key)?.label ?? key).join(separator)
  }

  return dataMap.value.get(modelValue)?.label ?? text ?? modelValue
})

/** 触发器标签上限：禁用/只读时展示全部 */
const maxVisible = computed(() => {
  let limit = props.visibilityLimit
  if (limit < 0) limit = 0
  if (disabled.value || readonly.value) limit = modelValues.value.length
  return limit
})

const allTagNodes = computed(() => {
  return modelValues.value
    .map((value) => dataMap.value.get(value))
    .filter((node): node is CascadeItem => !!node)
})

/** 当前宽度内放得下的标签数：初值不设限，挂载后按实际宽度收敛 */
const fitCount = shallowRef(Number.POSITIVE_INFINITY)

const tagsRef = useTemplateRef<HTMLDivElement>('tagsRef')

let measuring = false

/** 是否存在被省略号截断的标签文本（截断则折叠进 +N，保证标签完整可读） */
function hasTruncatedLabel(el: HTMLElement) {
  return [...el.querySelectorAll<HTMLElement>('.um-cascade__tag-label')].some(
    (label) => label.scrollWidth > label.clientWidth + 1
  )
}

/** 先放开到上限，再逐个折叠到标签完整可读；空间不足时保底 1 个，其余计入 +N */
async function measureFit() {
  const el = tagsRef.value
  if (!el || measuring) return
  measuring = true
  try {
    if (fitCount.value !== maxVisible.value) {
      fitCount.value = maxVisible.value
      await nextTick()
    }
    while (hasTruncatedLabel(el) && fitCount.value > 1) {
      fitCount.value -= 1
      await nextTick()
    }
  } finally {
    measuring = false
  }
}

useResizeObserver({ targets: tagsRef, onResize: () => measureFit() })

watch([allTagNodes, maxVisible, size, disabled, readonly, () => props.visibilityLimit], () =>
  nextTick(measureFit)
)

const tags = computed(() => allTagNodes.value.slice(0, Math.min(maxVisible.value, fitCount.value)))

const restTag = computed(() => modelValues.value.length - tags.value.length)

const showClear = computed(() => {
  if (!props.clearable || disabled.value) return false
  return multiple.value ? modelValues.value.length > 0 : !!displayedValue.value
})

// 导航 / 选择
function ancestorsOf(node: CascadeItem): CascadeItem[] {
  const result: CascadeItem[] = []
  let parent = node.parent
  while (parent) {
    result.unshift(parent)
    parent = parent.parent
  }
  return result
}

/** 搜索结果副标题：仅展示祖先路径，避免与主标签重复 */
function parentLabel(node: CascadeItem): string {
  return ancestorsOf(node)
    .map((item) => item.label)
    .join(props.separator)
}

function initSingle() {
  path.value = []
  currentSelected.value = undefined

  const { modelValue, separator, showFullPath } = props
  if (!modelValue || typeof modelValue !== 'string') return

  let node: CascadeItem | undefined
  if (showFullPath) {
    const keys = modelValue.split(separator)
    node = dataMap.value.get(keys[keys.length - 1]!)
  } else {
    node = dataMap.value.get(modelValue)
  }
  if (!node) return

  const ancestors = ancestorsOf(node)
  if (node.children?.length) {
    // 已选中非叶子：直接展开其下级
    path.value = [...ancestors, node]
  } else {
    path.value = ancestors
    currentSelected.value = node
  }
}

function commitSingle(node: CascadeItem) {
  const nodes = [...path.value, node]
  const keys = nodes.map((item) => item.value)
  const labels = nodes.map((item) => item.label)
  const targetValue = props.showFullPath ? keys.join(props.separator) : node.value
  const targetLabel = props.showFullPath ? labels.join(props.separator) : node.label

  emit('update:modelValue', targetValue)
  emit('update:label', targetLabel)
  emit('change', node.data ? { ...node.data, fullLabel: targetLabel } : undefined, targetLabel)
}

function emitMultipleValues(values: string[]) {
  const nodes = values
    .map((value) => dataMap.value.get(value))
    .filter((node): node is CascadeItem => !!node)
  const labels = nodes.map((node) => node.label)

  emit('update:modelValue', values)
  emit('update:label', labels.length ? labels : undefined)
  emit(
    'change',
    nodes.map((node) => ({ ...node.data, fullLabel: node.label })),
    labels.length ? labels : undefined
  )
}

function isSelected(node: CascadeItem) {
  return multiple.value ? checkedSet.value.has(node) : currentSelected.value?.value === node.value
}

function getOptionCls(node: CascadeItem) {
  return [cls.e('option'), bem.is('active', isSelected(node))]
}

function handleTriggerClick() {
  if (disabled.value) return
  sheetVisible.value = true
}

function handleOptionClick(node: CascadeItem) {
  if (multiple.value) {
    if (node.children?.length) {
      path.value = [...path.value, node]
    } else {
      toggleCheck(node)
    }
    return
  }

  const hasChildren = !!node.children?.length

  // strict：非叶子只展开不提交
  if (!props.strict || !hasChildren) commitSingle(node)

  if (hasChildren) {
    path.value = [...path.value, node]
    currentSelected.value = undefined
  } else {
    currentSelected.value = node
    sheetVisible.value = false
  }
}

function handleSearchClick(node: CascadeItem) {
  const hasChildren = !!node.children?.length

  if (multiple.value) {
    if (hasChildren) {
      path.value = [...ancestorsOf(node), node]
      currentSelected.value = undefined
      qs.value = ''
    } else {
      toggleCheck(node)
    }
    return
  }

  if (hasChildren) {
    path.value = [...ancestorsOf(node), node]
    currentSelected.value = undefined
    qs.value = ''
    return
  }

  path.value = ancestorsOf(node)
  currentSelected.value = node
  commitSingle(node)
  sheetVisible.value = false
}

function handleTabClick(index: number) {
  if (index >= path.value.length) return
  path.value = path.value.slice(0, index)
  currentSelected.value = undefined
}

function toggleCheck(node: CascadeItem) {
  const next = new Set(checkedSet.value)
  const checked = !next.has(node)

  dfs(
    node as unknown as Record<string, unknown>,
    (item) => {
      if (checked) {
        next.add(item as unknown as CascadeItem)
      } else {
        next.delete(item as unknown as CascadeItem)
      }
    },
    props.childrenKey
  )

  checkedSet.value = next
}

function handleConfirm() {
  const nodes = Array.from(checkedSet.value)
  const values = nodes.map((node) => node.value)
  const labels = nodes.map((node) => node.label)

  emit('update:modelValue', values)
  emit('update:label', labels.length ? labels : undefined)
  emit(
    'change',
    nodes.map((node) => ({ ...node.data, fullLabel: node.label })),
    labels.length ? labels : undefined
  )
  sheetVisible.value = false
}

function handleTagClose(tag: CascadeItem) {
  emitMultipleValues(modelValues.value.filter((value) => value !== tag.value))
}

function handleClear() {
  path.value = []
  currentSelected.value = undefined
  checkedSet.value = new Set()
  qs.value = ''

  emit('update:modelValue', multiple.value ? [] : undefined)
  emit('update:label', undefined)
  emit('change', multiple.value ? [] : undefined, undefined)
  emit('clear')
}

watch(sheetVisible, (visible) => {
  if (visible) {
    qs.value = ''
    if (multiple.value) {
      path.value = []
      currentSelected.value = undefined
      checkedSet.value = new Set(
        modelValues.value
          .map((value) => dataMap.value.get(value))
          .filter((node): node is CascadeItem => !!node)
      )
    } else {
      initSingle()
    }

    if (props.filterable) {
      nextTick(() => searchRef.value?.focus())
    }
  } else {
    qs.value = ''
  }
})
</script>
