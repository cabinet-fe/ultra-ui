<template>
  <div :class="cls.e('insert-row')">
    <span :class="cls.e('popup-label')">{{ mode === 'rows' ? '插入行数' : '插入列数' }}</span>
    <u-input
      v-model="insertCount"
      size="small"
      :class="cls.e('insert-input')"
      placeholder="1-100"
      @keydown.enter.prevent="applyInsert"
    />
    <button type="button" :class="cls.e('insert-btn')" @click="applyInsert">插入</button>
    <button type="button" :class="cls.e('insert-btn')" @click="emit('close')">取消</button>
  </div>
</template>

<script lang="ts" setup>
import { UInput } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { ref } from 'vue'

import type { SheetContext } from '../../tools/context'

defineOptions({ name: 'USheetInsertCellsPopup' })

/**
 * 插入行 / 列数量面板。不参与面板事务：一次插入 = 单 undo 单元，插入即提交。
 * 弹层随 v-if 挂载 / 销毁，每次打开数量重置为 1。
 */
const props = defineProps<{
  /** 插入维度：rows = 行，cols = 列 */
  mode: 'rows' | 'cols'
  /** 工具上下文（以活动格为锚点插入） */
  context: SheetContext
}>()

const emit = defineEmits<{ close: [] }>()

const cls = bem('sheet')

/** 插入数量（字符串，提交时钳制） */
const insertCount = ref('1')

/** 数量钳制到 [1, 100] 整数（非法输入按 1），以活动格为锚点插入（一次命令 = 单 undo 单元） */
function applyInsert(): void {
  const n = Math.min(100, Math.max(1, Math.floor(Number(insertCount.value)) || 1))
  const active = props.context.getSelection().activeCell
  if (active) {
    if (props.mode === 'rows') props.context.insertRows(active.row, n)
    else props.context.insertCols(active.col, n)
  }
  emit('close')
}
</script>
