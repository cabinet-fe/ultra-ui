<template>
  <div class="progressDemo">
    <CustomCard title="条形进度条">
      <u-progress
        v-for="(item, index) in list"
        :key="index"
        :percentage="item.percentage"
        :type="item.type"
      />
    </CustomCard>

    <CustomCard title="圆形进度条">
      <u-progress
        v-for="(item, index) in list"
        :key="index"
        :percentage="item.percentage"
        :type="item.type"
        is-circle
      />

      <u-progress is-circle status="success" :percentage="100" type="success" />

      <u-progress is-circle status="danger" :percentage="50" type="danger" />

      <u-progress is-circle status="warning" :percentage="70" type="warning" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import CustomCard from '../card/custom-card.vue'

const list = ref([
  { percentage: 10, type: 'primary' },
  { percentage: 20, type: 'info' },
  { percentage: 40, type: 'success' },
  { percentage: 60, type: 'warning' },
  { percentage: 80, type: 'danger' }
])
</script>

<style lang="scss" scoped>
.u-card__content {
  & > div {
    margin-bottom: 20px;
  }
}
</style>
