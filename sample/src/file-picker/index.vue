<template>
  <div>
    <CustomCard title="基础上传">
      <u-file-picker @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
      <ul>
        <li v-for="file of files">{{ file.name }} {{ file.size }}</li>
      </ul>
    </CustomCard>

    <CustomCard title="多文件上传">
      <u-file-picker multiple @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
      <ul>
        <li v-for="file of files">{{ file.name }} {{ file.size }}</li>
      </ul>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const files = shallowRef<File[]>([])
</script>
