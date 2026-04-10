# AGENTS.md — @ultra-ui/directives

Vue 自定义指令集合。

## 指令列表

| 指令            | 用途                 | 实现要点                                                                                   |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| `vFocus`        | 挂载时自动聚焦 input | 支持直接 input 或容器内查找 input                                                          |
| `vClickOutside` | 点击元素外部触发回调 | document 级 mousedown + click 协调，WeakMap 管理实例                                       |
| `vRipple`       | 水波纹点击效果       | mousedown 触发，支持 `binding.value` 控制启用/禁用和自定义类名，`binding.arg` 控制持续时间 |

## 目录结构

```
src/
├── index.ts              # 聚合导出
├── focus/index.ts        # vFocus
├── click-outside/index.ts # vClickOutside
└── ripple/
    ├── index.ts          # vRipple 指令 + Ripple 类导出
    ├── ripple.ts         # Ripple 类实现
    ├── style.ts          # 样式入口
    └── style.scss        # 水波纹样式
```

## 导出子路径

| 子路径                              | 用途                               |
| ----------------------------------- | ---------------------------------- |
| `@ultra-ui/directives`              | 全部指令                           |
| `@ultra-ui/directives/ripple/style` | 单独引入 ripple 样式（构建侧使用） |

## 新增指令约定

1. 在 `src/` 下创建 `<directive-name>/index.ts`
2. 导出 `ObjectDirective` 类型的指令，命名 `v` + camelCase（如 `vNewDirective`）
3. 如有样式需求，创建 `style.ts` + `style.scss`，在 `package.json` 的 `exports` 中声明子路径
4. 在 `src/index.ts` 中添加 `export * from './<directive-name>'`

## 依赖

- **依赖**：`@ultra-ui/utils`、`@ultra-ui/styles`（SCSS 使用 `pkg:@ultra-ui/styles/mixins` 等）
- **peer**：`vue ^3.5.0`
- **被依赖**：`@ultra-ui/desktop`（`install.ts` 中批量注册）
