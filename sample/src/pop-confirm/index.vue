<template>
  <div>
    <CustomCard title="气泡">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <u-pop-confirm
          title="Are you sure to delete this?"
          @confirm="confirmEvent"
          @cancel="cancelEvent"
        >
          <template #reference>
            <u-button>删除</u-button>
          </template>
        </u-pop-confirm>

        <u-pop-confirm
          title="Are you sure to delete this?"
          @confirm="confirmEvent"
          @cancel="cancelEvent"
        >
          <template #reference>
            <u-button>删除</u-button>
          </template>
        </u-pop-confirm>
      </div>
    </CustomCard>
    <CustomCard title="自定义文字、图标">
      <u-pop-confirm
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
      </u-pop-confirm>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { Wps } from 'icon-ultra'
import CustomCard from '../card/custom-card.vue'

const confirmEvent = () => {
  console.log('confirm')
}
const cancelEvent = () => {
  console.log('cancel')
}
</script>
