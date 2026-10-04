<template>
  <div>
    <CustomCard title="容器内回到顶部（target 指定滚动容器）">
      <div ref="boxRef" class="back-top-demo__scroll">
        <p v-for="n in 24" :key="n" class="back-top-demo__line">
          容器内容第 {{ n }} 行：向下滚动超过 {{ visibilityHeight }}px
          后右下角出现按钮，点击平滑滚回顶部。
        </p>
      </div>

      <p class="back-top-demo__tip">
        target 接受元素本身或 CSS 选择器；visibility-height 越小越早出现。
      </p>
    </CustomCard>

    <CustomCard title="页面滚动出现（滚动下方长内容验证）">
      <p class="back-top-demo__tip">
        撑高本页的区块在下方；滚动整页内容即可见右下角出现按钮，点击回到顶部并触发 click 事件。
      </p>
    </CustomCard>

    <section v-for="block in longBlocks" :key="block" class="back-top-demo__block">
      长内容区块 {{ block }}：用于把演示页撑高，验证页面级回到顶部的出现与回顶。
    </section>

    <!-- 容器内：元素引用 -->
    <u-back-top :target="boxRef" :visibility-height="visibilityHeight" @click="handleClick" />

    <!-- 页面级：playground 的页面滚动容器是内容区 u-scroll（左侧导航也有一个，选择器需 .content-container 限定） -->
    <u-back-top
      target=".content-container .u-scroll__container"
      :visibility-height="400"
      @click="handleClick"
    />
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const visibilityHeight = 100

const boxRef = useTemplateRef('boxRef')

const longBlocks = Array.from({ length: 12 }, (_, i) => i + 1)

function handleClick() {
  console.log('back-top click')
}
</script>

<style scoped>
.back-top-demo__scroll {
  height: 240px;
  padding: 12px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.back-top-demo__line {
  margin: 0 0 10px;
  font-size: 13px;
}

.back-top-demo__tip {
  margin: 12px 0 0;
  font-size: 13px;
}

.back-top-demo__block {
  height: 160px;
  margin-bottom: 16px;
  padding: 16px;
  font-size: 13px;
  border: 1px dashed #c0c4cc;
  border-radius: 6px;
}
</style>
