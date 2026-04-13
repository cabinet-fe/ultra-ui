# Resolver Contract

## 导出

`@veltra/vite` 当前只暴露两项：

- `VeltraDesktopUIResolver`
- `VeltraDesktopUIResolverOptions`

## 选项

```ts
interface VeltraDesktopUIResolverOptions {
  importStyle?: boolean
}
```

- 默认值：`true`
- 含义：是否把组件样式作为 sideEffects 一起返回

## 解析规则

Resolver 对组件名执行这些规则：

1. 仅处理匹配 `U` + PascalCase 的名字
2. 去掉前缀 `U`
3. 把剩余部分从 PascalCase 转成 kebab-case
4. 产出：
   - `name`: 原组件名
   - `from`: `@veltra/desktop`
   - `sideEffects`: `@veltra/desktop/components/<dir>/style`

## 共目录样式映射

这些组件没有独立 `style.ts`，会复用父目录样式入口：

| 组件 kebab 名 | 样式目录 |
| --- | --- |
| `button-group` | `button` |
| `action-group` | `action` |
| `card-header` | `card` |
| `card-cover` | `card` |
| `card-content` | `card` |
| `card-action` | `card` |
| `checkbox-button` | `checkbox` |
| `grid-item` | `grid` |
| `list-item` | `list` |
| `menu-sub` | `menu` |
| `menu-item` | `menu` |

## 判断问题是否属于 resolver

更像 resolver 问题的迹象：

- 组件名明明符合规则，但没有生成 `from: '@veltra/desktop'`
- 共目录组件被映射到了错误目录
- `importStyle` 开关行为与预期不符

更像消费包或构建链问题的迹象：

- `sideEffects` 路径生成正确，但目标文件不存在
- dev 与 build 只有一边失败
- 手动 import 样式可以工作，自动 sideEffects 失败
