# skills 与 playground 瘦身与脚本归集

> 状态: 已执行

## 目标

缩小技能包体积与噪音：桌面技能不再内嵌 playground 全量源码；playground 仅保留路由所需的单页演示；同步脚本集中到 `tools/`，并更新文档与根脚本；生成物按更细粒度拆分且去掉代码块内的「来源」行。

## 内容

1. 新增 `tools/skills-sync/`：迁入并修正路径的 `sync-veltra-desktop.ts`、`sync-veltra-compositions.ts`、`sync-veltra-utils.ts`、`sync-veltra-styles.ts`、`sync-veltra-directives.ts`；迁入 `.agents/skills/use-cat-kit/scripts/sync-api-from-dist.ts` 为 `sync-use-cat-kit-api.ts`（输出仍指向 `.agents/skills/use-cat-kit/generated`）；可选 `sync-all.ts` 串行调用。
2. 新增 `tools/agent-context/get-context-info.mjs`（自 ac-workflow 迁入），更新 `.agents/skills/ac-workflow/SKILL.md` 与 `references/replan.md` 中的调用路径。
3. 根目录 `package.json`：`sync-veltra-*`、`sync-use-cat-kit-api`、`sync-skills` 指向 `tools/` 下脚本；删除各 `skills/*/scripts/` 与 `.agents/skills/use-cat-kit/scripts/`、`.agents/skills/ac-workflow/scripts/`。
4. `skills/AGENTS.md`：约定脚本在 `tools/skills-sync/`，generated 仍勿手改。
5. veltra-desktop 同步逻辑：`generated/components/<name>.md` 每组件仅类型 fenced；`generated/categories/<key>.md` 为分类索引（链接至 components）；保留 `catalog.md`、`shared-types.md`、`manifest.json`；代码块内不写 `// 来源` 或 playground 路径。
6. compositions/utils/directives/styles 同步：去掉 fenced 内「来源」行；compositions 按模块拆成 `generated/modules/<use-xxx>.md`；utils 按原 section 拆成多文件；directives 按指令组分文件；styles 三文件保留结构仅去来源行。
7. playground：合并仅被 `index.vue` 引用的子页面（table、steps、form、tabs）为单文件；删除冗余长文案与重复子文件；保留 `router.ts` 的 index-only 约定。
8. 更新 `skills/veltra-desktop/SKILL.md`、`.agents/skills/use-cat-kit/SKILL.md` 与相关 references 中的脚本路径说明。
9. 执行 `bun tools/skills-sync/sync-all.ts`（或等价命令）重新生成全部 `generated/` 与 use-cat-kit（若 dist 存在则复制；否则仅跑 veltra 系列）。

## 影响范围

- `tools/skills-sync/*`、`tools/agent-context/get-context-info.mjs`
- `package.json`（sync 脚本）
- `skills/**/SKILL.md`、`skills/AGENTS.md`、`skills/**/references/*.md`
- `.agents/skills/ac-workflow/SKILL.md`、`.agents/skills/ac-workflow/references/replan.md`
- `.agents/skills/use-cat-kit/SKILL.md`、`.agents/skills/use-cat-kit/references/_meta.md`
- `playgrounds/desktop/src`（table、steps、form、tabs、card、input 等演示精简）
- `skills/*/generated/**`（由同步脚本重写）
- 已删除：`skills/*/scripts/`、`.agents/skills/use-cat-kit/scripts/`、`.agents/skills/ac-workflow/scripts/`

## 历史补丁
