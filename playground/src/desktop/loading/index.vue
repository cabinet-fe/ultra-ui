<template>
  <div class="loading-demo">
    <!-- ======== 全量展示：5 种加载动画一览 ======== -->
    <CustomCard title="四种加载动画">
      <div class="loading-demo__grid">
        <div
          v-for="t in items"
          :key="t.value"
          class="loading-demo__cell"
          v-loading:[t.value]="true"
        >
          <span class="loading-demo__label">{{ t.label }}</span>
        </div>
      </div>
    </CustomCard>

    <!-- ======== 指令用法：表格加载覆盖 ======== -->
    <CustomCard title="v-loading 指令 — 表格加载">
      <div class="loading-demo__toolbar">
        <u-radio-group :items="items" v-model="type" />
        <u-button @click="toggle"> {{ loading ? '停止加载' : '开始加载' }} </u-button>
      </div>
      <u-table :data="data" :columns="columns" v-loading:[type]="loading" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns, vLoading } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const items = [
  { label: 'dual-ring', value: 'dual-ring' },
  { label: 'dot', value: 'dot' },
  { label: 'ring', value: 'ring' },
  { label: 'bars', value: 'bars' }
]

const type = shallowRef('spinner')
const loading = shallowRef(false)

const columns = defineTableColumns(
  [
    { name: '姓名', key: 'name', align: 'center', fixed: 'left' },
    { name: '年龄', key: 'age', fixed: 'left' },
    { name: '性别', key: 'sex', fixed: 'right' },
    {
      name: '地址',
      key: 'address',
      children: [
        { name: '省', key: 'province' },
        { name: '市', key: 'city' },
        { name: '区', key: 'area' },
        { name: '街道', key: 'street' },
        {
          name: '小区',
          key: 'community',
          fixed: 'right',
          children: [
            { name: 'a', key: 'a', fixed: 'right' },
            { name: 'b', key: 'b', fixed: 'right' }
          ]
        }
      ]
    }
  ],
  { minWidth: 180 }
)

const data = shallowRef<any>([
  {
    name: '张三',
    age: 28,
    sex: '男',
    province: '江苏',
    city: '苏州',
    area: '姑苏',
    street: '金昌',
    community: '彩香',
    a: '-',
    b: '-'
  },
  {
    name: '李四',
    age: 32,
    sex: '女',
    province: '浙江',
    city: '杭州',
    area: '西湖',
    street: '文三',
    community: '翠苑',
    a: '-',
    b: '-'
  },
  {
    name: '王五',
    age: 45,
    sex: '男',
    province: '上海',
    city: '上海',
    area: '浦东',
    street: '世纪',
    community: '陆家嘴',
    a: '-',
    b: '-'
  }
])

const toggle = () => {
  loading.value = !loading.value
}
</script>

<style scoped>
.loading-demo__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.loading-demo__cell {
  position: relative;
  height: 120px;
  border-radius: 8px;
  background: var(--u-bg-color-container);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
}

.loading-demo__label {
  font-size: 13px;
  color: var(--u-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.loading-demo__toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
</style>
