<template>
  <ul class="list">
    <li class="item" v-for="(position, index) in positions">
      <u-button type="primary">{{ position }}</u-button>
      <u-tabs :items="items" v-model="active[index]" :position="position" closable>
        <template v-for="item in items" #[item]>{{ item }}</template>
      </u-tabs>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let items = ref(['TabOne', 'TabTwo', 'TabThree', 'TabFour'])

const active = ref<string[]>(['TabOne', 'TabOne', 'TabOne', 'TabOne'])

const positions: any[] = ['top', 'bottom', 'left', 'right']

let tabPosition: any = ref('top')

</script>

<style lang="scss" scoped>
.list {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .item {
    width: 600px;
    height: 400px;
    border: 1px solid #eee;
    margin: 20px;
  }
}
</style>
