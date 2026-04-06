<template>
  <component v-for="node of getSlotsNodes()" :key="node.key" :is="node" />
</template>

<script lang="tsx" setup>
import type { ActionGroupProps } from '@ultra-ui/pc/types'
import { ArrowDown } from 'lucide-vue-next'
import { UIcon } from "../icon";
import { UButton } from "../button";
import { provide, type VNode } from "vue";
import { bem, extractNormalVNodes } from '@ultra-ui/core'
import { UTip } from "../tip";
import { ActionDIKey } from "./di";

defineOptions({
  name: "ActionGroup",
  inheritAttrs: false,
});

const props = withDefaults(defineProps<ActionGroupProps>(), {
  max: 3,
  loading: false,
  circle: false,
});

const cls = bem("action-group");
const actionCls = bem("action");

const slots = defineSlots<{
  default?: () => VNode[];
}>();

function getSlotsNodes() {
  const nodes = slots.default?.();

  if (!nodes) return [];
  const extractedNodes = extractNormalVNodes(nodes).filter(
    // @ts-ignore
    (node) => node.type?.name === "Action",
  );

  let normalNodes: VNode[] = [];
  let hiddenNodes: VNode[] = [];
  if (extractedNodes.length === props.max) {
    normalNodes = extractedNodes;
  } else {
    normalNodes = extractedNodes.slice(0, props.max - 1);
    hiddenNodes = extractedNodes.slice(props.max - 1);
  }

  const dropdown = hiddenNodes.length ? (
    <UTip direction="bottom" class={cls.e("dropdown")}>
      {{
        content: () => hiddenNodes,
        default: () => (
          <UButton text size="small" type="primary" class={actionCls.b}>
            更多
            <UIcon>
              <ArrowDown />
            </UIcon>
          </UButton>
        ),
      }}
    </UTip>
  ) : null;

  return dropdown ? [...normalNodes, dropdown] : normalNodes;
}

provide(ActionDIKey, {
  groupProps: props,
});
</script>
