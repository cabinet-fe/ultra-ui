<template>
  <thead :class="cls.e('header')">

  </thead>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'

const { cls } = inject(TableDIKey)!
</script>
