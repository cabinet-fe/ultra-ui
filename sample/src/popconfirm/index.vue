<template>
  <div>
    <div style="height: 85vh"></div>
    <CustomCard title="气泡">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <u-popconfirm
          title="Are you sure to delete this?"
          @confirm="confirmEvent"
          @cancel="cancelEvent"
        >
          <template #reference>
            <u-button>删除</u-button>
          </template>
        </u-popconfirm>

        <u-popconfirm
          title="Are you sure to delete this?"
          @confirm="confirmEvent"
          @cancel="cancelEvent"
        >
          <template #reference>
            <u-button>删除</u-button>
          </template>
        </u-popconfirm>
      </div>
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
    <div style="height: 85vh"></div>

  </div>
</template>

<script setup lang="ts">
import { Wps } from "icon-ultra"
import CustomCard from "../card/custom-card.vue"

const confirmEvent = () => {
  console.log("confirm")
}
const cancelEvent = () => {
  console.log("cancel")
}
</script>
