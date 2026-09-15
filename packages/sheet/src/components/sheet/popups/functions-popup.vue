<template>
  <div ref="panelRef" :class="cls.e('functions-panel')" @keydown="handleKeydown">
    <nav :class="cls.e('functions-nav')">
      <button
        v-for="cat in FUNCTION_POPUP_CATEGORIES"
        :key="cat"
        type="button"
        :class="[cls.e('functions-nav-item'), bem.is('active', cat === activeCategory)]"
        @click="selectCategory(cat)"
      >
        {{ cat }}
      </button>
    </nav>
    <div :class="cls.e('functions-main')">
      <u-input
        v-model="keyword"
        :placeholder="'搜索函数名或描述'"
        size="small"
        :class="cls.e('functions-search')"
      />
      <!-- 滚动用 desktop UScroll（自定义滚动条），同字号面板 -->
      <u-scroll :height="320" :class="cls.e('functions-scroll')">
        <div v-if="visible.length > 0" :class="cls.e('functions-list')">
          <div
            v-for="(fn, index) in visible"
            :key="fn.name"
            :class="[cls.e('functions-item'), bem.is('active', index === activeIndex)]"
            @click="emit('select', fn.name)"
            @mouseenter="activeIndex = index"
          >
            <span :class="cls.e('functions-signature')">{{
              formatFunctionSignature(fn.name, fn.params)
            }}</span>
            <span v-if="fn.description" :class="cls.e('functions-description')">{{
              fn.description
            }}</span>
          </div>
        </div>
        <div v-else :class="cls.e('functions-empty')">无匹配函数</div>
      </u-scroll>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UInput, UScroll } from '@veltra/desktop'
import {
  listFormulaFunctions,
  type FormulaFunctionMeta
} from '@veltra/sheet-core/core/formula/functions'
import { bem } from '@veltra/utils'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'

import {
  COMMON_FORMULA_NAMES,
  formatFunctionSignature,
  FUNCTION_POPUP_CATEGORIES,
  moveSuggestIndex,
  type FunctionPopupCategory
} from '../use-formula-suggest'

defineOptions({ name: 'USheetFunctionsPopup' })

/**
 * 函数弹框（分类导航 + 搜索 + 可选择）：fx 按钮与工具栏「函数」共用。
 * 列出全部已注册函数（内置 + 宿主经 registerFormulaFunction 注册的自定义函数），
 * 选中仅 emit select(name)，由公式栏接管（进入编辑态输出 =NAME()），不写模型。
 * 弹框随 v-if 挂载 / 销毁，每次打开都是全新状态（关键词清空、回到「常用」）。
 */

type FunctionItem = { name: string } & FormulaFunctionMeta

const emit = defineEmits<{ select: [name: string] }>()

const cls = bem('sheet')

const panelRef = useTemplateRef<HTMLElement>('panelRef')

const keyword = ref('')
const activeCategory = ref<FunctionPopupCategory>('常用')
/** 键盘 / 悬停高亮下标（点击即确认不高亮） */
const activeIndex = ref(0)

/** 打开时快照一次注册表（弹框存活期间注册表变化不追踪，重开即刷新） */
const all: FunctionItem[] = listFormulaFunctions()

/** 关键词大小写不敏感子串匹配：名称或中文描述；跨分类（未分类函数也可搜到） */
function searchResult(key: string): FunctionItem[] {
  return all.filter(
    (fn) => fn.name.toLowerCase().includes(key) || fn.description.toLowerCase().includes(key)
  )
}

/** 当前展示列表：搜索优先；否则按分类导航过滤 */
const visible = computed<FunctionItem[]>(() => {
  const key = keyword.value.trim().toLowerCase()
  if (key) return searchResult(key)
  if (activeCategory.value === '全部') return all
  if (activeCategory.value === '常用') {
    // 固定清单（顺序即 COMMON_FORMULA_NAMES 顺序）；注册表中缺失的名称跳过
    const byName = new Map(all.map((fn) => [fn.name, fn]))
    return COMMON_FORMULA_NAMES.map((name) => byName.get(name)).filter(
      (fn): fn is FunctionItem => fn != null
    )
  }
  // 分类项只列声明了该 category 的函数（未分类函数不进任何分类）
  return all.filter((fn) => fn.category === activeCategory.value)
})

watch(visible, () => {
  activeIndex.value = 0
})

function selectCategory(cat: FunctionPopupCategory): void {
  activeCategory.value = cat
}

/** 键盘路径：↑↓ 移动高亮（循环），Enter 确认选中（Esc 交由外层弹框关闭） */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = moveSuggestIndex(
      activeIndex.value,
      visible.value.length,
      event.key === 'ArrowDown' ? 1 : -1
    )
    return
  }
  if (event.key === 'Enter') {
    const fn = visible.value[activeIndex.value]
    if (!fn) return
    event.preventDefault()
    emit('select', fn.name)
  }
}

// 打开即聚焦搜索框，键盘可直接检索 / 导航（查 DOM 而非组件 expose，stub 环境同样可用）
onMounted(() => {
  panelRef.value?.querySelector('input')?.focus()
})
</script>
