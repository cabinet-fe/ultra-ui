# AGENTS.md — skills/

本目录存放面向 **消费侧项目** 的文档型技能。每个技能对应 `packages/` 下的一个库（如 `veltra-desktop` 对应 `@veltra/desktop`），为 AI 代理提供接口文档、使用模式和排错指南。

## 核心前提

这些技能的目标读者是 **依赖 `@veltra/*` 的真实项目**，而非本 monorepo 自身。因此：

- 所有源码锚点（快速源码锚点、source-discovery）都指向 `node_modules/@veltra/*/...`，不指向 `packages/*/src/...`
- 描述 API 时以 npm 发布产物为准（`dist/` 目录下的 `.mjs`、`.d.mts`），不引用构建前的私有模块
- 示例代码中的导入路径使用包名（`@veltra/desktop`、`@veltra/compositions`），不使用 workspace 路径别名

## 目录约定

```
skills/
├── AGENTS.md                      # 本文件
└── veltra-{name}/                 # 技能目录，与包名对应
    ├── SKILL.md                   # 技能入口（触发词、分类概览、约束）
    ├── agents/
    │   └── openai.yaml            # OpenAI agent 注册描述
    ├── references/                # 手写参考文档（一层深度，不嵌套子目录）
    │   ├── source-discovery.md    # 定位安装产物与类型声明
    │   └── *.md                   # 其他主题参考
    ├── generated/                 # 脚本产物（仅 veltra-desktop 等需要时存在）
    │   └── *.md
    └── scripts/                   # 同步/生成脚本（仅需要时存在）
        └── sync-docs.ts
```

## 编辑约束

1. **不要修改 `generated/` 下的文件** — 这些文件由 `scripts/` 中的脚本生成，手动改动会在下次同步时被覆盖
2. **references/ 保持一层深度** — 不创建子目录，所有参考文档直接放在 `references/` 下
3. **SKILL.md 不超过 500 行** — 保持精简，详细内容放到 references/ 或 generated/
4. **不引入运行时依赖** — 技能目录只包含文档（`.md`）、元数据（`.yaml`/`.json`）和脚本（`.ts`），不包含可被业务代码 import 的模块
5. **技能之间不交叉引用源文件** — 每个技能独立完整；跨包关联通过 SKILL.md 中的"顺带查这些 skill"段落指引，不通过相对路径引用其他技能的内部文件

## 新建技能清单

创建新技能时确认以下项目：

- [ ] `SKILL.md` frontmatter 包含 `name` 和 `description`（含触发词）
- [ ] `agents/openai.yaml` 已创建
- [ ] `references/source-discovery.md` 已编写（描述如何在消费项目中定位包产物）
- [ ] 源码锚点指向 `node_modules/` 而非 `packages/`
- [ ] 示例代码使用包名导入，非 workspace 别名
