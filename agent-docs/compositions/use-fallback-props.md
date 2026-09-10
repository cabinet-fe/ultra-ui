---
title: useFallbackProps / useFormFallbackProps 属性多级回退
description: 从 @veltra/compositions 导出的属性优先级解析组合式函数：按「右侧 props 优先 → 全局 useConfig 配置 → 默认值」逐级回退，每个 key 返回 ComputedRef；useFormFallbackProps 预置表单控件的 size、disabled、readonly 三项回退。
aliases: [use-fallback-props, useFormFallbackProps, 属性回退, props 优先级, 表单尺寸联动]
keywords: [useFallbackProps, useFormFallbackProps, useConfig, setConfig, formProps, injectFormContext, ComputedRef, ComponentSize, propsList, fallbackProps, 属性优先级, 多级回退, 全局配置, 表单联动, size 回退]
---

# useFallbackProps / useFormFallbackProps 属性多级回退

`@veltra/compositions` 导出的 `useFallbackProps` 按固定优先级解析一组属性：`propsList` 从右往左第一个非 `undefined` 的值 → 全局配置 `useConfig().config` 同名 key → 传入的默认值；每个 key 返回一个 `ComputedRef`。`useFormFallbackProps` 是表单控件场景的封装，预置 `size` / `disabled` / `readonly` 三项回退，让子控件自动跟随 `<u-form>` 与全局配置。

## 快速上手

从 `@veltra/compositions` 导入 `useFallbackProps`，传入属性列表与默认值，返回值按 key 解构，每个都是 `ComputedRef`：

```ts
import { useFallbackProps } from '@veltra/compositions'
import type { ComponentSize } from '@veltra/utils'

// 组件自身 props（defineProps 的返回值），这里以普通对象示意
const props: Record<string, any> = { size: 'small' }

// propsList：[props]，最右边的 props 优先级最高
const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

console.log(size.value) // => 'small'（props 命中，不再看全局配置与默认值）
```

组件内最典型的 `propsList` 是 `[formProps ?? {}, props]`：`props` 在右优先级最高，`formProps`（`injectFormContext()` 取得的表单上下文，来自 `@veltra/utils`）在左作为次级来源。

## API 签名

```ts
import type { ComputedRef } from 'vue'

/**
 * 属性多级回退解析
 * @param propsList 属性列表，最右边的属性优先级最高
 * @param fallbackProps 要回退的属性与其默认值，返回对象只包含这里的 key
 */
export function useFallbackProps<
  F extends Record<string, any>,
  R extends { [key in keyof F]: ComputedRef<F[key]> }
>(propsList: Record<string, any>[], fallbackProps: F): R

/** 表单回退属性全集 */
type FormFallbackProps = {
  size: ComponentSize // 'small' | 'default' | 'large'
  disabled: boolean
  readonly: boolean
}

/** 不传 fallbackProps：回退 size: 'default'、disabled: false、readonly: false 三项 */
export function useFormFallbackProps(propsList: Record<string, any>[]): {
  [key in keyof FormFallbackProps]: ComputedRef<FormFallbackProps[key]>
}

/** 只传部分表单属性：返回对象只包含传入的 key */
export function useFormFallbackProps<F extends Partial<FormFallbackProps>>(
  propsList: Record<string, any>[],
  fallbackProps: F
): { [key in keyof F]: ComputedRef<FormFallbackProps[key]> }
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `propsList` | `Record<string, any>[]` | — | 是 | 解析顺序固定为从数组末尾向开头扫描，遇到 `props[key] !== undefined` 即返回；数组元素可为空对象（常见写法 `formProps ?? {}`） |
| `fallbackProps` | `Record<string, any>`（`useFormFallbackProps` 限 `Partial<FormFallbackProps>`） | `useFormFallbackProps` 不传时为 `{ size: 'default', disabled: false, readonly: false }`；`useFallbackProps` 必传 | 是 / 否 | 返回对象只包含此对象自己的 key；key 必须是可直接作为全局配置顶层 key 或组件 prop 的字符串 |

### 解析优先级与返回值

每个 key 的 `ComputedRef` 内部按固定顺序求值，三者取第一个非 `undefined`：

1. `propsList` 从右往左扫描，第一个 `props[key] !== undefined` 的元素。
2. 全局配置 `useConfig().config[key]`（全局配置顶层 key 有 `animation`、`size`、`form`、`paginator`）。
3. `fallbackProps[key]` 默认值。

返回值约束：

- 返回对象的 key 集合与 `fallbackProps` 完全一致；没写在 `fallbackProps` 里的 key 不会出现在返回对象中。
- 每个值是 `ComputedRef`，模板里自动解包，脚本里必须 `.value`。
- `computed` 依赖 `propsList` 数组元素与全局配置，任一变化自动重算。

## 方法与事件

无方法与事件。派生行为：

- 修改全局配置（`useConfig().setConfig({ size: 'small' })`）后，所有未在 `propsList` 命中的 `size` 引用立即更新。
- `setConfig` 为深层合并：`setConfig({ form: { labelWidth: 120 } })` 不会丢掉 `paginator` 等其他配置。

## 典型示例

### 表单控件跟随表单与全局尺寸

复选框组件内部的真实链路：组件 props 优先，`<u-form>` 的 `formProps` 其次，全局配置兜底：

```vue
<script setup lang="ts">
import { useFormFallbackProps } from '@veltra/compositions'
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

const props = defineProps<{ size?: 'small' | 'default' | 'large' }>()

// 表单上下文：不在 <u-form> 内时为 undefined，用 ?? {} 兜底
const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const className = computed(() => `u-checkbox--${size.value}`)
</script>

<template>
  <label :class="className" :aria-disabled="disabled">
    <input type="checkbox" :disabled="disabled" :readonly="readonly" />
  </label>
</template>
```

`size.value` 依序取 `props.size` → `formProps.size` → 全局 `config.size`（初始 `'default'`）。

### 全局配置兜底与 setConfig 联动

全局配置中 `size` 恒有值（初始 `'default'`），因此 `size` 的默认值只有全局配置不存在该 key 时才生效；改全局配置即可批量调整：

```ts
import { useConfig, useFallbackProps } from '@veltra/compositions'

const { config, setConfig } = useConfig()

const props = { size: 'small' } as Record<string, any>
const { size } = useFallbackProps([props], { size: 'large' })

console.log(size.value) // => 'small'，props 命中

setConfig({ size: 'large' })
console.log(config.size) // => 'large'

const props2: Record<string, any> = {}
const { size: size2 } = useFallbackProps([props2], { size: 'large' })
console.log(size2.value) // => 'large'，来自全局配置而非默认值
```

`setDocumentSize(size)` 把当前 `size` 作为 class 加到 `document.documentElement` 上，旧 class 一并移除；SSR（无 `document`）下该函数直接返回。

### 只回退部分表单属性

第二参只写需要的 key，返回对象就只有这些 key：

```ts
import { useFormFallbackProps } from '@veltra/compositions'

const props: Record<string, any> = { disabled: true }

const { size, disabled } = useFormFallbackProps([props], {
  size: 'small',
  disabled: false
})

console.log(size.value) // => 'default'（全局配置）
console.log(disabled.value) // => true（props 命中）
// readonly 未在第二参中声明，返回对象里没有 readonly
```

`disabled` / `readonly` 不是全局配置的顶层 key，恒回退到 `propsList` 或默认值；`size` 才有全局配置这一层。

## 注意事项

> [!WARNING]
> - 返回值是 `ComputedRef`，脚本中必须 `.value`；写成 `size`（对象解构后的 ref 本身）传给需要布尔 / 字符串的 API 会类型不符。
> - 解析顺序是「props → 全局配置 → 默认值」：对 `size` 而言全局配置恒有值，`fallbackProps` 里的 `size` 默认值实际不可达；要让某组件不受全局配置影响，只能在 `propsList` 里显式给值。
> - `propsList` 中 `null` 不等于 `undefined`：`props[key]` 为 `null` 时会被当作有效值命中，`?? {}` 兜底要写在 `formProps` 为空的位置而不是依赖 `null` 跳过。
> - 本库是 `useFormFallbackProps`（无 `r`，`Fallback` 拼写），不是 `useFormProps` / `useFallback`；`ComponentSize` 取值 `'small' | 'default' | 'large'`，没有 `'medium'`。
> - `useConfig()` 在 setup 之外也可调用（全局单例状态），但 `useFallbackProps` 内部创建 `computed`，必须在 `setup` 作用域内调用。

## 常见问题

### `size.value` 一直是 `'default'`，传入的默认值不生效

全局配置 `config.size` 初始值是 `'default'` 且恒存在，默认值只在全局配置缺失该 key 时使用。修复：在 `propsList` 右侧的 props 上显式传 `size`，或调用 `setConfig({ size: 'small' })` 改全局值。

### 解构出来的 `disabled` 直接绑到 `:disabled` 上不生效

`:disabled="disabled"` 绑的是 `ComputedRef` 对象而非布尔值。修复：模板中写成 `:disabled="disabled"`（模板自动解包，此写法正确）时确认 `disabled` 来自同一 `<script setup>` 顶层；在 `computed` / 函数内使用必须 `disabled.value`。
