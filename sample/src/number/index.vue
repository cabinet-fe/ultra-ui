<template>
  <div>
    <div>
      数字动画:
      <div
        style="
          padding: 4px;
          background-color: cadetblue;
          color: #fff;
          text-align: center;
          display: inline-block;
          margin: 0 10px;
        "
      >
        <u-number :value="number" tween :precision="2" />
      </div>
      <u-button type="primary" plain size="small" @click="number -= 1000">
        -1000
      </u-button>
      <u-button type="primary" plain size="small" @click="number += 1000">
        +1000
      </u-button>
    </div>

    <div>
      货币:

      <u-number :value="number" format="currency" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const number = ref(0)
</script>
