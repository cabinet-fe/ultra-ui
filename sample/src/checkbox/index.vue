<template>
  <div>
    <div>
      <div>单个</div>
      <u-checkbox v-model="check"> 是否 </u-checkbox>
    </div>

    <div>
      <div>中间状态</div>
      <u-checkbox v-model="check" indeterminate> 是否 </u-checkbox>
    </div>

    <div>
      <div>多个 {{ checked }}</div>
      <u-checkbox-group
        :data="data"
        v-model="checked"
        value-key="id"
        label-key="name"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const check = ref(false)

const data = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]

const checked = ref<number[]>([])
</script>
