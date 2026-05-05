<template>
  <div :class="rootCls">
    <component v-for="node of normalNodes" :key="node.key" :is="node" />

    <u-tip
      v-if="dropdownNodes.length"
      :class="cls.e('dropdown')"
      direction="bottom"
      alignment="end"
      trigger="click"
    >
      <template #content>
        <component v-for="node of dropdownNodes" :key="node.key" :is="node" />
      </template>

      <u-action
        :class="cls.e('more')"
        :type
        :size
        :text
        :circle="hover"
        :icon="hover ? MoreFilled : undefined"
        title="更多"
      >
        <template v-if="!hover">
          更多
          <u-icon>
            <ArrowDown />
          </u-icon>
        </template>
      </u-action>
    </u-tip>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown, MoreFilled } from '@veltra/icons/normal'
import { bem, extractNormalVNodes } from '@veltra/utils'
import type { ColorType } from '@veltra/utils'
import { cloneVNode, computed, provide, type VNode } from 'vue'

import type { ActionGroupProps } from '../../types'
import { UIcon } from '../icon'
import { UTip } from '../tip'
import UAction from './action.vue'
import { ActionDIKey } from './di'

defineOptions({
  name: 'ActionGroup',
  inheritAttrs: false
})

// 此处不直接复用 `ActionGroupProps` 类型作为 `defineProps` 泛型参数，
// 是为了规避 Vue SFC 编译器在跨文件类型解析时偶发的 prop 未注册问题
// （表现为运行时 `[Vue warn]: Property "x" was accessed during render but is not defined on instance`）。
// 通过本地接口定义 + 类型相等性约束保证与外部类型一致。
interface _Props {
  loading?: boolean
  circle?: boolean
  max?: number
  hover?: boolean
  size?: 'small' | 'default' | 'large'
  text?: boolean
  type?: ColorType
}

type _AssertEqual = [ActionGroupProps] extends [_Props]
  ? [_Props] extends [ActionGroupProps]
    ? true
    : never
  : never

const _assert: _AssertEqual = true
void _assert

const props = withDefaults(defineProps<_Props>(), {
  max: 3,
  loading: false,
  circle: false,
  hover: false,
  size: 'small',
  text: true,
  type: 'primary'
})

const cls = bem('action-group')

const slots = defineSlots<{
  default?: () => VNode[]
}>()

const rootCls = computed(() => [cls.b, bem.is('hover', props.hover)])

function isInDropdownNode(node: VNode): boolean {
  const p = node.props as Record<string, unknown> | null
  if (!p) return false
  const v = p.inDropdown ?? p['in-dropdown']
  return v === true || v === '' || v === 'true'
}

const partitioned = computed(() => {
  const nodes = slots.default?.()

  if (!nodes) return { visible: [] as VNode[], hidden: [] as VNode[] }

  const extracted = extractNormalVNodes(nodes).filter(
    // 仅保留 UAction 子节点
    (node) => (node.type as { name?: string } | null | undefined)?.name === 'Action'
  )

  const visible: VNode[] = []
  const fixedHidden: VNode[] = []

  extracted.forEach((node) => {
    if (isInDropdownNode(node)) {
      fixedHidden.push(node)
    } else {
      visible.push(node)
    }
  })

  const willOverflow = visible.length > props.max
  const overflow = willOverflow ? visible.splice(props.max - 1) : []

  return {
    visible,
    hidden: [...overflow, ...fixedHidden]
  }
})

const normalNodes = computed(() => partitioned.value.visible)

// 下拉菜单中的 UAction 强制以非圆形、文本模式呈现，避免视觉与其他菜单项不一致
const dropdownNodes = computed(() => {
  return partitioned.value.hidden.map((node) =>
    cloneVNode(node, { inDropdown: true, circle: false })
  )
})

provide(ActionDIKey, {
  groupProps: props
})
</script>
