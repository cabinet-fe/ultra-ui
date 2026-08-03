<template>
  <div :class="cls.e('toolbar')">
    <template v-for="(group, groupIndex) in groups" :key="group.name">
      <span v-if="groupIndex > 0" :class="cls.e('toolbar-divider')" />
      <button
        v-for="item in group.tools"
        :key="item.tool.id"
        type="button"
        :class="[cls.e('tool'), bem.is('active', item.active)]"
        :disabled="item.disabled"
        :title="item.tool.tooltip ?? item.tool.title"
        @click="emit('toolClick', item.tool)"
      >
        <component :is="item.tool.icon" v-if="item.tool.icon" :class="cls.e('tool-icon')" />
        <span>{{ item.tool.title }}</span>
      </button>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { SheetTool } from '../tools/registry'
import type { ToolGroupView } from '../use-tool-groups'

defineOptions({ name: 'USheetToolbar' })

/**
 * 工具栏（渲染 defaultToolRegistry 分组工具 + 分隔符）。
 * 纯展示组件：分组视图模型由宿主经 useToolGroups 计算传入，点击上交宿主编排。
 */
defineProps<{ groups: ToolGroupView[] }>()

const emit = defineEmits<{ toolClick: [tool: SheetTool] }>()

const cls = bem('sheet')
</script>
