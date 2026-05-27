# AGENTS.md — @veltra/utils

工具函数、共享类型包。是整个组件库的底层依赖，不含任何 Vue 组件。共享 SCSS 与主题 TS 在 `@veltra/styles`。

## 目录结构

```
src/
├── index.ts              # 聚合导出 utils + shared + types
├── utils/                # 工具函数
│   ├── dom/              # class-name, highlight, position, style, z-index
│   ├── form/validate     # 表单校验
│   ├── helper/           # make-bem, tween, frame, create-increase, vue 等
│   └── reactive/proxy    # 响应式代理
├── shared/               # 共享常量（FORM_EMPTY_CONTENT 等）
└── types/                # 组件公共类型、form-context 等
```

## 导出子路径

| 子路径 | 用途 |
| ------ | ---- |
| `@veltra/utils` | 工具函数 + 共享 + 类型聚合 |
| `@veltra/utils/shared` | 共享常量 |

## BEM + SCSS

样式文件使用 `@veltra/styles`（详见 `packages/styles/AGENTS.md`）：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;

@include m.b(component-name) {
  color: fn.use-var(text-color, main);
}
```

## 关键工具

| 模块 | 导出 | 用途 |
| ---- | ---- | ---- |
| `helper/make-bem` | `bem()` | BEM 类名 |
| `helper/tween` | `Tween` | 补间动画 |
| `helper/frame` | `frame` | rAF 封装 |
| `dom/z-index` | — | z-index 管理 |
| `form/validate` | — | 表单校验 |

## 依赖

- **peer**：`@cat-kit/core`、`vue`
- **被依赖**：compositions、directives、styles、desktop

## 验证

```bash
bun run lint
vp test -F @veltra/utils
vp pack -F @veltra/utils
```
