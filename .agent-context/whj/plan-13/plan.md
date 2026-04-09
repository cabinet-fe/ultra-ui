# Utils 样式代码重构

> 状态: 未执行

## 目标

将 `@ultra-ui/utils` 中的样式相关代码按职责迁移至 `compositions` 和 `desktop` 包：TS 主题逻辑迁入 `compositions`（与现有 `load-theme.ts` 整合），部分 SCSS 代码迁入 `desktop`。BEM SCSS 基础设施（`_mixins.scss`、`_vars.scss`、`_functions.scss`）保留在 `utils` 中，因为 `directives` 包也依赖这些 SCSS 文件，迁至 desktop 会产生循环依赖。BEM 工具函数（`make-bem.ts`、`class-name.ts`）和 DOM 样式辅助（`style.ts`）同样保留在 utils 中。

本次为纯内部 monorepo 迁移，无外部消费者需考虑兼容过渡。

## 内容

### 1. 在 desktop 中创建 styles 目录

在 `packages/desktop/src/styles/` 下创建以下结构，仅包含从 utils 迁出的非 BEM SCSS 文件：

```
packages/desktop/src/styles/
├── normalize.scss    ← 从 utils/src/styles/ 迁入
└── anime/
    ├── fade.scss     ← 从 utils/src/styles/anime/ 迁入
    ├── slide.scss    ← 从 utils/src/styles/anime/ 迁入
    ├── spring.scss   ← 从 utils/src/styles/anime/ 迁入
    └── zoom-in.scss  ← 从 utils/src/styles/anime/ 迁入
```

BEM SCSS 基础设施（`_vars.scss`、`_mixins.scss`、`_functions.scss`）保留在 `utils/src/styles/` 中不动。

### 2. 更新 desktop 中动画 SCSS 的引用

将各组件 `style.ts` 中对 `@ultra-ui/utils/styles/anime/xxx.scss` 的导入改为从 desktop 本地路径导入：

```ts
// 旧
import '@ultra-ui/utils/styles/anime/fade.scss'
// 新
import '../../styles/anime/fade.scss'
```

涉及的 style.ts 文件通过搜索 `@ultra-ui/utils/styles/anime` 确定完整列表。

70+ 组件 SCSS 文件中的 `@use 'utils/src/styles/mixins'` 等路径**不需要变更**，因为 `_mixins.scss`、`_vars.scss`、`_functions.scss` 保留在 utils 中，Sass `loadPaths`（`packages/`）也不需要调整。

### 3. 迁移主题 TS 逻辑到 compositions

将主题相关 TS 代码从 `utils/src/styles/` 迁移到 `compositions/src/theme/` 新建子目录中，并与现有 `load-theme.ts` 整合：

1. `utils/src/styles/theme/ui-theme.ts` → `compositions/src/theme/ui-theme.ts`
   - 更新内部 import：
     - `../../utils/dom/style` → `@ultra-ui/utils`（`withUnit` 已从 utils 主入口导出）
     - `../../utils/helper/data-compat` → `@ultra-ui/utils`（`isObj`、`kebabCase`、`mergeDeep` 已从 utils 主入口导出）
     - `../helper` → `./helper`（helper.ts 同步迁移）
     - `../type` → `./type`（type.ts 同步迁移）

2. `utils/src/styles/theme/light.ts` → `compositions/src/theme/light.ts`
   - 更新 import：`../helper` → `./helper`，`../type` → `./type`

3. `utils/src/styles/theme/dark.ts` → `compositions/src/theme/dark.ts`
   - 更新 import：同 light.ts

4. `utils/src/styles/type.ts` → `compositions/src/theme/type.ts`
   - 此文件定义 `Theme`、`RGBColor` 等类型，无需修改内部 import

5. `utils/src/styles/helper.ts` → `compositions/src/theme/helper.ts`
   - 包含 `HEXToRGB`、`mixColor`（UITheme 依赖）、`cssVar`、`defineBySize`
   - 更新 import：`./type` → `./type`

6. `utils/src/styles/theme.ts` 的内容 → 整合到 `compositions/src/load-theme.ts`
   - `currentTheme` shallowRef、`setTheme` 函数的定义直接并入 `load-theme.ts`
   - 更新 import 路径指向同包内的 `./theme/ui-theme`、`./theme/light`、`./theme/dark`
   - 保持 `load-theme.ts` 现有的公开 API 不变（`loadTheme`、`setTheme`、`lightTheme`、`darkTheme`）

7. `utils/src/styles/theme/__test__/ui-theme.test.ts` → `compositions/src/theme/__test__/ui-theme.test.ts`
   - 更新 import 路径：从 `../ui-theme` 导入 UITheme，从 `../light` 导入 lightTheme 等

### 4. 更新 compositions 包的导出配置

1. 在 `compositions/src/` 下创建 `theme/index.ts`，导出所有主题公开 API：
   ```ts
   export { UITheme } from './ui-theme'
   export { lightTheme } from './light'
   export { darkTheme } from './dark'
   export type * from './type'
   export { cssVar, defineBySize, HEXToRGB, mixColor } from './helper'
   ```

2. 更新 `compositions/src/index.ts`，添加 `export * from './theme'`

3. 更新 `compositions/package.json` 的 `exports` 字段，添加 `./theme` 子路径：
   ```json
   "./theme": {
     "types": "./dist/theme/index.d.ts",
     "development": "./src/theme/index.ts",
     "import": "./dist/theme/index.js"
   }
   ```

4. 确保 `load-theme.ts` 中的 `setTheme` 和 `loadTheme` 仍然通过 `compositions/src/index.ts` 导出

### 5. 更新所有消费方的导入路径

1. `packages/desktop/src/install.ts`：
   - `import '@ultra-ui/utils/styles'` → `import './styles/normalize.scss'`（normalize 已迁至 desktop）

2. `packages/desktop/src/types/theme.ts`：
   - `import type { UITheme } from '@ultra-ui/utils/styles/theme'` → `import type { UITheme } from '@ultra-ui/compositions/theme'`

3. `packages/desktop/src/components/theme/` 下的组件文件：
   - 将所有 `@ultra-ui/utils/styles/theme` 的导入改为 `@ultra-ui/compositions` 或 `@ultra-ui/compositions/theme`

4. 各组件 `style.ts` 中的动画 SCSS 导入：参见步骤 2

5. `playgrounds/desktop/App.vue`：
   - `import { ... } from '@ultra-ui/utils/styles/theme'` → `import { ... } from '@ultra-ui/compositions/theme'`（涉及 `currentTheme`、`lightTheme`、`darkTheme`、`UITheme`）

6. `playgrounds/desktop/main.ts`：
   - `import '@ultra-ui/utils/styles'` → `import '@ultra-ui/desktop/styles/normalize.scss'`（或通过 desktop install 统一引入，确认实际需要）

### 6. 清理 utils 包

1. 删除以下文件/目录：
   - `utils/src/styles/index.ts`
   - `utils/src/styles/theme.ts`
   - `utils/src/styles/type.ts`
   - `utils/src/styles/helper.ts`
   - `utils/src/styles/normalize.scss`
   - `utils/src/styles/theme/`（整个目录）
   - `utils/src/styles/anime/`（整个目录）

2. 保留以下文件（BEM SCSS 基础设施）：
   - `utils/src/styles/_vars.scss`
   - `utils/src/styles/_mixins.scss`
   - `utils/src/styles/_functions.scss`

3. 更新 `utils/package.json`：
   - 从 `exports` 中移除 `"./styles"` 和 `"./styles/theme"` 条目
   - 保留 `"./styles/*"` 条目（SCSS 文件仍通过此路径被 Sass `@use` 消费）
   - 从 `sideEffects` 中移除 `"src/styles/**"`（剩余的 `_*.scss` partial 不是 sideEffect）

4. 更新 `utils/AGENTS.md`：移除 styles TS 模块和主题系统的描述，保留 BEM SCSS 基础设施的说明

### 7. 更新文档与验证

1. 更新 `packages/desktop/AGENTS.md`：添加 `src/styles/` 目录描述（normalize.scss + anime/）
2. 更新 `packages/compositions/AGENTS.md`：添加 `theme/` 模块描述（UITheme、预设、类型、helper 函数）
3. 更新根 `AGENTS.md`：调整 utils 包描述（移除"样式系统"），调整 compositions 包描述（添加"主题系统"）
4. 运行 `tsc --noEmit` 确认类型检查通过
5. 运行 `bun run build` 确认构建通过
6. 运行 `bun vitest` 确认测试通过（特别是 `ui-theme.test.ts` 迁移后能正常执行）
7. 启动 playground（`cd playgrounds/desktop && bun dev`）验证组件样式和主题切换正常

## 影响范围

## 历史补丁
