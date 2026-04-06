# Monorepo 重构与依赖迁移

> 状态: 已执行

## 目标

将单包 ui/ 拆分为 4 个独立子包（@ultra-ui/core、@ultra-ui/styles、@ultra-ui/pc、@ultra-ui/directives），完成 cat-kit → @cat-kit/* 和 @ultra/icon → lucide-vue-next 依赖迁移，解决 SCSS 跨包引用和循环依赖问题，为 1.0 版本建立新架构。

## 内容

### 1. 迁移代码文件

使用 `git mv` 按以下映射移动文件（先移动文件，再更新配置，避免中间态 workspace 解析失败）：

| 源路径 | 目标路径 |
|--------|----------|
| ui/utils/ | packages/core/src/utils/ |
| ui/compositions/ | packages/core/src/compositions/ |
| ui/shared/ | packages/core/src/shared/ |
| ui/types/component-common.ts | packages/core/src/types/component-common.ts |
| ui/types/helper.ts | packages/core/src/types/helper.ts |
| ui/types/utils/ | packages/core/src/types/utils/ |
| ui/styles/ | packages/styles/src/ |
| ui/directives/ | packages/directives/src/ |
| ui/components/（71 个组件目录） | packages/pc/src/components/ |
| ui/types/components/ | packages/pc/src/types/ |
| ui/install.ts | packages/pc/src/install.ts |

`ui/index.ts` 不移动，需重写为 packages/pc/src/index.ts（导出内容不同）。

完成标准：所有源码文件在新位置就位，ui/ 仅剩 package.json 和 tsconfig.json（下一步清理）。

### 2. 创建子包配置并更新根配置

**packages/core/package.json**（@ultra-ui/core）：
```json
{
  "name": "@ultra-ui/core",
  "version": "1.0.0",
  "type": "module",
  "module": "./src/index.ts",
  "exports": { ".": "./src/index.ts", "./*": "./src/*" },
  "dependencies": { "@cat-kit/core": "^1.0.0" },
  "peerDependencies": { "vue": "^3.5.27" }
}
```

**packages/styles/package.json**（@ultra-ui/styles）：
```json
{
  "name": "@ultra-ui/styles",
  "version": "1.0.0",
  "type": "module",
  "module": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "sideEffects": ["*.css", "*.scss", "src/index.ts"],
  "dependencies": { "@ultra-ui/core": "workspace:*" },
  "peerDependencies": { "vue": "^3.5.27" },
  "devDependencies": { "sass-embedded": "^1.97.3" }
}
```
说明：styles 的 TS 代码（theme.ts、theme/ui-theme.ts）依赖 @ultra-ui/core（isObj/kebabCase/merge/withUnit）和 vue（shallowRef/reactive/watch），因此需要声明这两个依赖。

**packages/pc/package.json**（@ultra-ui/pc）：
```json
{
  "name": "@ultra-ui/pc",
  "version": "1.0.0",
  "type": "module",
  "module": "./src/index.ts",
  "exports": { ".": "./src/index.ts", "./*": "./src/*" },
  "sideEffects": ["src/components/**/style.js", "src/components/**/style.ts", "*.css", "*.scss"],
  "dependencies": {
    "@ultra-ui/core": "workspace:*",
    "@ultra-ui/styles": "workspace:*",
    "@ultra-ui/directives": "workspace:*",
    "lucide-vue-next": "^0.500.0",
    "@floating-ui/dom": "^1.7.5",
    "@codemirror/lang-java": "^6.0.2",
    "@codemirror/lang-javascript": "^6.2.4",
    "@codemirror/lang-json": "^6.0.2",
    "@codemirror/lang-sql": "^6.10.0",
    "@codemirror/state": "^6.5.3",
    "@codemirror/view": "^6.39.12",
    "codemirror": "^6.0.2",
    "@lexical/clipboard": "^0.40.0",
    "@lexical/history": "^0.40.0",
    "@lexical/html": "^0.40.0",
    "@lexical/link": "^0.40.0",
    "@lexical/list": "^0.40.0",
    "@lexical/rich-text": "^0.40.0",
    "@lexical/selection": "^0.40.0",
    "@lexical/utils": "^0.40.0",
    "@tanstack/vue-virtual": "^3.13.18",
    "lexical": "^0.40.0"
  },
  "peerDependencies": { "vue": "^3.5.27" }
}
```

**packages/directives/package.json**（@ultra-ui/directives）：
```json
{
  "name": "@ultra-ui/directives",
  "version": "1.0.0",
  "type": "module",
  "module": "./src/index.ts",
  "exports": { ".": "./src/index.ts", "./*": "./src/*" },
  "sideEffects": ["*.css", "*.scss", "src/**/style.js", "src/**/style.ts"],
  "dependencies": {
    "@ultra-ui/core": "workspace:*",
    "@ultra-ui/styles": "workspace:*"
  },
  "peerDependencies": { "vue": "^3.5.27" }
}
```

每个子包创建 `tsconfig.json`（继承根配置）。

**根 package.json** workspaces 更新为 `["packages/*", "sample", "cli", "build"]`。

**根 tsconfig.json** references 更新为指向 4 个子包。

删除旧的 `ui/package.json`、`ui/tsconfig.json` 及空的 `ui/` 目录。

完成标准：`bun install` 通过，workspace 解析正确。

### 3. 解决 SCSS 跨包引用

**策略**：使用 sass `loadPaths` 配置，将 `packages/styles/src/` 加入加载路径，使组件 SCSS 可以直接引用样式基础设施。

**变更内容**：将 72 个 SCSS 文件中的相对路径引用改为 loadPaths 解析：

| 旧引用 | 新引用 |
|--------|--------|
| `@use '../../styles/mixins' as m;` | `@use 'mixins' as m;` |
| `@use '../../styles/vars';` | `@use 'vars';` |
| `@use '../../styles/functions' as fn;` | `@use 'functions' as fn;` |

涉及文件：
- 71 个组件 `style.scss`（packages/pc/src/components/\*/style.scss）
- 1 个指令 `style.scss`（packages/directives/src/ripple/style.scss）

`loadPaths` 配置位置（后续 Plan-5 中具体实现）：
- vite 开发环境：`css.preprocessorOptions.scss.loadPaths`
- 构建环境：sass `compileAsync` 的 `loadPaths` 参数

完成标准：在配置了 `loadPaths: ['packages/styles/src']` 的环境下，所有 SCSS 文件 `@use` 语句可正确解析。

### 4. 解决循环依赖

当前 `ui/styles/index.ts` 导入了 5 个组件样式（context-menu、message、notification、message-confirm、loading），迁移后会形成 styles → pc → styles 循环。

**解决方案**：将这 5 个组件样式导入从 styles 包移至 pc 包。

具体操作：
- `packages/styles/src/index.ts` 仅保留 `import './normalize.scss'` 和主题系统导出
- 新建 `packages/pc/src/global-styles.ts`，内容为：
  ```typescript
  import '@ultra-ui/styles'
  import './components/context-menu/style'
  import './components/message/style'
  import './components/notification/style'
  import './components/message-confirm/style'
  import './components/loading/style'
  ```
- `packages/pc/src/install.ts` 中导入 `./global-styles`

完成标准：`@ultra-ui/styles` 不依赖 `@ultra-ui/pc`，无循环依赖。

### 5. 更新内部导入路径

将所有 `@ui/*` 路径别名替换为新包名或包内相对路径：

**跨包导入（使用包名）**：
| 旧路径 | 新路径 | 使用场景 |
|--------|--------|----------|
| `@ui/utils/*` | `@ultra-ui/core` | pc/directives 包引用 core 中的工具函数 |
| `@ui/compositions/*` | `@ultra-ui/core` | pc 包引用 core 中的组合式函数 |
| `@ui/shared/*` | `@ultra-ui/core` | pc 包引用 core 中的共享常量 |
| `@ui/types` (component-common/helper/utils) | `@ultra-ui/core` | pc 包引用 core 中的通用类型 |
| `@ui/styles/*` | `@ultra-ui/styles` | pc/directives 包引用 styles |
| `@ui/directives/*` | `@ultra-ui/directives` | pc 包引用 directives |

**包内导入（使用相对路径）**：
| 旧路径 | 处理方式 | 使用场景 |
|--------|----------|----------|
| `@ui/utils/*` | `../utils/*` 等相对路径 | core 包内部互引 |
| `@ui/types/components/*` | `../types/*` 相对路径 | pc 包内组件引用组件类型 |
| `@ui/components/*` | `../xxx/*` 相对路径 | pc 包内组件互引 |

**style.ts 中的跨包导入**：
| 旧导入 | 新导入 | 出现次数 |
|--------|--------|----------|
| `@ui/styles/anime/zoom-in.scss` | `@ultra-ui/styles/anime/zoom-in.scss` | 7 |
| `@ui/styles/anime/fade.scss` | `@ultra-ui/styles/anime/fade.scss` | 4 |
| `@ui/styles/anime/slide.scss` | `@ultra-ui/styles/anime/slide.scss` | 1 |
| `@ui/styles/anime/spring.scss` | `@ultra-ui/styles/anime/spring.scss` | 1 |
| `@ui/directives/ripple/style` | `@ultra-ui/directives/ripple/style` | 7 |
| `@ui/directives/ripple/style.scss` | `@ultra-ui/directives/ripple/style.scss` | 1 |
| `../../styles/anime/zoom-in.scss` | `@ultra-ui/styles/anime/zoom-in.scss` | 1（context-menu） |

**兄弟组件样式引用**（23 种路径如 `../icon/style`、`../input/style`）保持相对路径不变（同在 pc 包内）。

完成标准：项目中不存在 `@ui/` 前缀的导入。

### 6. 替换 cat-kit → @cat-kit/*

**确认可用的直接映射**（API 名称和用法不变，仅导入路径变化）：

| 旧导入路径 | 新导入路径 | API 名称 |
|-----------|-----------|----------|
| cat-kit/fe | @cat-kit/core | isObj, isUndef, n, date, Dater, debounce, Forest, TreeNode, safeRun, last, sleep |
| cat-kit/be | @cat-kit/be | existModule |

**需确认 API 签名是否变化的项**（实施时逐一验证）：

| API | 旧用法 | 新包可能的用法 | 出现次数 |
|-----|--------|---------------|----------|
| pick(obj, keys) | 独立函数 | `o(obj).pick(keys)` 或仍有独立导出 | 4 |
| omit(obj, keys) | 独立函数 | `o(obj).omit(keys)` 或仍有独立导出 | 5 |
| merge(target, source) | 独立函数 | `o(target).merge(source)` 或仍有独立导出 | 1 |
| kebabCase(str) | 独立函数 | `str(s).kebabCase()` 或仍有独立导出 | 2 |
| getChainValue(obj, path) | 独立函数 | 可能为 `o(obj).get(path)` 或不存在 | 17 |
| setChainValue(obj, path, val) | 独立函数 | 可能为 `o(obj).set(path, val)` 或不存在 | 4 |
| Tree(options) | 类构造 | 可能更名为 TreeManager | 6 |
| Tween | 动画补间类 | @cat-kit/core 文档中未找到，可能在 @cat-kit/fe 或已移除 | 2 |
| obj(value) | 对象包装 | 可能对应 o(value) | 3 |
| objMap(obj, fn) | 独立函数 | 可能不存在，需手动实现 | 1 |
| equal(a, b) | 深度比较 | 可能不存在，需手动实现 | 1 |

**验证策略**：实施时先执行 `bun -e "import * as m from '@cat-kit/core'; console.log(Object.keys(m))"` 获取完整导出列表，逐一比对。若 API 不存在或签名变化，按以下优先级处理：
1. 使用新包的等价 API（如 `o(obj).pick()`）
2. 在 @ultra-ui/core 中封装兼容层
3. 内联实现（仅限简单函数如 objMap、equal）

**涉及文件范围**：
- packages/core/src/ 内 5 处
- packages/styles/src/ 内 1 处（theme/ui-theme.ts）
- packages/directives/src/ 内 1 处
- packages/pc/src/ 内 60 处
- cli/ 内 3 处（readDir → @cat-kit/be 的 readDirRecursive，camelCase → @cat-kit/core 的 str().camelCase()）
- sample/ 内 8 处

完成标准：项目中不存在非 `@cat-kit` 前缀的 cat-kit 导入。

### 7. 替换 @ultra/icon → lucide-vue-next

完整图标映射表（38 个文件，26 个唯一图标名）：

| @ultra/icon | lucide-vue-next | 使用文件数 |
|-------------|-----------------|-----------|
| ArrowDown | ArrowDown | 7 |
| ArrowUp | ArrowUp | 1 |
| ArrowLeft | ArrowLeft | 1 |
| ArrowRight | ArrowRight | 8 |
| DArrowLeft | ChevronsLeft | 3 |
| DArrowRight | ChevronsRight | 3 |
| Close | X | 10 |
| Search | Search | 4 |
| Plus | Plus | 3 |
| Minus | Minus | 2 |
| Check | Check | 1 |
| Loading | LoaderCircle | 2 |
| View | Eye | 2 |
| Hide | EyeOff | 1 |
| Calendar | Calendar | 2 |
| Copy | Copy | 2 |
| Edit | Pencil | 1 |
| Delete | Trash2 | 2 |
| Move | Move | 1 |
| Empty | PackageOpen | 1 |
| QuestionFilled | CircleHelp | 1 |
| Maximum | Maximize | 1 |
| Recover | Minimize | 1 |
| AddChild | CopyPlus | 2 |
| InsertToPrev | BetweenVerticalStart | 1 |
| InsertToNext | BetweenVerticalEnd | 1 |

每处导入需同时替换：
- 导入路径：`'@ultra/icon'` → `'lucide-vue-next'`
- 组件名称：按上表映射（如 `Close` → `X`、`DArrowLeft` → `ChevronsLeft`）

完成标准：项目中不存在 `@ultra/icon` 导入。

### 8. 编写各包入口文件

**packages/core/src/index.ts**：barrel re-export 所有子模块：
```typescript
export * from './utils'
export * from './compositions'
export * from './shared'
export * from './types/component-common'
export * from './types/helper'
export type * from './types/utils'
```
具体导出项需扫描各子目录的现有 export 确定。

**packages/styles/src/index.ts**：仅保留初始化和主题导出：
```typescript
import './normalize.scss'
export * from './theme'
```
（不再导入组件样式，已移至 pc 包的 global-styles.ts）

**packages/directives/src/index.ts**：导出 3 个指令（vRipple, vClickOutside, vFocus）。

**packages/pc/src/index.ts**：导出全部 71 个组件。

**packages/pc/src/install.ts**：全量注册函数 + 导入 global-styles.ts。

完成标准：每个包的入口文件完整导出该包所有公共 API。

### 9. 验证

- `bun install` 成功
- TypeScript 编译无报错（各子包 tsconfig 检查）
- 所有导入路径解析正确
- 无 `@ui/`、`cat-kit/fe`、`cat-kit/be`（非 @cat-kit）、`@ultra/icon` 残留导入

说明：当前项目测试仅覆盖 expression-editor 组件（4 个测试文件），覆盖率极低，验证以 TypeScript 编译为主。

完成标准：以上四项检查全部通过。

## 影响范围

- `packages/core/src/utils/data-structure/`（Forest/Tree 兼容实现）、`packages/core/src/utils/index.ts`
- `packages/pc/src/components/`（cascade、table、tree、menu、multi-tree-select、tree-select、message-confirm、select 等）、`packages/pc/src/types/`、`packages/pc/tsconfig.json`
- `packages/core/`、`packages/styles/`、`packages/directives/`、`packages/pc/`（新建子包与自 `ui/` 迁移的源码）
- 根目录 `package.json`、`tsconfig.json`、`vitest.config.ts`
- `sample/`（依赖、`vite.config.ts`、入口与示例中的导入与图标；`code-editor` 与示例页 `@ultra-ui/*` 导入）
- `packages/pc/src/components/code-editor/code-editor.vue`（workspace 内禁止依赖 `ultra-ui` 别名）
- `cli/`（`shared.ts`、`gen-component/render-file.ts`、子包 `package.json`）
- `build/`（`shared.ts`、`build.ts`、`build-styles.ts`、`prepare.ts`）
- 已移除原 `ui/` 目录下的 `package.json`、`tsconfig.json`、`index.ts`

**说明**：评审后已在 `packages/core` 增加与旧版 `Forest.create` / `dft` / `bft` / `nodes` / `size` 及数据树 `Tree.dft` / `Tree.dftWithPath` 对齐的实现；`packages/pc` 中 cascade / table / tree / menu 等已改为使用 `@ultra-ui/core` 的 `Forest` / `Tree` 或节点实例的 `dfs`。完整 `tsc` / `bun install` 需在证书与 registry 正常的环境执行。

## 历史补丁

- patch-1: 评审修复（Tree/Forest 兼容层、错误导入与类型、表单/消息等小问题）
- patch-2: sample 预览可运行（code-editor 与 sample 导入修复、`dev` 脚本）
