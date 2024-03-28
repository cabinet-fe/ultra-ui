<template>
  <div class="box">
    <CustomCard title="禁用">
      <u-radio
        v-for="{ label, value } of items"
        v-model="radio1"
        :value="value"
        :disabled="value === '3'"
      >
        {{ label }}
      </u-radio>
    </CustomCard>

    <CustomCard title="单选框组">
      <u-radio-group :items="items" v-model="radio1" />
    </CustomCard>

    <CustomCard title="单选框组某项禁用">
      <u-radio-group :items="items" v-model="radio1" :disabled-item="item => item.value === '2'" />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const radio1 = shallowRef('1')

const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>
