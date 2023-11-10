<template>
  <div>
    <u-button v-for="item in positions" @click="setPosition(item)">{{
      item
    }}</u-button>

    <u-button
      @click="items = items.length > 1 ? ['赵'] : ['赵', '钱', '孙', '李']"
      >切换items</u-button
    >
  </div>

  <u-tabs :items="items" v-model="active" :position="tabPosition">
    <template #赵-label>+赵</template>
    <template #赵
      >第一页xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</template
    >
    <template #钱
      >第二页xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</template
    >
    <!-- <template #孙>第三页xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</template> -->
  </u-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let items = ref(['赵', '钱', '孙', '李'])

const active = ref('钱')

const positions = ['top', 'bottom', 'left', 'right']

let tabPosition: any = ref('top')

const setPosition = (position: any) => {
  tabPosition.value = position
}
</script>
