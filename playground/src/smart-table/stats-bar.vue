<template>
  <div class="smart-table__stats">
    <span v-for="item in stats" :key="item.id" class="smart-table__stats-item">
      <span class="smart-table__stats-name">{{ item.name }}</span>
      <span>{{ item.text }}</span>
    </span>
    <span v-if="stats.length === 0" class="smart-table__stats-empty">暂无可统计字段</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { TableField, TableRow } from './types'

/**
 * 列底统计行：贴网格底部，按字段类型适用——文本/单选/多选/日期/成员/图片
 * 显示非空计数，数字/进度显示求和与平均；checkbox 无适用统计不展示。
 * 数据集由宿主传入（当前视图可见行），随视图过滤/排序联动。
 */
const props = defineProps<{ fields: TableField[]; rows: TableRow[] }>()

/** 数字显示值：去掉浮点噪声（最多两位小数） */
function fmt(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function statText(field: TableField): string {
  if (field.type === 'number' || field.type === 'progress') {
    const nums = props.rows
      .map((row) => row.values[field.id] ?? null)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    const sum = nums.reduce((acc, value) => acc + value, 0)
    return `合计 ${fmt(sum)} · 平均 ${nums.length > 0 ? fmt(sum / nums.length) : '—'}`
  }
  const count = props.rows.filter((row) => nonEmpty(row.values[field.id] ?? null)).length
  return `计数 ${count}`
}

function nonEmpty(value: unknown): boolean {
  return value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)
}

const stats = computed(() =>
  props.fields.flatMap((field) =>
    field.type === 'checkbox' ? [] : [{ id: field.id, name: field.name, text: statText(field) }]
  )
)
</script>

<style lang="scss" scoped>
.smart-table__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 6px 8px;
  border: 1px solid var(--u-border-color, #dcdfe6);
  border-top: none;
  border-radius: 0 0 6px 6px;
  background: var(--u-fill-color-light, #f7f8fa);
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table__stats-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.smart-table__stats-name {
  color: var(--u-text-color-main);
}

.smart-table__stats-empty {
  color: var(--u-text-color-second);
}
</style>
