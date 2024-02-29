<template>
  <div>
    <div></div>

    <u-card>
      <u-card-header>
        <h3>
          <span style="vertical-align: middle">自定义栅格 列数: </span>
          <u-number-input :step="1" :min="1" v-model="cols" />
        </h3>
      </u-card-header>
      <u-card-content>
        <u-grid :cols="cols" :gap="8">
          <div v-for="i of 12" class="col-item" :key="i">
            {{ i }}
          </div>
        </u-grid>
      </u-card-content>
    </u-card>

    <br />
    <br />

    <u-card>
      <u-card-header>
        <h3>
          基于容器自身的响应式布局。改变浏览器尺寸查看， 当前尺寸:{{
            point?.name
          }}
        </h3>
      </u-card-header>

      <u-card-content>
        <u-grid :gap="8" :cols="24" @breakpoint-change="point = $event">
          <u-grid-item
            :span="{ default: 4, xs: 12, sm: 8, md: 6 }"
            class="col-item"
            v-for="i of 6"
            :key="i"
          >
            {{ i }}
          </u-grid-item>
        </u-grid>
      </u-card-content>
    </u-card>
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
