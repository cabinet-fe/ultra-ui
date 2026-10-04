<template>
  <div>
    <CustomCard title="基本用法">
      <u-carousel v-model:active-index="active" arrows>
        <u-carousel-item v-for="page in 4" :key="page">
          <div class="carousel-demo__page" :style="{ background: PAGE_COLORS[page - 1] }">
            第 {{ page }} 页
          </div>
        </u-carousel-item>
      </u-carousel>
      <span class="carousel-demo__value">当前页：{{ active + 1 }}（圆点与箭头均可切换）</span>
    </CustomCard>

    <CustomCard title="自动播放">
      <u-carousel autoplay :interval="2000" arrows>
        <u-carousel-item v-for="page in 4" :key="page">
          <div class="carousel-demo__page" :style="{ background: PAGE_COLORS[page - 1] }">
            第 {{ page }} 页
          </div>
        </u-carousel-item>
      </u-carousel>
      <span class="carousel-demo__value">每 2 秒切到下一页，末页后循环回首页</span>
    </CustomCard>

    <CustomCard title="非循环">
      <u-carousel v-model:active-index="bounded" :loop="false" arrows>
        <u-carousel-item v-for="page in 3" :key="page">
          <div class="carousel-demo__page" :style="{ background: PAGE_COLORS[page - 1] }">
            第 {{ page }} 页
          </div>
        </u-carousel-item>
      </u-carousel>
      <span class="carousel-demo__value">首 / 末页处对应箭头禁用</span>
    </CustomCard>

    <CustomCard title="隐藏指示器">
      <u-carousel :dots="false" autoplay :interval="3000">
        <u-carousel-item v-for="page in 3" :key="page">
          <div class="carousel-demo__page" :style="{ background: PAGE_COLORS[page - 1] }">
            第 {{ page }} 页
          </div>
        </u-carousel-item>
      </u-carousel>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const PAGE_COLORS = ['#2b587c', '#4d7ea8', '#7aa5c2', '#a8c4d8']

const active = shallowRef(0)
const bounded = shallowRef(0)
</script>

<style lang="scss" scoped>
.carousel-demo__page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  font-size: 24px;
  color: #fff;
}

.carousel-demo__value {
  display: block;
  margin-top: 8px;
}
</style>
