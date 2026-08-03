<template>
  <div :class="cls.e('find-row')">
    <u-input
      v-model="findQuery"
      :placeholder="'查找内容'"
      size="small"
      :class="cls.e('find-input')"
      @keydown="handleFindKeydown"
    />
    <span :class="cls.e('find-count')">{{ findCountText }}</span>
    <button
      type="button"
      :class="cls.e('find-nav')"
      :disabled="!canFind"
      title="上一个（Shift+Enter）"
      @click="findPrevious"
    >
      ↑
    </button>
    <button
      type="button"
      :class="cls.e('find-nav')"
      :disabled="!canFind"
      title="下一个（Enter）"
      @click="findForward"
    >
      ↓
    </button>
    <button type="button" :class="cls.e('find-close')" title="关闭" @click="emit('close')">
      ✕
    </button>
  </div>
  <div :class="cls.e('find-row')">
    <u-input
      v-model="findReplace"
      placeholder="替换为"
      size="small"
      :class="cls.e('find-input')"
      @keydown="handleFindKeydown"
    />
    <button
      type="button"
      :class="cls.e('find-btn')"
      :disabled="!canReplace"
      @click="replaceCurrent"
    >
      替换
    </button>
    <button type="button" :class="cls.e('find-btn')" :disabled="!canReplace" @click="replaceAll">
      全部替换
    </button>
  </div>
  <div :class="cls.e('find-row')">
    <label :class="cls.e('find-option')">
      <input v-model="caseSensitive" type="checkbox" />区分大小写
    </label>
    <label :class="cls.e('find-option')">
      <input v-model="wholeCell" type="checkbox" />整格匹配
    </label>
    <label :class="cls.e('find-option')">
      查找
      <select v-model="searchIn" :class="cls.e('find-select')">
        <option value="value">按显示值</option>
        <option value="formula">按公式</option>
      </select>
    </label>
  </div>
</template>

<script lang="ts" setup>
import { UInput } from '@veltra/desktop'
import { bem } from '@veltra/utils'

import type { Sheet } from '../../core/sheet'
import type { SheetContext } from '../../tools/context'
import { useFindReplace } from '../use-find-replace'

defineOptions({ name: 'USheetFindPopup' })

/**
 * 查找条（关键词 / 上一个 / 下一个 / 命中计数 / 关闭 + 替换 / 全部替换）。
 * 不参与面板事务：每次替换独立为一个 undo 单元；全部替换 = 一次批量 = 单 undo 单元。
 * 弹层随 v-if 挂载 / 销毁，每次打开都是全新状态（关键词清空）。
 */
const props = defineProps<{
  /** 目标 sheet（弹层存活期间固定；tab 切换会关闭弹层） */
  sheet: Sheet
  /** 工具上下文（命中定位与替换写入入口） */
  context: SheetContext
}>()

const emit = defineEmits<{ close: [] }>()

const cls = bem('sheet')

const {
  findQuery,
  findReplace,
  caseSensitive,
  wholeCell,
  searchIn,
  canFind,
  canReplace,
  findCountText,
  findForward,
  findPrevious,
  handleFindKeydown,
  replaceCurrent,
  replaceAll
} = useFindReplace({ getSheet: () => props.sheet, context: props.context })
</script>
