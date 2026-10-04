<template>
  <div class="smart-table">
    <!-- 顶栏：标题 + 保存状态 + 视图切换 + 行/字段管理入口 -->
    <div class="smart-table__bar">
      <span class="smart-table__title">智慧表格</span>
      <u-segment v-model="view" :items="viewItems" />
      <span class="smart-table__status" :data-state="saveState">
        <span class="smart-table__status-dot" />
        {{ statusText }}
      </span>
      <u-button class="smart-table__bar-btn" @click="appendRow()">新增行</u-button>
      <u-button class="smart-table__bar-btn" type="primary" @click="fieldDialogOpen = true">
        新增字段
      </u-button>
    </div>

    <KanbanView v-if="view === 'kanban'" :fields="doc?.fields ?? []" :rows="doc?.rows ?? []" />

    <!-- 网格视图：u-sheet 表格主体（虚拟滚动、选区键盘、undo/redo、拖拽调宽），
         工具栏 / 公式栏 / sheet 标签栏在多维表格形态下全部隐藏 -->
    <div v-else ref="sheetHostRef" class="smart-table__grid">
      <u-sheet
        v-if="doc"
        ref="sheetRef"
        :workbook="workbook"
        :rows="gridRows"
        :cols="gridCols"
        :header="header"
        :editors="editors"
        :resolve-cell-renderer="resolveCellRenderer"
        :show-toolbar="false"
        :show-formula-bar="false"
        :show-tabs="false"
        class="smart-table__sheet"
      />
    </div>

    <FieldDialog v-model="fieldDialogOpen" @confirm="addField" />
  </div>
</template>

<script lang="ts" setup>
import type { SheetExposed } from '@veltra/sheet'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'

import FieldDialog from './field-dialog.vue'
import KanbanView from './kanban-view.vue'
import { useSmartSheet } from './use-smart-sheet'
import { useTableDoc } from './use-table-doc'

/**
 * 智慧表格演示页（v2）：网格视图以 `u-sheet` 为表格主体（类型化列渲染、列头
 * 字段名 + 类型图标 + 配置入口、行头行号 + 勾选、拖拽调宽、虚拟滚动、undo/redo），
 * doc ↔ Sheet 双向数据流与编辑持久化见 `use-smart-sheet` / `use-table-doc`；
 * 看板视图沿用 `kanban-view`。数据契约见 `types.ts` 与参考服务 `server/smart-table.ts`。
 */
const { doc, saveState, load, addRow: appendRow, addField } = useTableDoc()

const sheetRef = useTemplateRef<SheetExposed>('sheetRef')
const sheetHostRef = useTemplateRef<HTMLElement>('sheetHostRef')

const { workbook, header, editors, resolveCellRenderer, gridRows, gridCols, bindGrid } =
  useSmartSheet({
    doc,
    onFieldConfig,
    getGrid: () => sheetRef.value?.getGrid(),
    getHost: () => sheetHostRef.value ?? null
  })

/** 列头配置入口点击：预留事件，P6 接列设置面板（改名 / 改类型 / 选项管理） */
function onFieldConfig(): void {}

/** 视图切换（本地记忆即可，不持久化） */
type ViewMode = 'table' | 'kanban'
const view = ref<ViewMode>('table')
const viewItems = [
  { label: '表格', value: 'table' },
  { label: '看板', value: 'kanban' }
]

const statusText = computed(
  () =>
    ({ saved: '已保存', dirty: '待保存', saving: '保存中…', error: '保存失败' })[saveState.value]
)

const fieldDialogOpen = ref(false)

// 视图切回网格：u-sheet 重新挂载，行头勾选覆盖层随新网格实例重绑
watch(view, async (mode) => {
  if (mode === 'table') {
    await nextTick()
    bindGrid()
  }
})

onMounted(() => void load())
</script>

<style lang="scss" scoped>
.smart-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

.smart-table__bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.smart-table__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-main);
}

.smart-table__status {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.smart-table__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--u-color-info);
}

.smart-table__status[data-state='saved'] .smart-table__status-dot {
  background: var(--u-color-success);
}

.smart-table__status[data-state='dirty'] .smart-table__status-dot,
.smart-table__status[data-state='saving'] .smart-table__status-dot {
  background: var(--u-color-warning);
}

.smart-table__status[data-state='error'] .smart-table__status-dot {
  background: var(--u-color-danger, #f04438);
}

.smart-table__bar-btn {
  flex: none;
}

/* 主内容区不提供确定高度（页面随窗口滚动），网格给固定高度（同 sheet 演示页先例） */
.smart-table__grid {
  height: 560px;
}

.smart-table__sheet {
  height: 100%;
}
</style>

<style lang="scss">
/* 网格 DOM 覆盖层（非 scoped）：列头元素与行头勾选框由 use-smart-sheet 以原生
   DOM 创建并挂进 u-sheet 网格容器，scoped 样式无法命中，统一在此收口。
   覆盖层本身 pointer-events: none，画布交互（表头拖选、列宽拖拽、行选择）不受影响。 */

.smart-table-col-head {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 6px;
  box-sizing: border-box;
  font-size: 12px;
  overflow: hidden;

  &__icon {
    flex: none;
    display: inline-flex;
    width: 14px;
    height: 14px;
    color: var(--u-text-color-second);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: var(--u-text-color-title);
  }

  &__config {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--u-text-color-second);
    pointer-events: auto;
    cursor: pointer;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: var(--u-fill-color, #eef0f3);
      color: var(--u-text-color-main);
    }
  }
}

.smart-table-row-check {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 5; /* 低于导入遮罩（10），高于画布层 */
  pointer-events: none;

  &__box {
    position: absolute;
    left: 0;
    width: 26px;
    padding: 0;
    border: none;
    background: transparent;
    pointer-events: auto;
    cursor: pointer;

    /* 14px 勾选框视觉（居左，避开画布行号绘制区） */
    &::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 50%;
      width: 14px;
      height: 14px;
      box-sizing: border-box;
      transform: translateY(-50%);
      /* 与 cell-renderers 画布色板同源的固定色（画布行号同为固定色系） */
      border: 1.5px solid #c4cad2;
      border-radius: 3px;
      background: #fff;
    }

    &.is-checked::before {
      border-color: var(--u-color-primary);
      background: var(--u-color-primary);
    }

    &.is-checked::after {
      content: '';
      position: absolute;
      left: 10.5px;
      top: 50%;
      width: 4px;
      height: 8px;
      border: solid #fff;
      border-width: 0 1.5px 1.5px 0;
      transform: translateY(-62%) rotate(45deg);
    }
  }
}
</style>
