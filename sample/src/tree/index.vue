<template>
  <div>
    <UTree :data="data" label-key="name" value-key="id" />
  </div>
</template>

<script lang="ts" setup>
const data = [
  { name: '烤冷面', id: 1 },
  {
    name: '手抓饼',
    id: 2,
    children: [
      { name: '鱼香肉丝', id: 3, children: [{name: '烤苞米', id: 4 }] }
    ]
  }
]
</script>

<style lang="scss" scoped></style>
