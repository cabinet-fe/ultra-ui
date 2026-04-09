# AGENTS.md — tools/build

构建流水线，将 `packages/desktop/src` 编译为可发布的 `dist/` 产物。

## 命令

```bash
cd tools/build
bun index.ts            # 构建
bun index.ts --release  # 构建 + 交互式选版本号 + 发布
```

## 构建流程

```
boot()
 ├── [release] promptVersion() + updateVersion()   # 仅 --release 时
 ├── build()          → JS/DTS 编译
 ├── buildStyles()    → SCSS 编译 + 样式入口 JS
 ├── copyFiles()      → 复制 README、SCSS 源文件、字体
 ├── genFiles()       → 生成发布用 package.json + version.js
 └── [release] release(version)                     # 仅 --release 时
```

## 文件说明

| 文件 | 职责 |
| ---- | ---- |
| `index.ts` | 入口：主包 `build()` 后 **以 Node 子进程** 执行 `cli-build-styles.ts`（`tsx`），再 `copyFiles` / `genFiles`（避免 Bun 同进程二次加载 sass 崩溃） |
| `cli-build-styles.ts` | 仅调用 `buildStyles()`，供子进程执行 |
| `build.ts` | tsdown 编译 desktop/src 的 JS + DTS（unbundle 模式，Vue/JSX 插件） |
| `build-styles.ts` | 三轮 tsdown：desktop 组件样式 → directives 样式 → `@ultra-ui/styles` 的 normalize 入口；scss 插件用 sass-embedded + `NodePackageImporter`（`ROOT`）编译 |
| `prepare.ts` | copyFiles（README、`packages/styles/src` 下 SCSS 源、字体占位）+ genFiles（发布 package.json、version.js） |
| `release.ts` | npm publish 流程 |
| `shared.ts` | 路径常量 + workspace 别名映射 |

## 路径常量（shared.ts）

| 常量 | 指向 |
| ---- | ---- |
| `ROOT` | 仓库根 |
| `PACKAGES` | `packages/` |
| `DESKTOP_PKG` | `packages/desktop` |
| `DESKTOP_SRC` | `packages/desktop/src` |
| `UTILS_SRC` | `packages/utils/src` |
| `STYLES_PKG` / `STYLES_SRC` | `packages/styles`、`packages/styles/src` |
| `COMPOSITIONS_SRC` | `packages/compositions/src` |
| `DIRECTIVES_SRC` | `packages/directives/src` |
| `DIST_ROOT` | `dist/`（仓库根） |
| `workspaceTsAliases` | 构建时别名映射（`@ultra-ui/*` → `packages/*/src`） |

## 产物结构

产物输出到仓库根 `dist/`：
- JS/DTS：unbundle 模式，保持源码目录结构
- CSS：SCSS 编译后按源路径映射
- 发布 `package.json`：包名 `ultra-ui`，含完整 `exports` 映射

## 依赖

- **devDependencies**：`tsdown`、`rolldown`、`sass-embedded`、`unplugin-vue`、`unplugin-vue-jsx`、`@cat-kit/be`、`@inquirer/prompts`、`execa`
