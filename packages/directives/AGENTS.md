# AGENTS.md — @veltra/directives

Vue 自定义指令集合。

## 指令

| 指令 | 用途 | 要点 |
| ---- | ---- | ---- |
| `vFocus` | 挂载时聚焦 input | 支持容器内查找 input |
| `vClickOutside` | 点击外部回调 | mousedown + click 协调 |
| `vRipple` | 水波纹 | `binding.value` / `binding.arg` 控制 |

## 目录结构

```
src/
├── index.ts
├── focus/index.ts
├── click-outside/index.ts
└── ripple/          # index.ts, ripple.ts, style.ts, style.scss
```

## 新增指令

1. `src/<name>/index.ts`，导出 `v` + camelCase 的 `ObjectDirective`
2. 有样式则加 `style.ts` + `style.scss`，在 `package.json` exports 声明子路径
3. `src/index.ts` 补充 `export *`

## 依赖

- **peer**：`@veltra/styles`、`@veltra/utils`、`vue`
- **被依赖**：`@veltra/desktop`（`install.ts` 批量注册）

## 验证

```bash
bun run lint
vp pack -F @veltra/directives
bun run build
```
