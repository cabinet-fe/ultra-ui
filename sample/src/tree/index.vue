<template>
  <UTree :data="data" label-key="id" value-key="id" />
</template>

<script lang="ts" setup>
const data = [{ id: 1 }, { id: 2, children: [{ id: 3 }] }]
</script>

<style lang="scss" scoped></style>
