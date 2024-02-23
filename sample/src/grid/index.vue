<template>
  <div>
    <div>
      自定义栅格
      <div>
        列属性 {{ columns }} 一行列数: {{ cols }}
        <u-number-input v-model="cols" />
      </div>
    </div>
    <u-grid :cols="cols" :gap="8">
      <!-- 1121 -->
      <div
        v-for="(col, index) of columns"
        class="col-item"
        :span="col.span"
        :key="index"
      >
        跨度: {{ col.span ?? 1 }}列
      </div>
    </u-grid>

    <div>两栏布局</div>
    <u-grid cols="200px 1fr" :gap="8">
      <div class="col-item">侧边栏</div>

      <div class="col-item">内容</div>
    </u-grid>

    <div>嵌套</div>

    <u-grid :cols="['200px', '1fr']" :gap="8">
      <div class="col-item">侧边栏</div>

      <u-grid cols="200px 1fr" :gap="8">
        <div class="col-item">二级侧边栏</div>
        <div class="col-item">内容</div>
      </u-grid>
    </u-grid>

    <div>响应式布局, 基于容器自身 {{ width }}</div>
    <u-grid :gap="8" @resize="width = $event.width">
      <u-grid-item :span="2" :xs="0" v-for="i of 6">
        <div class="col-item">{{ i + 1 }}</div>
      </u-grid-item>
    </u-grid>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const columns = [
  { span: 2 },
  { span: 1 },
  {},
  {},
  { span: 'full' },
  {},
  {},
  {},
  {},
  {},
  {},
  {}
]

const cols = ref(8)

const width = ref(0)
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
