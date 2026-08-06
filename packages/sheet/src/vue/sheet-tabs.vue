<template>
  <div :class="cls.e('tabs')">
    <button
      v-show="showNav"
      type="button"
      :class="cls.e('tabs-nav')"
      :disabled="!canPrev"
      title="向左滚动"
      @click="scrollByStep(-1)"
    >
      <u-icon><ArrowLeft /></u-icon>
    </button>
    <div ref="tabsViewportRef" :class="cls.e('tabs-viewport')">
      <div ref="tabsListRef" :class="cls.e('tabs-list')">
        <div
          v-for="(sheet, index) in sheetList"
          :key="sheet"
          :class="[cls.e('tab'), bem.is('active', index === activeIndex)]"
          title="右键重命名 / 删除"
          @click="handleTabClick(index)"
          @contextmenu.prevent="handleTabContextMenu($event, sheet, index)"
        >
          <input
            v-if="renamingIndex === index"
            ref="renameInputRef"
            v-model="renameDraft"
            :class="cls.e('tab-rename-input')"
            :maxlength="31"
            @click.stop
            @keydown.enter.prevent="commitRename"
            @keydown.esc.prevent="cancelRename"
            @blur="commitRename"
          />
          <span v-else>{{ sheet.name }}</span>
        </div>
      </div>
    </div>
    <button
      v-show="showNav"
      type="button"
      :class="cls.e('tabs-nav')"
      :disabled="!canNext"
      title="向右滚动"
      @click="scrollByStep(1)"
    >
      <u-icon><ArrowRight /></u-icon>
    </button>
    <button type="button" :class="cls.e('tab-add')" title="添加工作表" @click="handleAddSheet">
      +
    </button>
  </div>
</template>

<script lang="ts" setup>
import { contextmenu, message, messageConfirm, UIcon } from '@veltra/desktop'
import { ArrowLeft, ArrowRight } from '@veltra/icons/normal'
import type { Sheet } from '@veltra/sheet-core/core/sheet'
import type { Workbook } from '@veltra/sheet-core/core/workbook'
import { bem } from '@veltra/utils'
import { nextTick, ref, toRef, useTemplateRef } from 'vue'

import { useSheetTabsBar } from './use-sheet-tabs-bar'

defineOptions({ name: 'USheetTabs' })

/**
 * 底部 sheet tabs（可滚动视口 + 左右导航；「+」钉在视口外）：
 * - tab 点击切换；末尾「+」addSheet + 自动激活新表（激活事件驱动 grid 重建）
 * - tab 右键菜单「重命名 / 删除」：重命名进入行内输入（Enter 提交、Esc 取消、失焦提交；
 *   冲突提示且不写入），删除二次确认（最后一个 sheet 的删除项禁用）
 * - sheet 增删改名是工作簿级结构操作（不走 undo），直接调用 Workbook——
 *   不经 SheetContext（见 AGENTS.md 门面边界）；UI 刷新由 workbook 事件驱动
 */
const props = defineProps<{ workbook: Workbook; sheetList: Sheet[]; activeIndex: number }>()

const cls = bem('sheet')

// ─── 可滚动视口（导航显隐 / 步进滚动 / 活动 tab 滚入视野）────────

const tabsViewportRef = useTemplateRef<HTMLElement>('tabsViewportRef')
const tabsListRef = useTemplateRef<HTMLElement>('tabsListRef')
const { showNav, canPrev, canNext, scrollByStep } = useSheetTabsBar({
  viewportRef: tabsViewportRef,
  listRef: tabsListRef,
  sheetList: toRef(props, 'sheetList'),
  activeIndex: toRef(props, 'activeIndex')
})

function handleTabClick(index: number): void {
  if (index === props.activeIndex) return
  const sheet = props.sheetList[index]
  if (sheet) props.workbook.activateSheet(sheet.name)
}

/** 「+」添加 sheet：自动激活新表（激活事件驱动 grid 重建） */
function handleAddSheet(): void {
  const sheet = props.workbook.addSheet()
  props.workbook.activateSheet(sheet.name)
}

// ─── tab 右键菜单（重命名 / 删除）────────────────────────────

/** 正在行内重命名的 tab 下标（-1 = 无） */
const renamingIndex = ref(-1)
const renameDraft = ref('')
// 输入框在 v-for 内：useTemplateRef 收集为数组（Vue 3.5 v-for ref 语义）
const renameInputRef = useTemplateRef<HTMLInputElement[]>('renameInputRef')

function handleTabContextMenu(event: MouseEvent, sheet: Sheet, index: number): void {
  // 右键菜单操作的是该 tab，不切换激活（与 Excel 一致：菜单动作不影响激活）
  contextmenu.pop({
    mousePosition: { x: event.clientX, y: event.clientY },
    width: 160,
    menus: [
      { label: '重命名', callback: () => startRename(index) },
      {
        label: '删除',
        disabled: props.sheetList.length <= 1,
        callback: () => confirmRemoveSheet(sheet)
      }
    ]
  })
}

/** 进入行内重命名（预填当前名并全选） */
function startRename(index: number): void {
  renamingIndex.value = index
  renameDraft.value = props.sheetList[index]?.name ?? ''
  // 等输入框渲染后聚焦全选
  nextTick(() => renameInputRef.value?.[0]?.select())
}

/** 提交重命名：空名 / 重名（含大小写变体）由 Workbook 拒绝，提示且不写入 */
function commitRename(): void {
  const index = renamingIndex.value
  if (index < 0) return
  renamingIndex.value = -1
  const sheet = props.sheetList[index]
  if (!sheet) return
  const next = renameDraft.value.trim()
  if (next === '' || next === sheet.name) return
  if (!props.workbook.renameSheet(sheet.name, next)) {
    message.warn(`无法重命名：名称“${next}”无效或已被占用`)
  }
}

function cancelRename(): void {
  renamingIndex.value = -1
}

/** 删除确认（message-confirm）；最后一个 sheet 在菜单层已禁用，这里再兜底 */
function confirmRemoveSheet(sheet: Sheet): void {
  if (props.workbook.sheetCount <= 1) return
  messageConfirm.danger(`确定删除工作表“${sheet.name}”吗？删除后不可恢复。`, {
    confirmButtonText: '删除',
    onClosed: (action) => {
      if (action !== 'confirm') return
      props.workbook.removeSheet(sheet.name)
    }
  })
}
</script>
