# 过度设计与防御式编程

简单需求用直接写法；禁止预支抽象。

## 反例：一层业务做成策略工厂

```ts
// 需求：列表按 status 显示文案
type StatusStrategy = { label: () => string }
const strategies: Record<string, StatusStrategy> = {
  on: { label: () => t('on') },
  off: { label: () => t('off') },
}
export function createStatusLabel(status: string) {
  return (strategies[status] ?? strategies.off).label()
}
```

## 正例

```ts
const STATUS_LABEL = { on: '启用', off: '停用' } as const
function statusLabel(status: keyof typeof STATUS_LABEL) {
  return STATUS_LABEL[status]
}
```

## 反例：过度防御

```ts
function getName(user?: { profile?: { name?: string | null } } | null) {
  if (user == null) return ''
  if (user.profile == null) return ''
  if (user.profile.name == null || user.profile.name === '') return ''
  return String(user.profile.name).trim()
}
```

类型与调用方已保证有 `name` 时，不必层层守门。

## 正例

```ts
function getName(user: { profile: { name: string } }) {
  return user.profile.name
}
```

## 反例：预支「配置化」

```ts
// 只有一个弹窗标题，却做成可配置 schema
const dialogSchema = { title: '编辑', width: 520, showFooter: true, ... }
```

## 正例

```vue
<el-dialog title="编辑" width="520px">
```

## 抽公共的时机

- 已出现 ≥3 处真实重复，或用户明确要求复用 → 再抽。
- 「以后可能有第二个」→ 不抽。
