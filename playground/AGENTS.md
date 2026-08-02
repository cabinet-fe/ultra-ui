# AGENTS.md — playground

统一组件与图标预览，调试与演示 Ultra UI。

## 启动

```bash
cd playground
vp dev    # 端口 7788，host: true
```

## 导航

- 侧栏使用 `UDualNav`：左轨 Icons / Desktop / AI Chat / Sheet；Icons 右栏为「图标库 / 图标组合」；Desktop 右栏为「分类 → 组件」两级导航
- 导航数据集中在 `nav-config.ts`（`demoMeta`、`buildPlaygroundMenus()`）
- 新增 Desktop 演示页：在 `src/desktop/<component-name>/index.vue` 创建文件，并在 `nav-config.ts` 补充 `demoMeta`
- AI Chat（`@veltra/ai`）与 Sheet（`@veltra/sheet`）为独立顶层入口，不挂在 Desktop 分类下

## 路由

- `src/desktop/<component-name>/index.vue` → `/desktop/<component-name>/index`
- `src/icons/index.vue` → `/icons/index`
- `src/icons/combo/index.vue` → `/icons/combo/index`
- `src/ai-chat/index.vue` → `/ai-chat/index`
- `src/sheet/index.vue` → `/sheet/index`

由 `import.meta.glob` 分别扫描 `desktop`、`icons`、`ai-chat` 与 `sheet` 目录自动生成。默认重定向 `/` → `/desktop/button/index`。

## Vite 要点

- SCSS：`NodePackageImporter`（仓库根）解析 `pkg:@veltra/styles/...`
- `VeltraDesktopUIResolver`（`@veltra/vite`）：`U*` 组件 + 对应 `style.ts`
- `@veltra/vite` 为本 playground 的 devDependency

## 结构

```
App.vue
main.ts           # normalize + router
router.ts
nav-config.ts     # 导航分类与中英文元数据
vite.config.ts
src/desktop/<name>/index.vue
src/icons/index.vue           # 图标库预览
src/icons/combo/index.vue     # 图标组合预览
src/ai-chat/index.vue         # @veltra/ai 对话组件预览
src/sheet/index.vue           # @veltra/sheet 电子表格预览
```

## 浏览器调试

改 UI 后优先用浏览器工具验证；若 dev server 已在跑，先探测 7788 再决定是否启动。

## 依赖

- **dependencies**：`@veltra/*`、`@cat-kit/core`、`@cat-kit/fe`、`@cat-kit/excel`、`vue`、`vue-router`
- **devDependencies**：`@veltra/vite`、`vite-plugin-vue-devtools`

## 验证

```bash
# 仓库根
bun run lint
bun run build

# 本 playground
cd playground && vp dev      # 交互验证
cd playground && vp build    # 生产构建
```
