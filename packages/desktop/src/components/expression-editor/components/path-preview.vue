<template>
  <div :class="cls.e('path-preview')">
    <div :class="cls.e('path-preview-title')">变量路径</div>
    <ul :class="cls.e('path-tree')">
      <li
        v-for="(node, i) in path"
        :key="`${i}-${node.value || node.label}`"
        :class="[cls.e('path-tree-item'), bem.is('active', i === path.length - 1)]"
        :style="{ paddingLeft: `${i * 14}px` }"
      >
        <span v-if="i > 0" :class="cls.e('path-tree-branch')">└</span>
        <span :class="cls.e('path-tree-label')">{{ node.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { VariableItem } from '../../../types'

defineOptions({
  name: 'ExpressionPathPreview'
})

defineProps<{
  path: VariableItem[]
}>()

const cls = bem('expression-editor')
</script>
