<template>
  <CustomCard title="基础">
    <u-cascade v-model="cascade" :options="data" :labelKey="'name'" :valueKey="'id'"/>
  </CustomCard>
</template>
<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'

import { shallowRef } from 'vue'

const cascade = shallowRef(['1', '2', '3'])


const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = [
    { name: "烤冷面", id: 1 },
    {
      name: "手抓饼",
      id: 2,
      children: [
        {
          name: "鱼香肉丝",
          id: 3,
          children: [
            {
              name: "烤苞米",
              id: 4,
              children: [
                { name: "苞米例", id: 5 },
                { name: "吃", id: 6 },
                { name: "h", id: 7 },
              ],
            },
          ],
        },
        {
          name: "fggg",
          id: 8,
          children: [
            { name: "苞米例2", id: 9 },
            { name: "吃2", id: 10 },
            { name: "h2", id: 11 },
          ],
        },
      ],
    },
  ]
}, 2000)

</script>
