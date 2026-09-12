<template>
  <u-input
    v-model="keyword"
    :placeholder="'搜索函数名或描述'"
    size="small"
    :class="cls.e('functions-search')"
  />
  <!-- 滚动用 desktop UScroll（自定义滚动条），同字号面板 -->
  <u-scroll :height="320" :class="cls.e('functions-scroll')">
    <div v-if="filtered.length > 0" :class="cls.e('functions-list')">
      <div v-for="fn in filtered" :key="fn.name" :class="cls.e('functions-item')">
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
</template>

<script lang="ts" setup>
import { UInput, UScroll } from '@veltra/desktop'
import {
  listFormulaFunctions,
  type FormulaFunctionMeta
} from '@veltra/sheet-core/core/formula/functions'
import { bem } from '@veltra/utils'
import { computed, ref } from 'vue'

import { formatFunctionSignature } from '../use-formula-suggest'

defineOptions({ name: 'USheetFunctionsPopup' })

/**
 * 函数面板（纯查看 + 搜索）：列出全部已注册函数（内置 + 宿主经
 * registerFormulaFunction 注册的自定义函数），不写模型。
 * 面板随 v-if 挂载 / 销毁，每次打开都是全新状态（关键词清空）。
 */

type FunctionItem = { name: string } & FormulaFunctionMeta

const cls = bem('sheet')

const keyword = ref('')

/** 打开时快照一次注册表（面板存活期间注册表变化不追踪，重开即刷新） */
const all: FunctionItem[] = listFormulaFunctions()

/** 关键词大小写不敏感子串匹配：名称或中文描述 */
const filtered = computed<FunctionItem[]>(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return all
  return all.filter(
    (fn) => fn.name.toLowerCase().includes(key) || fn.description.toLowerCase().includes(key)
  )
})
</script>
