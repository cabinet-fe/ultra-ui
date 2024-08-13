<template>
  <div>
    <u-grid-input separator="" @input="changePsw" />
  </div>
</template>

<script lang="ts" setup>
const changePsw = (val: string) => {
  console.log(val)
}
</script>
