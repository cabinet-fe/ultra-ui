<template>
  <u-tip
    hide-arrow
    alignment="start"
    direction="bottom"
    :trigger-dom="triggerDom"
    :visible="visible"
    @update:visible="updateVisible($event)"
  >
    <template #content>
      <!-- 搜索框 -->
      <div v-if="filterable" :class="cls.e('filter')">
        <u-input
          placeholder="输入关键字进行过滤"
          v-model="searchQuery"
          :size="'small'"
          clearable
          @input="handleSearch"
        >
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>

      <!-- 面包屑导航 -->
      <div
        v-if="breadcrumbs.length > 1 && !searchQuery"
        :class="cls.e('breadcrumbs')"
      >
        <span
          v-for="(crumb, index) in breadcrumbs"
          :key="index"
          :class="cls.e('breadcrumb-item')"
        >
          <span
            :class="[
              cls.e('breadcrumb-link'),
              {
                [cls.e('breadcrumb-link--active')]:
                  index === breadcrumbs.length - 1
              }
            ]"
            @click="navigateToBreadcrumb(index)"
          >
            {{ crumb.label }}
          </span>
          <u-icon
            v-if="index < breadcrumbs.length - 1"
            :class="cls.e('breadcrumb-separator')"
          >
            <ArrowRight />
          </u-icon>
        </span>
      </div>

      <!-- 单面板 -->
      <div :class="cls.e('panel')" v-if="currentList.length">
        <u-scroll
          tag="ul"
          :class="cls.e('panel-list')"
          :content-class="cls.e('panel-content')"
        >
          <li
            v-for="(item, idx) in currentList"
            :key="item.value ?? idx"
            :class="getItemCls(item, idx)"
            @click="handleItemClick(item)"
            @mouseenter="activeIndex = idx"
          >
            <span :class="cls.e('item-label')">
              {{ item.label }}
            </span>
            <u-icon v-if="item.children?.length" :class="cls.e('item-expand')">
              <ArrowRight />
            </u-icon>
          </li>
        </u-scroll>
      </div>

      <!-- 空状态 -->
      <div v-else :class="cls.e('empty')">
        <UEmpty description="暂无可用变量" />
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import { UTip } from '../../tip'
import { UInput } from '../../input'
import { UIcon } from '../../icon'
import { UScroll } from '../../scroll'
import { UEmpty } from '../../empty'
import { ExpressionEditorDIKey } from '../di'
import { inject, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { VariableItem } from '@ultra-ui/desktop/types'
import { bem } from '@ultra-ui/utils'
import { ArrowRight, Search } from '@ultra-ui/icons/normal'

defineOptions({
  name: 'VariablePicker'
})

const props = defineProps<{
  visible: boolean
  triggerDom?: HTMLElement
  filterable?: boolean
  registerPickerKeyHandler?: (
    handler: ((e: KeyboardEvent) => void) | null
  ) => void
}>()

const emit = defineEmits<{
  (e: 'select', variable: VariableItem): void
  (e: 'update:visible', visible: boolean): void
}>()

const { cls, editorProps, variableMap } = inject(ExpressionEditorDIKey)!

const searchQuery = ref('')
const activeIndex = ref<number>(-1)
const navigationPath = ref<VariableItem[]>([]) // 当前导航路径

// 扁平化变量树，用于搜索
function flattenVariables(
  items: VariableItem[] | undefined,
  parentPath: VariableItem[] = []
): VariableItem[] {
  if (!items) return []
  const result: VariableItem[] = []

  for (const item of items) {
    const currentPath = [...parentPath, item]
    // 如果是叶子节点，添加到结果中
    if (!item.children || item.children.length === 0) {
      result.push({
        ...item,
        label: currentPath.map(p => p.label).join(' / ')
      })
    } else {
      // 递归处理子节点
      result.push(...flattenVariables(item.children, currentPath))
    }
  }

  return result
}

// 过滤后的变量列表
const filteredVariables = computed(() => {
  const { variables } = editorProps
  if (!variables || variables.length === 0) return []

  if (!searchQuery.value.trim()) {
    return variables
  }

  // 搜索模式：扁平化并过滤
  const flat = flattenVariables(variables)
  const query = searchQuery.value.toLowerCase()
  return flat.filter(item => item.label.toLowerCase().includes(query))
})

// 当前显示的列表（单面板）
const currentList = computed(() => {
  if (searchQuery.value.trim()) {
    // 搜索模式：显示过滤后的扁平列表
    return filteredVariables.value
  } else {
    // 正常模式：根据导航路径显示当前层级
    let current: VariableItem[] = filteredVariables.value
    for (const pathItem of navigationPath.value) {
      const found = current.find(item => item.value === pathItem.value)
      if (found?.children) {
        current = found.children
      } else {
        break
      }
    }
    return current
  }
})

// 面包屑导航
const breadcrumbs = computed(() => {
  return [{ label: '全部变量', value: '' }, ...navigationPath.value]
})

function getItemCls(item: VariableItem, index: number): string[] {
  const isActive = activeIndex.value === index
  const isLeaf = !item.children || item.children.length === 0

  return [cls.e('item'), bem.is('active', isActive), bem.is('leaf', isLeaf)]
}

function handleItemClick(item: VariableItem) {
  // 如果有子节点，导航到下一级
  if (item.children && item.children.length > 0) {
    navigationPath.value.push(item)
    activeIndex.value = -1
    return
  }

  // 叶子节点：选择并关闭
  const fullItem = variableMap.value.get(item.value)
  if (fullItem) {
    emit('select', fullItem)
  } else {
    emit('select', item)
  }
  updateVisible(false)
}

// 面包屑导航
function navigateToBreadcrumb(index: number) {
  if (index === 0) {
    // 点击"全部变量"，返回根级
    navigationPath.value = []
  } else {
    // 导航到指定层级
    navigationPath.value = navigationPath.value.slice(0, index)
  }
  activeIndex.value = -1
}

function handleSearch() {
  // 搜索时重置导航路径
  navigationPath.value = []
  activeIndex.value = -1
}

function updateVisible(visible: boolean) {
  emit('update:visible', visible)
  if (!visible) {
    // 关闭时重置状态
    navigationPath.value = []
    searchQuery.value = ''
    activeIndex.value = -1
  }
}

// 处理键盘事件
function handleKeydown(e: KeyboardEvent) {
  if (!props.visible) return

  if (e.key === 'Escape') {
    e.preventDefault()
    updateVisible(false)
    return
  }

  if (currentList.value.length === 0) return

  // 初始化 activeIndex
  if (activeIndex.value === -1 && currentList.value.length > 0) {
    activeIndex.value = 0
  }

  const currentItem = currentList.value[activeIndex.value]

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(
      currentList.value.length - 1,
      activeIndex.value + 1
    )
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(0, activeIndex.value - 1)
  } else if (e.key === ' ' || e.key === 'Spacebar') {
    // 空格键：导航到下一级（仅对有子项的项有效）
    e.preventDefault()
    if (currentItem?.children && currentItem.children.length > 0) {
      handleItemClick(currentItem)
    }
  } else if (e.key === 'ArrowRight') {
    // 右箭头：导航到下一级（仅对有子项的项有效）
    e.preventDefault()
    if (currentItem?.children && currentItem.children.length > 0) {
      handleItemClick(currentItem)
    }
  } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
    // 左箭头/退格：返回上一级
    e.preventDefault()
    if (navigationPath.value.length > 0) {
      navigationPath.value.pop()
      activeIndex.value = 0
    }
  } else if (e.key === 'Enter') {
    // 回车键：确定选择（仅对最末级项有效）
    e.preventDefault()
    if (currentItem) {
      if (!currentItem.children || currentItem.children.length === 0) {
        // 只有叶子节点才能选择
        handleItemClick(currentItem)
      }
    }
  }
}

// 监听键盘事件
watch(
  () => props.visible,
  v => {
    if (v) {
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  }
)

onMounted(() => {
  props.registerPickerKeyHandler?.(handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  props.registerPickerKeyHandler?.(null)
})
</script>
