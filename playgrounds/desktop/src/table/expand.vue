<template>
  <CustomCard title="展开行 (嵌套子表格)">
    <u-table :data="data" :columns="columns" row-key="id" expandable style="max-height: 750px">
      <template #row:expand="{ rowData }">
        <u-table
          :data="rowData.subOrders"
          :columns="subColumns"
          row-key="id"
          :stripe="false"
          border
        >
        </u-table>
      </template>
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const columns = defineTableColumns([
  { name: '订单编号', key: 'id', width: 100 },
  { name: '客户姓名', key: 'name', width: 150 },
  { name: '下单日期', key: 'date', width: 150 },
  { name: '订单金额', key: 'amount', width: 120 },
  { name: '状态', key: 'status' }
])

const subColumns = defineTableColumns([
  { name: '商品名称', key: 'product' },
  { name: '单价', key: 'price', width: 100 },
  { name: '数量', key: 'quantity', width: 80 },
  { name: '小计', key: 'total', width: 100 }
])

const data = shallowRef(
  Array.from({ length: 1000 }).map((_, index) => ({
    id: `ORD-${String(index + 1).padStart(3, '0')}`,
    name: ['张三', '李四', '王五', '赵六', '钱七'][index % 5],
    date: `2026-01-${String((index % 30) + 1).padStart(2, '0')}`,
    amount: `￥${(Math.random() * 1000 + 100).toFixed(2)}`,
    status: ['已发货', '处理中', '已完成', '待支付'][index % 4],
    subOrders: [
      {
        id: `${index + 1}-1`,
        product: '无线耳机',
        price: '￥299.00',
        quantity: 1,
        total: '￥299.00'
      },
      {
        id: `${index + 1}-2`,
        product: '手机壳',
        price: '￥300.00',
        quantity: 1,
        total: '￥300.00'
      }
    ]
  }))
)
</script>
