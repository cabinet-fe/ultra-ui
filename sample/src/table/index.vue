<template>
  <div>
    <Base v-if="true" />
    <Full v-if="false" />
    <MergeCell v-if="false" />
  </div>
</template>

<script lang="ts" setup>
import Base from './base.vue'
import Full from './full.vue'
import MergeCell from './merge-cell.vue'
</script>
