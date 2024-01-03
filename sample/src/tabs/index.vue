<template>
  <div>
    <u-button v-for="item in positions" @click="setPosition(item)">{{
      item
    }}</u-button>
  </div>

  <div class="wrapper">
    <u-tabs :items="items" v-model="active" :position="tabPosition" closable>
    <template #赵-label>+赵</template>
    <template #赵
      >第一页xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</template
    >
    <template #钱
      >第二页xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</template
    >
    <template #孙 v-if="tabPosition === 'right'">第三页xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</template>
  </u-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let items = ref(['赵', '钱', '孙', '李'])

const active = ref('赵')

const positions = ['top', 'bottom', 'left', 'right']

let tabPosition: any = ref('top')

const setPosition = (position: any) => {
  tabPosition.value = position
}
</script>

<style lang="scss" scoped>
.wrapper {
  border: 2px solid gold;
  width: 500px;
  height: 400px;
}
</style>