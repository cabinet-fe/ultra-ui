<template>
  <div>
    <CustomCard title="气泡">
     
    </CustomCard>
    <u-popconfirm title="确定删除吗？" >
        <template #reference>
          <p>删除</p>
        </template>
      </u-popconfirm>
  </div>
</template>

<script setup lang="ts">
import CustomCard from "../card/custom-card.vue"
</script>
