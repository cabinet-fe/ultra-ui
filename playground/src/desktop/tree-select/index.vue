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

    <CustomCard width="400px" title="远程搜索（data 传函数）">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px">
        data 传入函数时自动启用过滤：输入触发远程查询（200ms 防抖），初始以空串调用一次
      </div>
      <u-tree-select v-model="remoteSelected" :data="remoteDataGetter" />
      <div style="margin-top: 12px; font-size: 13px">选中：{{ remoteSelected ?? '—' }}</div>
    </CustomCard>

    <CustomCard width="480px" title="同步冗余文案（v-model:text）">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px">
        v-model 绑定 code，v-model:text 绑定冗余文案：命中时组件把旧文案同步为最新
        label；未命中时保留 text 作兜底（见下）。
      </div>
      <u-tree-select
        v-model="dictForm.code"
        v-model:text="dictForm.text"
        style="width: 280px"
        :data="dictTreeData"
        expand-all
        clearable
      />
      <div style="margin-top: 12px; display: flex; gap: 24px; font-size: 13px">
        <div>code：{{ dictForm.code ?? '—' }}</div>
        <div>text：{{ dictForm.text ?? '—' }}</div>
      </div>
    </CustomCard>

    <CustomCard width="480px" title="未命中选项时的兜底文案（text）">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px">
        modelValue 不在 data 中时（如节点已被删除的回显数据）展示 text，避免露出编码。
        update:text：未命中且传了 text 时不发出（父级文案即事实来源），未传 text 时发出
        undefined；readonly 下不发出。
      </div>
      <u-tree-select
        v-model="missingForm.code"
        v-model:text="missingForm.text"
        style="width: 280px"
        :data="dictTreeData"
        expand-all
        clearable
      />
      <div style="margin-top: 12px; display: flex; gap: 24px; font-size: 13px">
        <div>code：{{ missingForm.code ?? '—' }}</div>
        <div>text：{{ missingForm.text ?? '—' }}</div>
      </div>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { sleep } from '@cat-kit/core'
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

/** 兜底回显：code 不在 data 中，展示 text 兜底文案 */
const missingForm = reactive<{ code?: string; text?: string }>({
  code: 'removed',
  text: '已删除的节点'
})

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

/** 远程搜索：模拟 300ms 网络延迟，按 label 过滤并保留命中节点的祖先链 */
const remoteSelected = shallowRef()

const remoteDataGetter = async (qs: string) => {
  await sleep(300)
  if (!qs) return dictTreeData

  const filter = (nodes: any[]): any[] =>
    nodes
      .map((node) => {
        const children = node.children ? filter(node.children) : undefined
        if (node.label.includes(qs) || children?.length) {
          return children ? { ...node, children } : node
        }
        return null
      })
      .filter(Boolean)

  return filter(dictTreeData)
}

function handleChangeSelect() {
  treeSelect.value = 2
}
</script>
