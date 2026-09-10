---
title: 响应式与上下文辅助
description: Vue 响应式与依赖注入辅助：middleProxy 为深层对象建可监听批量变更的中间代理，shallowComputed 基于 shallowRef 的浅层计算属性，provideFormContext / injectFormContext 提供 UForm 表单上下文（字段注册与校验）。
aliases: [middleProxy, shallowComputed, provideFormContext, injectFormContext, 表单上下文]
keywords: [middleProxy, shallowComputed, provideFormContext, injectFormContext, ShallowRef, InjectionKey, registerField, unregisterField, validateFields, formProps, FormContextProps, FormFieldItem, 响应式代理, 批量变更, 浅层计算, 依赖注入, 表单校验, 字段注册, 禁用继承]
---

# 响应式与上下文辅助

`@veltra/utils` 导出 Vue 运行时辅助：`middleProxy` 为深层对象创建可监听批量变更的中间代理，`shallowComputed` 基于 `shallowRef` 的浅层计算属性，`provideFormContext` / `injectFormContext` 在表单容器与表单控件之间传递上下文（字段注册、校验、尺寸与禁用继承）。

## 快速上手

自定义表单控件在 `UForm` 子树内用 `injectFormContext` 读取表单属性并注册字段：

```ts
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

const { formProps, registerField } = injectFormContext()

// size / disabled / readonly 从表单继承，无表单时回退默认
const size = computed(() => formProps?.size ?? 'default')

// 有 field 的控件注册校验项；item.validate 返回 Promise<boolean>
registerField?.('userName', {
  validate: async () => true,
  clearValidate: () => {}
})
```

## API 签名

### middleProxy

```ts
export function middleProxy<O extends Record<string, any>>(
  o: O,
  handler?: {
    /** 赋值时调用；field 为点路径，嵌套写入形如 'a.b' */
    set?: (field: string, val: any) => void
    /** 读取时调用；field 为当前层字段名，不含父路径 */
    get?: (field: string) => any
    /** 微任务中批量回调本次同步修改的全部字段（点路径数组） */
    changed?: (fields: string[]) => void
  }
): O
```

嵌套普通对象在首次访问时递归套同一套代理（`Date` / `RegExp` / `null` 不套）；同一子对象经 `WeakMap` 复用代理实例，多次读取返回同一代理。返回值是新 Proxy 对象，原对象 `o` 不被修改。

### shallowComputed

```ts
import type { ShallowRef } from 'vue'

/** 立即执行 getter 求值写入 shallowRef，之后由 watch(getter) 同步后续结果 */
export function shallowComputed<T>(getter: () => T): ShallowRef<T>
```

与 Vue `computed` 的差异：不懒求值（创建即求值）；返回 `ShallowRef`，替换 `.value` 为浅层；无 `computed` 的暂停与调试接口。必须在 `setup` / `effect` 作用域内调用（内部使用 `watch`）。

### provideFormContext / injectFormContext

```ts
export interface FormContextProps {
  /** 表单列宽 */
  labelWidth?: string | number
  /** 表单项 label 位置 */
  labelPosition?: 'top' | 'left'
  /** 表单尺寸 */
  size?: 'small' | 'default' | 'large'
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否隐藏提示 */
  noTips?: boolean
  /** 表单数据 */
  model?: Record<string, any>
}

export interface FormFieldItem {
  validate: () => Promise<boolean>
  clearValidate?: () => void
}

export interface FormContextModel {
  errors: Map<any, string[] | undefined>
  fields: Record<string, { required?: unknown }>
}

/** 上下文对象形状（provideFormContext 的入参；该接口本身未单独导出） */
interface DIContext {
  formProps: Partial<FormContextProps> & Record<string, any>
  registerField: (field: string, item: FormFieldItem) => void
  unregisterField: (field: string) => void
  /** 未传 keys 时校验全部已注册字段 */
  validateFields?: (keys?: string[]) => Promise<boolean>
  shouldValidate?: () => boolean
  /** 字段 model 更新（watch 触发） */
  handleFieldUpdate: (field: string, value: any) => void
}

/** 向后代提供表单上下文；必须在 setup 中调用（内部使用 provide） */
export function provideFormContext(context: DIContext): void

/** 注入表单上下文；表单外调用时各字段为 undefined */
export function injectFormContext(): {
  /** 是否在表单中。实现恒为 true（见注意事项），判断在表单内应检查 formProps 是否存在 */
  inForm: boolean
} & Partial<DIContext>
```

## 参数说明

### middleProxy 的 handler

| 钩子 | 签名 | 触发时机 | field 取值 |
| --- | --- | --- | --- |
| `set` | `(field: string, val: any) => void` | 任意层级的属性赋值 | 点路径：顶层 `'a'`，嵌套 `'a.b'` |
| `get` | `(field: string) => any` | 任意层级的属性读取 | 当前层字段名，不含父路径 |
| `changed` | `(fields: string[]) => void` | 微任务（`Promise.resolve().then`），一次同步修改合并为一次回调 | 本次全部变更字段的点路径数组，回调后清空 |

### provideFormContext 的 context（DIContext）

| 字段 | 类型 | 必填 | 约束 |
| --- | --- | :---: | --- |
| `formProps` | `Partial<FormContextProps> & Record<string, any>` | 是 | 表单属性来源，控件据此回退 size / disabled / readonly |
| `registerField` | `(field, item) => void` | 是 | `item.validate` 必填且返回 `Promise<boolean>`；`clearValidate` 可选 |
| `unregisterField` | `(field: string) => void` | 是 | 注销字段 |
| `validateFields` | `(keys?) => Promise<boolean>` | 否 | 全部通过 resolve `true`，任一失败 reject 或 resolve `false` |
| `shouldValidate` | `() => boolean` | 否 | 控件据此决定是否触发校验 |
| `handleFieldUpdate` | `(field, value) => void` | 是 | 字段 model 更新（watch 触发） |

## 典型示例

### 自定义表单容器提供上下文

```ts
import { provideFormContext } from '@veltra/utils'
import { defineComponent } from 'vue'

export default defineComponent({
  setup(props) {
    const fields = new Map<string, { validate: () => Promise<boolean> }>()

    provideFormContext({
      formProps: props,
      registerField: (field, item) => fields.set(field, item),
      unregisterField: (field) => fields.delete(field),
      validateFields: async (keys) => {
        const targets = keys ?? [...fields.keys()]
        const results = await Promise.all(
          targets.map((k) => fields.get(k)?.validate() ?? Promise.resolve(true))
        )
        return results.every(Boolean)
      },
      handleFieldUpdate: () => {}
    })
  }
})
```

### 监听深层模型的整体变更

```ts
import { middleProxy } from '@veltra/utils'

const model = middleProxy(
  { user: { name: '' } },
  {
    set(field, val) {
      console.log(field, val) // => 'user.name' 'ada'
    },
    changed(fields) {
      console.log(fields) // => ['user.name']
    }
  }
)

model.user.name = 'ada'
// changed 在微任务中触发，同一同步批次的多处修改合并成一个 fields 数组
```

### 浅层快照避免深度追踪

```ts
import { shallowComputed } from '@veltra/utils'
import { ref, watchEffect } from 'vue'

const source = ref({ id: 1, items: [1, 2, 3] })

// getter 依赖变化且返回引用变化时更新；不深度追踪 items 内部
const snapshot = shallowComputed(() => ({ id: source.value.id }))

watchEffect(() => {
  console.log(snapshot.value.id) // => 1
})
```

## 注意事项

> [!WARNING]
> - `injectFormContext()` 返回的 `inForm` 恒为 `true`：源码以 `!!context` 计算，未提供上下文时 `context` 为 `{}`（真值）。判断是否在表单内必须检查 `formProps` 等字段是否存在，禁止依赖 `inForm`。
> - 表单控件用 `field` 绑定 model 时禁止再写 `v-model`，两者互斥。
> - `middleProxy` 的 `set` 收到点路径、`get` 只收到当前层字段名，两者口径不同。
> - `middleProxy` 的 `changed` 是微任务时机，回调内读到的已是最终值；回调参数数组在回调后即被清空，需要留存时先复制。
> - `shallowComputed` 返回的是 `ShallowRef`，不是 Vue `computed`；替换 `.value` 不会深度触发依赖它的渲染。
> - `provideFormContext` 必须在组件 `setup` 同步执行期间调用，异步调用后 `injectFormContext` 拿不到上下文。
