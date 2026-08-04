<template>
  <div :class="cls.e('toolbar')">
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
</template>

<script lang="ts" setup>
import { UTip } from '@veltra/desktop'
import { bem } from '@veltra/utils'

import type { SheetTool } from '../tools/registry'
import type { ToolGroupView } from '../use-tool-groups'

defineOptions({ name: 'USheetToolbar' })

/**
 * 工具栏（渲染 defaultToolRegistry 分组工具 + 分隔符）。
 * 纯展示：有 icon 时只渲染图标（title/tooltip 经 UTip + 原生 title 兜底）；
 * 无 icon 时回落文字按钮（自定义工具兼容）。
 */
defineProps<{ groups: ToolGroupView[] }>()

const emit = defineEmits<{ toolClick: [tool: SheetTool] }>()

const cls = bem('sheet')
</script>
