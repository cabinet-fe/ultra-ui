<template>
  <div class="progressNodesDemo">
    <CustomCard title="配置">
      <div class="configRow">
        <span class="label">选中节点（check）：</span>
        <u-checkbox-group
          v-model="checkedIndexes"
          :items="checkboxItems"
          label-key="label"
          value-key="value"
        />
      </div>
      <div class="configRow">
        <span class="label">当前点击（v-model）：</span>
        <span>{{ activeNode ?? '无' }}</span>
      </div>
    </CustomCard>

    <CustomCard title="基础使用">
      <u-progress-nodes
        v-model="activeNode"
        :nodes="nodes"
        :check="isChecked"
        color-type="primary"
        max-width="520px"
      />
    </CustomCard>

    <CustomCard title="可滚动/拖拽">
      <u-progress-nodes
        :nodes="longNodes"
        :check="isChecked"
        color-type="success"
        max-width="520px"
      />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

/** 演示用节点结构（与 UProgressNodes 的 nodes 项字段一致） */
interface ProgressNodeItem {
  value: string
  label: string
}

const checkedIndexes = ref([0, 1])
const activeNode = ref<string>()

const nodes: ProgressNodeItem[] = Array.from({ length: 6 }, (_, index) => ({
  value: `node-${index + 1}`,
  label: `节点 ${index + 1}`
}))

const checkboxItems = nodes.map((node, index) => ({
  label: node.label,
  value: index
}))

const longNodes: ProgressNodeItem[] = Array.from({ length: 18 }, (_, index) => ({
  value: `long-node-${index + 1}`,
  label: `节点 ${index + 1}`
}))

const isChecked = (_node: ProgressNodeItem, index: number) => {
  return checkedIndexes.value.includes(index)
}
</script>

<style lang="scss" scoped>
.progressNodesDemo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.configRow {
  display: flex;
  align-items: center;
  gap: 12px;

  & + & {
    margin-top: 8px;
  }
}

.label {
  color: var(--text-color-second);
  font-size: 12px;
}
</style>
