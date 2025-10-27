<template>
  <span :class="cls.e('var-block')" @click="handleClick">
    <i :class="cls.e('var-node-icon')">@</i>
    <span>{{ currentValue }}</span>
  </span>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, useSlots } from "vue";
import { ExpressionEditorDIKey } from "../di";

defineOptions({
  name: "VariableBlock",
});

const { cls, editorProps, updateVariableNode } = inject(ExpressionEditorDIKey)!;
const slots = useSlots();
const currentValue = ref("");

onMounted(() => {
  // 获取插槽中的初始变量值
  const slotContent = slots.default?.();
  if (slotContent && slotContent[0]) {
    currentValue.value = String(slotContent[0].children || "");
  }
});

function handleClick(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  // 如果没有可用变量，直接返回
  if (!editorProps.variables || editorProps.variables.length === 0) {
    return;
  }

  const oldValue = currentValue.value;

  // 查找当前变量在列表中的索引
  const currentIndex = editorProps.variables.findIndex(
    (v) => v.value === oldValue,
  );

  // 如果找不到当前变量，从第一个开始
  const nextIndex =
    currentIndex === -1 ? 0 : (currentIndex + 1) % editorProps.variables.length;
  const nextVariable = editorProps.variables[nextIndex];

  if (nextVariable) {
    // 更新当前显示的值
    currentValue.value = nextVariable.value;

    // 通过编辑器更新节点
    updateVariableNode(oldValue, nextVariable.value);
  }
}
</script>
