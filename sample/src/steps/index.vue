<template>
  <div>
    <CustomCard title="基础使用">
      <Basic />
    </CustomCard>
    <CustomCard title="插槽">
      <StepsSlot />
    </CustomCard>
    <CustomCard title="提示">
      <StepTip />
    </CustomCard>
    <CustomCard title="完整用法">
      <Full />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import CustomCard from '../card/custom-card.vue'
import Basic from './basic.vue'
import StepsSlot from './steps-slot.vue'
import Full from './full.vue'
import StepTip from './steps-tip.vue'
</script>
