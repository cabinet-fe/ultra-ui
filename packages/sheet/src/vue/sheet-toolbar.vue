<template>
  <div :class="cls.e('toolbar')">
    <button
      v-if="showNav"
      type="button"
      :class="cls.e('toolbar-nav')"
      :disabled="!canPrev"
      :aria-label="'向左滚动工具栏'"
      @click="scrollByStep(-1)"
    >
      <u-icon><ArrowLeft /></u-icon>
    </button>

    <!-- 单行滚动视口：内容超出时由左右箭头导航（use-toolbar-scroll），不再换行 -->
    <div ref="scrollRef" :class="cls.e('toolbar-scroll')">
      <div ref="listRef" :class="cls.e('toolbar-list')">
        <template v-for="(group, groupIndex) in groups" :key="group.name">
          <span v-if="groupIndex > 0" :class="cls.e('toolbar-divider')" />
          <u-tip
            v-for="item in group.tools"
            :key="item.tool.id"
            :content="item.tool.tooltip ?? item.tool.title"
            trigger="hover"
            direction="bottom"
            :show-delay="400"
            :disabled="item.disabled"
          >
            <button
              type="button"
              :class="[cls.e('tool'), bem.is('active', item.active)]"
              :data-tool-id="item.tool.id"
              :disabled="item.disabled"
              :title="item.tool.tooltip ?? item.tool.title"
              @click="emit('toolClick', item.tool)"
            >
              <component :is="item.tool.icon" v-if="item.tool.icon" :class="cls.e('tool-icon')" />
              <span v-else>{{ item.tool.title }}</span>
            </button>
          </u-tip>
        </template>
      </div>
    </div>

    <button
      v-if="showNav"
      type="button"
      :class="cls.e('toolbar-nav')"
      :disabled="!canNext"
      :aria-label="'向右滚动工具栏'"
      @click="scrollByStep(1)"
    >
      <u-icon><ArrowRight /></u-icon>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@veltra/desktop'
import { ArrowLeft, ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { toRef, useTemplateRef } from 'vue'

import type { SheetTool } from '../tools/registry'
import type { ToolGroupView } from '../use-tool-groups'
import { useToolbarScroll } from './use-toolbar-scroll'

defineOptions({ name: 'USheetToolbar' })

/**
 * 工具栏（渲染 defaultToolRegistry 分组工具 + 分隔符，单行溢出滚动）。
 * 纯展示：有 icon 时只渲染图标（title/tooltip 经 UTip + 原生 title 兜底）；
 * 无 icon 时回落文字按钮（自定义工具兼容）。
 * 内容超出视口时显示左右箭头（点击步进滚动、滚轮横滚），不换行挤压 grid。
 */
const props = defineProps<{ groups: ToolGroupView[] }>()

const emit = defineEmits<{ toolClick: [tool: SheetTool] }>()

const cls = bem('sheet')

// ─── 溢出滚动（箭头显隐 / 步进 / 滚轮横滚）────────────────────

const scrollRef = useTemplateRef<HTMLElement>('scrollRef')
const listRef = useTemplateRef<HTMLElement>('listRef')
const { showNav, canPrev, canNext, scrollByStep } = useToolbarScroll({
  viewportRef: scrollRef,
  listRef,
  content: toRef(props, 'groups')
})
</script>
