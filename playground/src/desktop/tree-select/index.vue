<template>
  <div>
    <CustomCard title="菜单选择器单选、禁用某项、过滤、选择完选项值自动关闭弹窗">
      {{ { treeSelect } }}
      <u-tree-select
        v-model="treeSelect"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
        :disabledNode="disabledNode"
        filterable
        @change="handleChange"
        v-slot="{ data }"
      >
        {{ data.name }} {{ data.id }}
      </u-tree-select>

      <u-card-action>
        <u-button @click="handleChangeSelect">改值</u-button>
      </u-card-action>
    </CustomCard>

    <CustomCard title="菜单选择器自定义回显内容">
      <u-tree-select
        v-model="treeSelect"
        style="width: 240px"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
        :disabledNode="disabledNode"
        filterable
        closeOnSelect
        min-width="400px"
        @change="handleChange"
      ></u-tree-select>

      <u-card-action>
        <u-button @click="handleChangeSelect">改值</u-button>
      </u-card-action>
    </CustomCard>

    <CustomCard width="480px" title="同步冗余文案（@update:text）">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px">
        v-model 绑定 code；展示文案由 data 推导，经 @update:text 写入冗余 text（勿再
        v-model:text）。预设 code 会在回显时把旧文案同步为最新 label。
      </div>
      <u-tree-select
        v-model="dictForm.code"
        style="width: 280px"
        :data="dictTreeData"
        expand-all
        clearable
        @update:text="dictForm.text = $event"
      />
      <div style="margin-top: 12px; display: flex; gap: 24px; font-size: 13px">
        <div>code：{{ dictForm.code ?? '—' }}</div>
        <div>text：{{ dictForm.text ?? '—' }}</div>
      </div>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const treeSelect = shallowRef()

const disabledNode = (_data, node) => {
  return !!node.children?.length
}

const data = shallowRef<any[]>([
  { name: '烤冷面', id: 1 },
  {
    name: '手抓饼',
    id: 2,
    children: [
      {
        name: '鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝鱼香肉丝',
        id: 3,
        children: [
          {
            name: '烤苞米',
            id: 4,
            children: [
              { name: '苞米例', id: 5 },
              { name: '吃', id: 6 },
              { name: 'h', id: 7 }
            ]
          }
        ]
      },
      {
        name: 'fggg',
        id: 8,
        children: [
          { name: '苞米例2', id: 9 },
          { name: '吃2', id: 10 },
          { name: 'h2', id: 11 }
        ]
      }
    ]
  },
  { name: '烤冷面12', id: 12 },
  { name: '烤冷面13', id: 13 },
  { name: '烤冷面14', id: 14 }
])

/** 字典回显：code 已匹配 data，text 初始为旧文案，组件会 @update:text 同步最新 label */
const dictForm = reactive<{ code?: string; text?: string }>({ code: 'chaoyang', text: '旧文案' })

const dictTreeData = [
  {
    label: '北京',
    value: 'beijing',
    children: [
      { label: '朝阳区（最新）', value: 'chaoyang' },
      { label: '海淀区（最新）', value: 'haidian' }
    ]
  },
  { label: '上海', value: 'shanghai', children: [{ label: '浦东新区（最新）', value: 'pudong' }] }
]

setTimeout(() => {
  // data.value = Array.from({ length: 3000 }, (_, index) => ({ name: `烤冷面${index}`, id: index }))
}, 1000)

const handleChange = (val, selected) => {
  console.log(val, selected)
}

function handleChangeSelect() {
  treeSelect.value = 2
}
</script>
