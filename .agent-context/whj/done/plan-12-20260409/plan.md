# 工具链与 DX 改进

> 状态: 已执行

## 目标

优化开发工具链配置：移除对 `@builder/vite` 的依赖、限制 Turbo 构建范围、增加代码提交前质量检查，提升开发体验和代码质量保障。

## 内容

### 1. 移除 @builder/vite，自行实现组件自动导入

当前 `playgrounds/desktop/vite.config.ts` 通过 `@builder/vite` 的 `pluginPresets` 和 `autoResolveComponent` 封装了 Vite 插件和组件解析逻辑。目标是移除该依赖，直接配置插件。

1. 在 `playgrounds/desktop` 中添加 `unplugin-vue-components` 作为 devDependency
2. 重写 `playgrounds/desktop/vite.config.ts`：
   - 直接导入 `@vitejs/plugin-vue`（根 devDependencies 已有）、`@vitejs/plugin-vue-jsx`（根 devDependencies 已有）、`unplugin-vue-components/vite`（新增）
   - 保留 `existModule` 辅助函数及其 `existsSync` + `desktopRoot` 逻辑（sideEffects 回退必需）
   - 实现自定义 resolver，返回 `unplugin-vue-components` 要求的结构体：
     ```ts
     {
       name: 'default',           // 默认导出
       from: '@ultra-ui/desktop/components/<kebabName>',
       sideEffects: '<style.ts 路径或 undefined>'
     }
     ```
   - PascalCase → kebab-case 转换：手写正则 `name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)` 处理 `UDateRangePicker → date-range-picker` 等多段命名
   - sideEffects 回退逻辑：复用现有 `existModule` + `while` 循环，从完整 kebab-name 逐级截断末尾 `-segment` 查找 `style.ts`
   - 保留 `dts: true` 配置
   - 保留所有非插件配置不变（`base`、`resolve.extensions`、`css.preprocessorOptions.scss.loadPaths`、`server`）
3. 从 `playgrounds/desktop/package.json` 的 dependencies 中移除 `@builder/vite`
4. 运行 `bun install`，启动 playground（`cd playgrounds/desktop && bun dev`）验证组件自动导入和样式加载正常

### 2. Turbo build 限制为 packages/\* 目录

当前 `turbo run build` 会触及所有 workspace。经确认：

- `tools/build` 有 `"build": "bun index.ts"`（构建流水线本身，不应被 turbo 构建）
- `tools/cli` 有 `"build": "bun -e 'void 0'"`（空操作）
- `playgrounds/desktop` 和 `playgrounds/icons` 有 `"build": "vite build"`（playground 预览构建，不需要 turbo 管理）

这些包均应排除在 turbo build 之外。

1. 修改根 `package.json` 的 `build` 脚本为 `turbo run build --filter='./packages/*'`
2. 运行 `bun run build` 验证只构建 packages 目录下的包（utils、compositions、directives、desktop）

### 3. 添加 pre-commit hooks（oxlint + oxfmt，仅暂存区文件）

当前 `simple-git-hooks` 只配置了 `commit-msg` 钩子。需要添加 `pre-commit` 钩子对暂存区文件执行 lint 和 format 检查。

注意：`oxfmt` 仅支持 JS/TS/Vue/JSX/TSX 文件，不支持 SCSS/CSS 格式化。

1. 安装 `lint-staged` 为根 devDependency
2. 在根 `package.json` 中配置：
   - `simple-git-hooks` 字段添加 `pre-commit`：
     ```json
     "simple-git-hooks": {
       "commit-msg": "bun cat-cli verify-commit",
       "pre-commit": "bunx lint-staged"
     }
     ```
   - 添加 `lint-staged` 顶层字段：
     ```json
     "lint-staged": {
       "*.{ts,tsx,vue,js,jsx}": ["oxlint", "oxfmt --write"]
     }
     ```
     仅对 JS/TS/Vue 文件执行 oxlint（lint 检查）和 oxfmt --write（自动格式化后重新暂存）。不配置 SCSS/CSS 规则。
3. 运行 `bun install && bunx simple-git-hooks` 安装依赖并更新 Git hooks
4. 创建测试提交验证 hooks 正常触发（修改一个文件 → `git add` → `git commit`，观察 lint-staged 输出）

## 影响范围

- `package.json`（`build` 脚本、`lint-staged`、`simple-git-hooks.pre-commit`、`lint-staged` 依赖）
- `playgrounds/desktop/package.json`（移除 `@builder/vite`，新增 `unplugin-vue-components`）
- `playgrounds/desktop/vite.config.ts`（`@vitejs/plugin-vue`、`@vitejs/plugin-vue-jsx`、`unplugin-vue-components` 与自定义 resolver）
- `bun.lock`

## 历史补丁
