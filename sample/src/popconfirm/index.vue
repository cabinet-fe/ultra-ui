<template>
  <div>
    <CustomCard title="气泡">
      <u-popconfirm
        title="Are you sure to delete this?"
        @confirm="confirmEvent"
        @cancel="cancelEvent"
      >
        <template #reference>
          <u-button>删除</u-button>
        </template>
      </u-popconfirm>
    </CustomCard>
    <CustomCard title="自定义文字、图标">
      <u-popconfirm
        title="自定义文字、图标"
        @confirm="confirmEvent"
        @cancel="cancelEvent"
        confirm-text="继续"
        cancel-text="结束"
        :icon="Wps"
      >
        <template #reference>
          <u-button>删除</u-button>
        </template>
      </u-popconfirm>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { Wps } from "icon-ultra";
import CustomCard from "../card/custom-card.vue"

const confirmEvent = () => {
  console.log("confirm")
}
const cancelEvent = () => {
  console.log("cancel")
}
</script>
