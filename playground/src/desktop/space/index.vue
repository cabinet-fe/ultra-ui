<template>
  <div>
    <CustomCard title="间距档位">
      <div class="space-demo__group">
        <u-space size="small">
          <u-button size="small">小间距</u-button>
          <u-button size="small">按钮</u-button>
          <u-button size="small">按钮</u-button>
        </u-space>
        <u-space>
          <u-button>默认间距</u-button>
          <u-button>按钮</u-button>
          <u-button>按钮</u-button>
        </u-space>
        <u-space size="large">
          <u-button size="large">大间距</u-button>
          <u-button size="large">按钮</u-button>
        </u-space>
        <u-space :size="24">
          <u-tag>自定义 24px</u-tag>
          <u-tag>标签</u-tag>
        </u-space>
      </div>
    </CustomCard>

    <CustomCard title="垂直与对齐">
      <div class="space-demo__group">
        <u-space direction="vertical">
          <span>垂直排列</span>
          <u-button>按钮</u-button>
          <u-tag>标签</u-tag>
        </u-space>
        <u-space direction="vertical" align="start">
          <span>交叉轴起始对齐</span>
          <u-button>按钮</u-button>
        </u-space>
        <u-space align="baseline">
          <span style="font-size: 24px">大字</span>
          <span>基线对齐</span>
          <u-tag>标签</u-tag>
        </u-space>
      </div>
    </CustomCard>

    <CustomCard title="自动换行">
      <u-space wrap>
        <u-tag v-for="i in 12" :key="i">标签 {{ i }}</u-tag>
      </u-space>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
</script>

<style lang="scss" scoped>
.space-demo__group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
</style>
