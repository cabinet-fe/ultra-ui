# 移除 project references 与全量 skipLibCheck

## 补丁内容

- 项目不采用 `tsc --build` / `tsc -b` 作为约定工作流，删除根 `tsconfig.json` 与各包 `tsconfig` 中的 `references`，避免暗示需用 solution 模式串联工程。
- 为仓库内全部 `tsconfig*.json` 的 `compilerOptions` 增加 `skipLibCheck`、`skipDefaultLibCheck`，减轻对 `.d.ts` 的重复校验以提升类型检查性能。
- TS 6 升级后的其余类型报错按用户说明留待后续新计划处理，本补丁不改动业务源码。

## 影响范围

- 修改文件: `tsconfig.json`、`tsconfig.node.json`、`packages/utils/tsconfig.json`、`packages/compositions/tsconfig.json`、`packages/directives/tsconfig.json`、`packages/mobile/tsconfig.json`、`packages/desktop/tsconfig.json`、`packages/icons/tsconfig.json`、`packages/icons/tsconfig.icons-vue.json`、`tools/build/tsconfig.json`、`tools/cli/tsconfig.json`、`playgrounds/desktop/tsconfig.json`、`playgrounds/icons/tsconfig.json`
