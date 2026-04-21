# 构建系统迁移：集中式 tools/build → 每包独立 tsdown + Turborepo 编排

> 状态: 已执行

## 目标

将当前集中式 `tools/build` 构建流水线迁移为 Turborepo 最佳实践架构：每个子包拥有独立的 `tsdown.config.ts` 和真实 `build` 脚本，turbo 负责拓扑编排和缓存，各包独立发布到 npm。消除 noop build 脚本、双轨产物模型和样式管线接口断裂等问题。

### 关键决策记录

| 决策项    | 结论                                                                |
| --------- | ------------------------------------------------------------------- |
| 构建工具  | tsdown（项目已在用，专为库设计，未来将成为 Vite library mode 底层） |
| 发布模型  | 各包独立发布（@veltra/utils, @veltra/desktop 等）                   |
| 向后兼容  | 不保留 `ultra-ui` 包名，直接切换                                    |
| SCSS 处理 | @tsdown/css 统一处理                                                |
| 发版工具  | 精简 tools/build 为 release 脚本，后续考虑 changesets               |

## 内容

### 步骤 1：安装新增依赖

在仓库根目录安装 `@tsdown/css`。确认以下已有依赖版本满足需求（不满足则升级）：

- `tsdown` >= 0.21
- `unplugin-vue` / `unplugin-vue-jsx`
- `sass-embedded`
- `vue-tsc`（DTS 生成 Vue 类型所需）

**完成标准**：`bun install` 无报错，`node_modules/@tsdown/css` 存在。

### 步骤 2：更新 turbo.json

替换当前过于简略的 `turbo.json` 为完整的任务编排配置：

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalDependencies": ["tsconfig.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsdown.config.ts", "tsconfig.json", "package.json"],
      "outputs": ["dist/**"]
    },
    "check-types": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json"],
      "outputs": []
    },
    "lint": { "outputs": [] },
    "format": { "outputs": [] },
    "test": { "dependsOn": ["build"], "outputs": [] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

**完成标准**：`turbo.json` 包含 build、check-types、lint、format、test、dev 六个任务，build 有正确的 inputs/outputs/dependsOn。

### 步骤 3：为 packages/utils 创建独立构建

1. 创建 `packages/utils/tsdown.config.ts`：
   - `entry`: `src/index.ts`（及其他顶层导出入口如有）
   - `format`: `['esm']`
   - `unbundle`: `true`（保持可 tree-shake 的独立文件输出）
   - `dts`: `true`
   - `platform`: `'neutral'`
   - `sourcemap`: `true`

2. 更新 `packages/utils/package.json`：
   - `scripts.build`: `"tsdown"`
   - `exports`: 保持 `development` 条件指向 src，`import` 指向 dist，`types` 指向 dist 下的 `.d.ts`
   - 确保 `files` 字段包含 `dist` 和 `src`（发布需要 src 给 development 条件用）
   - 添加 `publishConfig` 如需

3. 运行 `bun run build`（在 packages/utils 下）验证产物。

**完成标准**：`packages/utils/dist/` 下生成 `.js` 和 `.d.ts` 文件，无报错。

### 步骤 4：为 packages/styles 创建独立构建

此包比较特殊：既导出 SCSS 源文件（`sass` 条件）又导出编译后的 CSS/JS（`import` 条件）。

1. 创建 `packages/styles/tsdown.config.ts`：
   - `entry`: `src/index.ts`
   - `format`: `['esm']`
   - `unbundle`: `true`
   - `dts`: `true`
   - 启用 `@tsdown/css` 的 SCSS 支持，配置 `css.preprocessorOptions.scss` 以支持 `pkg:` 导入（`NodePackageImporter` 等效配置）
   - SCSS 源文件（`_*.scss`、`normalize.scss` 等）复制到 dist（通过 tsdown copy 插件或 build script 追加 cp 命令），供消费者 `sass` 条件使用

2. 更新 `packages/styles/package.json`：
   - `scripts.build`: `"tsdown"`（或 `"tsdown && cp-scss-files"`，视 tsdown 能否处理纯 SCSS 复制）
   - `exports`: 保持 `sass` 条件指向 SCSS 源文件，`import` 指向 dist 编译产物
   - `files`: 包含 `dist` 和 `src`

3. 验证 SCSS 编译和源文件复制均正确。

**完成标准**：`packages/styles/dist/` 下有编译后的 CSS/JS，且 SCSS 源文件可供 `sass` 条件消费。

### 步骤 5：为 packages/compositions 创建独立构建

1. 创建 `packages/compositions/tsdown.config.ts`：
   - `entry`: `src/index.ts`、`src/theme/index.ts`（对应现有 exports 的 `./theme`）
   - `format`: `['esm']`、`unbundle`: `true`、`dts`: `true`
   - 外部化 `@veltra/utils`、`@cat-kit/core`、`vue`

2. 更新 `packages/compositions/package.json`：
   - `scripts.build`: `"tsdown"`
   - `exports`: 保持 `.` 和 `./theme` 双入口，各含 types/development/import

3. 验证产物。

**完成标准**：`packages/compositions/dist/` 生成正确产物，import `@veltra/utils` 被外部化而非内联。

### 步骤 6：为 packages/directives 创建独立构建

1. 创建 `packages/directives/tsdown.config.ts`：
   - `entry`: `src/index.ts`（主入口）+ `src/**/style.ts`（各指令样式入口）
   - `format`: `['esm']`、`unbundle`: `true`、`dts`: `true`
   - 启用 `@tsdown/css` 处理 SCSS
   - 外部化 `@veltra/utils`、`@veltra/styles`、`vue`

2. 更新 `packages/directives/package.json`：
   - `scripts.build`: `"tsdown"`
   - `exports`: 保持现有结构（含 `./ripple/style` 等样式子路径），指向 dist
   - `sideEffects`: 更新为指向 dist 下的样式文件

3. 验证产物。

**完成标准**：指令 JS、DTS、编译后的 CSS 均在 dist 中，SCSS 文件正确编译。

### 步骤 7：为 packages/desktop 创建独立构建

这是最复杂的包，包含 Vue SFC、JSX、per-component style.ts、以及对所有内部包的依赖。

1. 创建 `packages/desktop/tsdown.config.ts`：
   - `entry`: `src/index.ts`、`src/types/index.ts`、`src/components/**/style.ts`（per-component 样式入口）
   - `format`: `['esm']`、`unbundle`: `true`、`sourcemap`: `true`
   - `dts`: `{ vue: true }`（生成 Vue 组件的类型声明）
   - `plugins`: `unplugin-vue/rolldown`、`unplugin-vue-jsx/rolldown`
   - 启用 `@tsdown/css` 处理 SFC 内的 SCSS 和 style.ts 中引入的 SCSS
   - 配置 SCSS `preprocessorOptions` 以支持 `pkg:@veltra/styles/...` 导入
   - 外部化：`vue`、`@veltra/utils`、`@veltra/compositions`、`@veltra/directives`、`@veltra/styles`、`@veltra/icons`、`@cat-kit/core`

2. 更新 `packages/desktop/package.json`：
   - `scripts.build`: `"tsdown"`
   - `exports`:
     - `.`: types + development + import（主入口）
     - `./*`: types + development + import（组件子路径，如 `@veltra/desktop/button`）
     - `./types`: 类型入口
   - `peerDependencies`: `vue`、`@veltra/utils`、`@veltra/compositions`、`@veltra/directives`、`@veltra/styles`、`@veltra/icons`
   - `sideEffects`: 指向 dist 下的 style 文件

3. 验证完整产物：组件 JS、Vue DTS、per-component CSS。

**完成标准**：`turbo run build --filter=@veltra/desktop` 按拓扑顺序先构建依赖包再构建 desktop，全部成功，dist 中有完整的 ESM + DTS + CSS 产物。

### 步骤 8：调整 packages/icons 构建（如需）

icons 已有独立构建流程。检查并确保：

- `scripts.build` 命令可被 turbo 正确调度
- 产物输出到 `dist/`，与 turbo.json 的 `outputs: ["dist/**"]` 一致
- 无需改动则跳过此步骤

**完成标准**：`turbo run build --filter=@veltra/icons` 成功。

### 步骤 9：更新根 package.json scripts

- `build`: `turbo run build`（移除 `--filter='./packages/*'`，让 turbo 自行通过 task 定义过滤）
- `check-types`: `turbo run check-types`
- `dev`: 保持指向 playground
- `test`: 调整为 `turbo run test` 或保持 `vitest`（视需要）
- 移除任何直接引用 `tools/build` 的构建命令

**完成标准**：根目录 `bun run build` 等同于 `turbo run build`，完整编排所有包构建。

### 步骤 10：重构 tools/build 为 release 脚本

1. 删除以下文件（构建逻辑已迁移到各包 tsdown.config.ts）：
   - `build.ts`
   - `build-styles.ts`
   - `cli-build-styles.ts`
   - `prepare.ts`（genFiles / copyFiles 不再需要，各包直接发布自身 dist）
   - `shared.ts`（workspaceTsAliases 不再需要）

2. 保留并精简 `release.ts`：
   - 改为调用 `turbo run build` 触发构建
   - 保留版本号提示、git tag、npm publish 逻辑
   - 改为支持多包发布（遍历需发布的 packages）

3. 更新 `tools/build/index.ts` 为纯 release 入口。

4. 更新 `tools/build/AGENTS.md` 反映新职责。

**完成标准**：`tools/build` 仅包含 release 相关逻辑，`cd tools/build && bun index.ts` 执行 turbo build + 多包发布流程。

### 步骤 11：端到端验证

1. `bun run build`：所有包按拓扑顺序构建成功
2. `bun run lint`：无新增 lint 错误
3. `bun vitest --run`：测试通过
4. `cd playgrounds/desktop && bun dev`：playground 开发服务器正常启动，组件渲染正确（development 条件走 src 不受影响）
5. 各包 `dist/` 产物检查：
   - utils: ESM + DTS
   - styles: ESM + CSS + SCSS 源文件
   - compositions: ESM + DTS（外部化 @veltra/utils）
   - directives: ESM + DTS + CSS（外部化依赖）
   - desktop: ESM + DTS(Vue) + CSS（外部化所有内部依赖）
   - icons: ESM + DTS（已有构建）
6. 二次构建利用 turbo 缓存（无变更时 `>>> FULL TURBO`）

**完成标准**：上述 6 项全部通过。

## 影响范围

- `package.json`、`turbo.json`、`bun.lock`、`AGENTS.md`
- `scripts/vitest-run.ts`（根目录 Vitest 入口，供 playground 的 turbo test 调用）
- `packages/utils/`：`tsdown.config.ts`（双入口含 `src/types/index.ts`）、`package.json`（`files`、`exports` 含 `./types` 与 `./types/*`）
- `packages/styles/`：`tsdown.config.ts`、`package.json`、`scripts/copy-scss.ts`
- `packages/compositions/`：`tsdown.config.ts`、`package.json`
- `packages/directives/`：`tsdown.config.ts`、`package.json`
- `packages/desktop/`：`tsdown.config.ts`、`package.json`、`src/install.ts`（移除不存在的 `animation/style` 引用）、`src/types/index.ts`（`export type * from '@veltra/utils/types'`）
- `packages/icons/`、`packages/mobile/`：`package.json`（`check-types`）
- `playgrounds/desktop/package.json`（`test` 脚本）
- `tools/build/`：删除 `build.ts`、`build-styles.ts`、`cli-build-styles.ts`、`prepare.ts`、`shared.ts`；重写 `index.ts`、`release.ts`、`package.json`、`AGENTS.md`
- `tools/cli/package.json`（`check-types`）
- patch-1：`AGENTS.md`、`turbo.json`（vitest 相关全局依赖与 test inputs）；删除 `packages/styles/` 包根误生成的 `.scss` / `anime/` 副本

## 历史补丁

- patch-1: review 后小修 — 文档、turbo 测试缓存输入、清理 styles 包根误生成 SCSS
