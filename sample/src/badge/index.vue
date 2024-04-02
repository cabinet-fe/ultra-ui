<template>
  <div>
    <div class="badge-demo">
      <u-badge :value="5">
        <u-button>more</u-button>
      </u-badge>
      <u-badge :value="10" type="primary">
        <u-button>primary</u-button>
      </u-badge>
      <u-badge :value="15" type="warning">
        <u-button>warning</u-button>
      </u-badge>
      <u-badge :value="120" color="green">
        <u-button>color</u-button>
      </u-badge>
      <u-badge dot>
        未读消息
      </u-badge>
      <u-badge :value="120" hidden>
        <u-button>hidden</u-button>
      </u-badge>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.badge-demo {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
