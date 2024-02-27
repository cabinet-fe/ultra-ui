<template>
  <div>
    <div>
      <h3>自定义栅格</h3>
      <div>一行列数: <u-number-input :step="1" :min="1" v-model="cols" /></div>
    </div>
    <u-grid :cols="cols" :gap="8">
      <div v-for="i of 12" class="col-item" :key="i">
        {{ i }}
      </div>
    </u-grid>

    <h3>响应式布局, 基于容器自身 {{ point }}</h3>

    <u-grid :gap="8" :cols="24" @resize="point = $event.width">
      <u-grid-item
        :span="{ default: 4, xs: 12, sm: 8, md: 6 }"
        class="col-item"
        v-for="i of 6"
        :key="i"
      >
        {{ i }}
      </u-grid-item>
    </u-grid>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const cols = ref(8)

const point = ref()
</script>

<style lang="scss" scoped>
.col-item {
  background-color: cadetblue;
  color: #fff;
  text-align: center;
  margin-bottom: 6px;
  height: 50px;
  line-height: 50px;
}
</style>
