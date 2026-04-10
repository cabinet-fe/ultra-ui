<template>
  <div>
    <CustomCard title="单个">
      <u-checkbox v-model="check"> 是否 </u-checkbox>
    </CustomCard>

    <CustomCard title="复选按钮">
      <u-checkbox-button v-model="check" type="success"> 深度思考(R1) </u-checkbox-button>
    </CustomCard>

    <CustomCard title="中间状态">
      <u-checkbox v-model="check" indeterminate> 是否 </u-checkbox>
    </CustomCard>

    <CustomCard title="复选框组">
      <div>多个 {{ checked }}</div>
      <u-checkbox-group :items="data" v-model="checked" value-key="id" label-key="name" />
    </CustomCard>
    <CustomCard title="复选框组block显示">
      <u-checkbox-group :items="data" block v-model="checked" value-key="id" label-key="name" />
    </CustomCard>

    <CustomCard title="禁用">
      <u-checkbox-group :items="data" v-model="checked" value-key="id" label-key="name" disabled />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

const check = ref(false)

const data = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]

const checked = ref<number[]>([])
</script>
