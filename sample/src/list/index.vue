<template>
  <div class="list-box">
    <CustomCard title="基础使用">
      <u-list :data="listData" style="height: 400px" v-slot="{ item }">
        <u-list-item> {{ item.title }}</u-list-item>
      </u-list>
    </CustomCard>

    <CustomCard title="单选">
      <u-list :data="listData" style="height: 400px" v-slot="{ item }">
        <u-list-item @click="console.log(item)"> {{ item.title }}</u-list-item>
      </u-list>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'

const listData = Array.from({ length: 50 }).map((_, i) => ({
  title: `列表项${i}`
}))
</script>

<style lang="scss" scoped></style>
