# 构建与开发环境重建

> 状态: 未执行

## 目标

将构建系统从 tsdown + rolldown 迁移到 @cat-kit/maintenance，移除 @builder/vite 改用原生 vite 插件，确保多包构建产物和开发预览正常工作。

前置条件：Plan-4 全部完成且验证通过。

## 内容

### 1. 验证 @cat-kit/maintenance 构建能力

在重写构建脚本前，需确认以下能力（通过阅读源码或小规模 POC 验证）：

| 能力 | 当前实现方式 | 需确认 |
|------|-------------|--------|
| Vue SFC 编译 | unplugin-vue/rolldown 插件 | group.build() 是否支持自定义 rolldown 插件注入 |
| Vue JSX 编译 | unplugin-vue-jsx/rolldown | 同上 |
| SCSS 编译 | 自定义 scssPlugin()（112行，含 alias 解析、路径重写、CSS 输出） | buildLib 是否提供 plugins 选项接受自定义 rolldown 插件 |
| Unbundled 输出 | tsdown 的 unbundle: true | buildLib 是否支持保留模块结构的输出 |
| DTS 生成 | tsdown 的 dts: { vue: true } | buildLib 的 dts 选项是否支持 Vue SFC 类型 |

若 @cat-kit/maintenance 不完全覆盖上述能力，需要确定替代方案：
- 方案 A：buildLib 支持 plugins → 将现有 scssPlugin 和 Vue 插件注入
- 方案 B：buildLib 不支持 plugins → 保留 tsdown 用于 pc 包编译，仅用 buildLib 编译 core/directives
- 方案 C：自行封装构建逻辑，仅使用 @cat-kit/maintenance 的 Monorepo/版本/发布能力

完成标准：确认具体方案并记录决策。

### 2. 重写构建脚本（JS/Vue 编译阶段）

基于步骤 1 的确认结果重写 build/build.ts。

若走方案 A（buildLib 支持插件）：
```typescript
import { Monorepo } from '@cat-kit/maintenance'
const repo = new Monorepo()
const group = repo.group([
  '@ultra-ui/core',
  '@ultra-ui/styles',
  '@ultra-ui/directives',
  '@ultra-ui/pc'
])
await group.build({
  '@ultra-ui/core': { platform: 'browser', dts: true },
  '@ultra-ui/directives': { platform: 'browser', dts: true },
  '@ultra-ui/pc': {
    platform: 'browser',
    dts: true,
    // Vue SFC + JSX 插件注入
  }
})
```
构建顺序由 group.build() 自动处理依赖图：core → styles → directives → pc。

若走方案 B/C，则保留现有 tsdown 构建逻辑，仅用 @cat-kit/maintenance 管理版本和发布。

完成标准：`cd build && bun index.ts` 成功产出各包的 JS/DTS 文件。

### 3. 重写样式构建阶段

当前 build-styles.ts 有自定义 scssPlugin 实现：
- 通过 rolldown resolveId 钩子拦截 .scss/.css/.js 导入
- 使用 sass-embedded compileAsync 编译 SCSS（loadPaths: [UI_ROOT, dirname]）
- 将 SCSS 导入重写为相对路径的 .css
- 在 generateBundle 阶段输出 CSS 文件

新的样式构建需适配多包结构：
- loadPaths 更新为 `[packages/styles/src, dirname(absolutePath)]`
- style.ts 入口模式：`packages/pc/src/components/**/style.ts` + `packages/directives/src/**/style.ts` + `packages/styles/src/index.ts`
- 输出路径从单个 dist/ 改为各包独立的 dist/

若 @cat-kit/maintenance 的 buildLib 不支持自定义 rolldown 插件，SCSS 构建保留为独立阶段。

完成标准：CSS 文件正确输出到各包的 dist 目录。

### 4. 重写 post-build 步骤

当前 prepare.ts 的功能需在多包下适配：

**copyFiles()**（复制 README 和 SCSS 源文件）：
- 每个子包的 dist 需要独立的 README
- SCSS 源文件（`_mixins.scss`、`_vars.scss`、`_functions.scss`、`fonts/*`）复制到 @ultra-ui/styles 的 dist

**genFiles()**（生成 dist/package.json 和 version.js）：
- 每个子包需独立的 dist/package.json（含 exports map）
- 每个子包需独立的 version.js
- workspace:* 依赖需替换为实际版本号（如 `"@ultra-ui/core": "^1.0.0"`）

@ultra-ui/pc 的 dist/package.json exports 结构：
```json
{
  ".": { "types": "./index.d.ts", "import": "./index.js" },
  "./*": { "types": "./*.d.ts", "import": "./*" },
  "./install": { "types": "./install.d.ts", "import": "./install.js" }
}
```

各包的 exports 需逐一定义。

完成标准：各包 dist 目录包含正确的 package.json、version.js 和必要的源文件。

### 5. 重写发布脚本

用 @cat-kit/maintenance API 替代手动流程：

```typescript
import { Monorepo, commitAndPush, createGitTag } from '@cat-kit/maintenance'

const repo = new Monorepo()
const group = repo.group([...])

await group.bumpVersion({ type: 'minor', syncPeer: true, syncDeps: true })
await commitAndPush({ cwd: ROOT, message: `release: v${version}`, addAll: true })
await createGitTag({ cwd: ROOT, tag: `v${version}`, push: shouldPush })
await group.publish({
  registry: 'http://192.168.31.250:6005',
  access: 'public'
})
```

发布顺序（由依赖关系决定）：core → styles → directives → pc。

注意事项：
- registry 从当前硬编码 `http://192.168.31.250:6005` 迁移到 .npmrc 配置（`@ultra-ui:registry=http://192.168.31.250:6005`）
- 确认 `workspace:*` 在发布时是否被 bun 自动替换为具体版本，若不替换则需在 post-build 中手动处理

完成标准：`cd build && bun index.ts --release` 的 dry-run 验证通过。

### 6. 重写 sample/vite.config.ts

移除 @builder/vite，使用原生插件：

```typescript
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import UnoCSS from 'unocss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@ultra-ui\/core$/, replacement: resolve(__dirname, '../packages/core/src/index.ts') },
      { find: /^@ultra-ui\/core\/(.*)$/, replacement: resolve(__dirname, '../packages/core/src/$1') },
      { find: /^@ultra-ui\/styles$/, replacement: resolve(__dirname, '../packages/styles/src/index.ts') },
      { find: /^@ultra-ui\/styles\/(.*)$/, replacement: resolve(__dirname, '../packages/styles/src/$1') },
      { find: /^@ultra-ui\/directives$/, replacement: resolve(__dirname, '../packages/directives/src/index.ts') },
      { find: /^@ultra-ui\/directives\/(.*)$/, replacement: resolve(__dirname, '../packages/directives/src/$1') },
      { find: /^@ultra-ui\/pc$/, replacement: resolve(__dirname, '../packages/pc/src/index.ts') },
      { find: /^@ultra-ui\/pc\/(.*)$/, replacement: resolve(__dirname, '../packages/pc/src/$1') },
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [resolve(__dirname, '../packages/styles/src')]
      }
    }
  },
  plugins: [
    vue(),
    vueJsx(),
    Components({
      resolvers: [/* 自定义组件解析器 */],
      dts: true
    }),
    UnoCSS(),
    vueDevTools({ launchEditor: 'cursor' })
  ],
  server: { port: 7788, host: true }
})
```

自定义组件解析器规格：
- 输入：PascalCase 组件标签名（如 `UButton`）
- 匹配规则：以 `U` 前缀开头
- 输出：`{ from: '@ultra-ui/pc', name: 'UButton', sideEffects: '@ultra-ui/pc/src/components/button/style.ts' }`
- 样式路径回退逻辑：若 `@ultra-ui/pc/src/components/<kebab-name>/style.ts` 不存在，截断最后一段 `-xxx` 重试（与当前 `autoResolveComponent` 逻辑一致）

完成标准：`cd sample && bun dev` 启动成功，组件正常渲染。

### 7. 更新 sample 和 build 的 package.json

**sample/package.json 变更**：
| 操作 | 包名 |
|------|------|
| 移除 | @builder/vite, cat-kit, @ultra/icon |
| 替换 | ultra-ui (workspace:\*) → @ultra-ui/pc (workspace:\*) |
| 新增 | @ultra-ui/core (workspace:\*), @ultra-ui/styles (workspace:\*), @ultra-ui/directives (workspace:\*) |
| 保留 | vue, vue-router, sass-embedded, unocss, vite, vite-plugin-vue-devtools |
| 新增 | @vitejs/plugin-vue-jsx（若需要 JSX 支持） |

**build/package.json 变更**（取决于步骤 1 的方案选择）：
| 操作 | 包名 |
|------|------|
| 新增 | @cat-kit/maintenance |
| 可能移除 | tsdown, rolldown（若方案 A）|
| 可能保留 | tsdown, rolldown（若方案 B/C）|
| 移除 | unplugin-vue, unplugin-vue-jsx（若由 @cat-kit/maintenance 处理）|
| 保留 | @cat-kit/be, sass-embedded, vue-tsc, @inquirer/prompts, execa |

更新 sample/ 中涉及旧包的导入路径（8 处 cat-kit 导入）。

完成标准：依赖声明与实际使用一致，`bun install` 无警告。

### 8. 端到端验证

| 验证项 | 验证方式 | 通过标准 |
|--------|---------|---------|
| 依赖安装 | `bun install` | 退出码 0，无 peer 依赖缺失警告 |
| 开发服务器 | `cd sample && bun dev` | 启动成功，浏览器访问 localhost:7788 能渲染组件 |
| 生产构建 | `cd build && bun index.ts` | 各包 dist/ 输出 JS/DTS/CSS 文件，无编译错误 |
| 产物消费 | `cd sample && bun run build` | sample 的 vite build 能正确消费构建产物 |

完成标准：四项全部通过。

## 影响范围

## 历史补丁
