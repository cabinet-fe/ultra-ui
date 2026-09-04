# 开发规范

包内细节以各包 `AGENTS.md` 为准（desktop / sheet / sheet-core / ai 等），本文件只写仓库级约定。

## 命名

| 对象   | 规则                          | 示例                                              |
| ------ | ----------------------------- | ------------------------------------------------- |
| 组件   | `U` + PascalCase              | `UButton`、`USelect`                              |
| CSS 类 | `u-` + BEM                    | `u-button`、`u-button__icon`                      |
| 指令   | `v` + camelCase               | `vRipple`、`vClickOutside`                        |
| 目录   | kebab-case                    | `date-picker`、`number-input`                     |
| 类型   | `<Name>Props` / `<Name>Emits` | `ButtonProps`；内部 Exposed 加 `_` 前缀，导出去掉 |

`defineOptions({ name })` 用无 `U` 的组件名（如 `Button`）。

## 目录与代码结构

- 库代码在 `packages/<pkg>/src/`。desktop / ai / sheet 的可解析组件：`src/components/<name>/` 同时有 `index.ts`（导出 `U*`）与 `style.ts`。
- desktop 类型在 `src/types/<name>.ts`，不放组件目录。
- 增删 desktop / ai / sheet 组件后，仓库根跑 `bun run resolver:gen`，并视情况更新 playground 演示与 `skills/veltra-ui`。
- 别名（dev）：`@veltra/<pkg>` → `packages/<pkg>/src`（各包 tsconfig / vite 的 `paths`）。
- playground 演示：`playground/src/desktop/<name>/index.vue` 等，导航登记在 `nav-config.ts`。

## 代码风格

- 格式化 / lint：根 `vite.config.ts` 的 `fmt`、`lint`。不要复述规则，改配置即改行为。
- 注释与包内 AGENTS：中文；技术标识保留英文。
- 禁止 `@ts-ignore`、`skipLibCheck`、以及 `eslint-disable` 一类跳过检查的注释。
- TypeScript 6.x，各包 tsconfig 基于 `@cat-kit/tsconfig`。
- `sideEffects`：组件 `style.ts`、指令样式、`@veltra/styles` 的 `.scss` / 副作用入口、`.css`、`.scss`。
- Sass 用 `pkg:@veltra/styles/...`，不要硬编码颜色/阴影；暗色走 token，组件内不写 `[data-theme]` 分支。
- macOS clone 后 `core.ignorecase=false`（`scripts/setup-git.ts` / postinstall）。

## 测试

- 单测：包内 `__test__/` 或 `*.test.ts`，Vitest，环境 happy-dom（sheet-core grid 另有 canvas mock）。
- 根 `bun run test`（`vp test`）；单包 `cd packages/<pkg> && vp test`。
- 根 `test.projects`：desktop、ai、styles、utils、compositions、sheet-core、sheet、playground。未列入的包当前无统一 test 项目。
- 改公开行为或修 bug 应补/更新测试。没有「每个 PR 必须新增用例」的额外门禁；CI `ci:verify` 会跑全量测试。

## 接口

- 对宿主的契约是各包 `exports`（含 `veltra-dev` → src、`import` → dist）。不要把未导出的类成员方法当公开 API（sheet-core 已标明内部写入口）。
- 内部 `@veltra/*` peer 用 `workspace:^`，**不要改回 `workspace:*`**（changesets 会把范围内升级连锁成 major）。
- `@veltra/sheet-core` 对 desktop 是 optional peer（仅 file-viewer 的 Excel/CSV 预览）。sheet 主入口不 re-export sheet-core。

## 版本与发布

- changesets：`vp changeset` / `bun run changeset`。`fixed` 两组同版本——核心 `utils/styles/compositions/directives/desktop`，表格 `sheet/sheet-core`；`ai` / `icons` / `vite` 独立版本线。
- `ignore`：`@veltra/mobile`、`playground`。
- `___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH.onlyUpdatePeerDependentsWhenOutOfRange` 已开。
- 发版：在 `dev` 上 `bun run release`（见 `scripts/release.ts`），CI 测完构建并 publish。
- commit：`simple-git-hooks` → `cat-cli verify-commit`，格式 `<type>[(<scope>)][!]: <subject>`。pre-commit：`vp staged`。提交前本地应过 `bun run lint`。
- 编码后宣称完成前：`bun run lint`、`bun run test`、`bun run build`。

## 明确禁止

- cooking `spec.md` 缺少可被 `spec-files.mjs parse` 通过的「影响文件」章节
- 手改生成物：`packages/vite/src/components.gen.ts`；`packages/icons` 的 `normal.ts` / `colorful.ts` / `vue/`
- compositions re-export `@veltra/styles/theme`
- 用 lint disable / `@ts-ignore` 绕过检查
- 把规范全文写回根 `AGENTS.md`
