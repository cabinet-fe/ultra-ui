<template>
  <u-tip
    hide-arrow
    alignment="start"
    direction="bottom"
    trigger="click"
    :trigger-dom="triggerDom"
    :visible="visible"
    @update:visible="handleVisibleChange($event)"
  >
    <template #content>
      <div :class="cls.e('picker')" @mousedown.prevent>
        <!-- 面包屑：仅逐级模式且非根级显示 -->
        <div v-if="!isFlat && navPath.length > 0" :class="cls.e('breadcrumbs')">
          <span :class="cls.e('breadcrumb-item')">
            <span :class="cls.e('breadcrumb-link')" @click="navigateTo(0)">全部变量</span>
            <u-icon :class="cls.e('breadcrumb-separator')">
              <ArrowRight />
            </u-icon>
          </span>
          <span
            v-for="(crumb, i) in navPath"
            :key="`${i}-${crumb.value}`"
            :class="cls.e('breadcrumb-item')"
          >
            <span
              :class="[
                cls.e('breadcrumb-link'),
                { [cls.em('breadcrumb-link', 'active')]: i === navPath.length - 1 }
              ]"
              @click="navigateTo(i + 1)"
              >{{ crumb.label }}</span
            >
            <u-icon v-if="i < navPath.length - 1" :class="cls.e('breadcrumb-separator')">
              <ArrowRight />
            </u-icon>
          </span>
        </div>

        <div :class="cls.e('picker-body')">
          <div :class="cls.e('panel')" v-if="currentList.length > 0">
            <u-scroll tag="ul" :class="cls.e('panel-list')" :content-class="cls.e('panel-content')">
              <li
                v-for="(item, idx) in currentList"
                :key="`${idx}-${item.value}`"
                :data-idx="idx"
                :class="getItemCls(item, idx)"
                @click="handleItemClick(item, idx)"
                @mouseenter="activeIndex = idx"
              >
                <span :class="cls.e('item-label')">{{ item.label }}</span>
                <u-icon v-if="!isFlat && hasChildren(item)" :class="cls.e('item-expand')">
                  <ArrowRight />
                </u-icon>
              </li>
            </u-scroll>
          </div>
          <div v-else :class="cls.e('empty')">
            <UEmpty description="暂无可用变量" />
          </div>

          <PathPreview v-if="isFlat && activePath.length > 0" :path="activePath" />
        </div>
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, nextTick, ref, watch } from 'vue'

import type { VariableItem } from '../../../types'
import { UEmpty } from '../../empty'
import { UIcon } from '../../icon'
import { UScroll } from '../../scroll'
import { UTip } from '../../tip'
import PathPreview from './path-preview.vue'

defineOptions({ name: 'UVariablePicker' })

interface FlatItem extends VariableItem {
  /** 仅扁平模式使用：从根到当前节点的路径 */
  __path: VariableItem[]
}

const props = defineProps<{
  visible: boolean
  triggerDom?: HTMLElement
  /** 顶层变量树 */
  variables?: VariableItem[]
  /** 来自编辑器 mention 状态的过滤字符串。空 = 逐级模式；非空 = 扁平模式。 */
  filter: string
  /** 是否允许选中分支节点 */
  selectableLevels: 'leaf' | 'any'
}>()

const emit = defineEmits<{
  (e: 'select', item: VariableItem): void
  (e: 'update:visible', visible: boolean): void
  /** 用户主动取消（按 Esc）。编辑器据此把 mention 状态置为 dismissed。 */
  (e: 'dismiss'): void
}>()

const cls = bem('expression-editor')

const navPath = ref<VariableItem[]>([])
const activeIndex = ref(0)

const isFlat = computed(() => props.filter !== '')

function hasChildren(item: VariableItem): boolean {
  return !!item.children && item.children.length > 0
}

function isLeaf(item: VariableItem): boolean {
  return !hasChildren(item)
}

/** 当前层级展示的列表（来源依模式而定） */
const currentList = computed<VariableItem[]>(() => {
  const variables = props.variables ?? []
  if (isFlat.value) return flatList.value
  let level: VariableItem[] = variables
  for (const node of navPath.value) {
    const found = level.find((it) => it.value === node.value)
    if (!found || !found.children) break
    level = found.children
  }
  return level
})

/** 扁平模式下：根据 selectableLevels 拍平 + 过滤 */
const flatList = computed<FlatItem[]>(() => {
  const variables = props.variables ?? []
  const out: FlatItem[] = []
  const includeBranches = props.selectableLevels === 'any'
  function walk(items: VariableItem[], path: VariableItem[]) {
    for (const it of items) {
      const nextPath = [...path, it]
      if (isLeaf(it)) {
        out.push({ ...it, __path: nextPath })
      } else {
        if (includeBranches) out.push({ ...it, __path: nextPath })
        walk(it.children!, nextPath)
      }
    }
  }
  walk(variables, [])
  const q = props.filter.toLowerCase()
  return out.filter((it) => it.label.toLowerCase().includes(q))
})

/** 当前 active 项；扁平模式下用于驱动路径预览 */
const activePath = computed<VariableItem[]>(() => {
  if (!isFlat.value) return []
  const item = flatList.value[activeIndex.value] as FlatItem | undefined
  return item ? item.__path : []
})

function getItemCls(_item: VariableItem, idx: number) {
  return [cls.e('item'), bem.is('active', idx === activeIndex.value)]
}

function navigateTo(i: number) {
  // 0 = 全部变量；i 之后表示进入到 navPath[i-1]
  navPath.value = navPath.value.slice(0, i)
  activeIndex.value = 0
}

function handleItemClick(item: VariableItem, idx: number) {
  activeIndex.value = idx
  selectActive()
}

function selectActive() {
  const item = currentList.value[activeIndex.value]
  if (!item) return

  if (isFlat.value) {
    // 扁平模式始终是「选中并替换」
    emit('select', flattenSourceFor(item))
    return
  }

  // 逐级模式
  if (hasChildren(item)) {
    if (props.selectableLevels === 'any') {
      // Enter 在分支项上：选中分支本身
      emit('select', item)
      return
    }
    // 默认 'leaf'：进入下一级
    navPath.value = [...navPath.value, item]
    activeIndex.value = 0
    return
  }
  emit('select', item)
}

function flattenSourceFor(it: VariableItem): VariableItem {
  const flat = it as FlatItem
  // 还原为「不带 __path 的纯 VariableItem」，避免泄漏内部字段
  const out: VariableItem = { value: flat.value, label: flat.label }
  if (flat.type) out.type = flat.type
  if (flat.children) out.children = flat.children
  return out
}

function moveActive(delta: -1 | 1) {
  const max = currentList.value.length - 1
  if (max < 0) return
  let next = activeIndex.value + delta
  if (next < 0) next = 0
  if (next > max) next = max
  activeIndex.value = next
  scrollActiveIntoView()
}

function scrollActiveIntoView() {
  void nextTick(() => {
    const list = document.querySelector(`.${cls.e('panel-list')}`)
    if (!list) return
    const item = list.querySelector(`[data-idx="${activeIndex.value}"]`)
    if (item && 'scrollIntoView' in item) {
      ;(item as HTMLElement).scrollIntoView({ block: 'nearest' })
    }
  })
}

function handleVisibleChange(v: boolean) {
  emit('update:visible', v)
  if (!v) reset()
}

function reset() {
  navPath.value = []
  activeIndex.value = 0
}

watch(
  () => props.visible,
  (v) => {
    if (!v) reset()
    else activeIndex.value = 0
  }
)

watch(
  () => props.filter,
  () => {
    // 过滤词变化：重置 active；逐级 → 扁平时清空 navPath
    activeIndex.value = 0
    if (isFlat.value) navPath.value = []
  }
)

/**
 * 由父级 forward 进来的键盘事件。
 * 返回 true 表示已处理（外部应 preventDefault）。
 */
function handleKeydown(e: KeyboardEvent): boolean {
  if (!props.visible) return false

  switch (e.key) {
    case 'Escape':
      emit('dismiss')
      emit('update:visible', false)
      reset()
      return true
    case 'ArrowDown':
      moveActive(1)
      return true
    case 'ArrowUp':
      moveActive(-1)
      return true
    case 'ArrowLeft':
      // 仅逐级模式：返回上一级；扁平模式下不拦截，让光标正常移动并触发 mention dismiss
      if (!isFlat.value && navPath.value.length > 0) {
        navPath.value = navPath.value.slice(0, -1)
        activeIndex.value = 0
        return true
      }
      return false
    case 'ArrowRight': {
      if (isFlat.value) return false
      const item = currentList.value[activeIndex.value]
      if (item && hasChildren(item)) {
        navPath.value = [...navPath.value, item]
        activeIndex.value = 0
        return true
      }
      return false
    }
    case 'Enter':
      selectActive()
      return true
    default:
      return false
  }
}

defineExpose({ handleKeydown })
</script>
