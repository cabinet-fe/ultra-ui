# 为 skills/ 目录添加 AGENTS.md 约束

## 补丁内容

代理编辑 `skills/` 目录下的技能文件时缺乏全局约束，容易出现源码锚点指向 monorepo 内部路径、手动修改 generated 文件、references 嵌套子目录等问题。新增 `skills/AGENTS.md` 声明这些技能的消费侧定位、目录约定和编辑约束，确保代理在后续维护或新建技能时遵循统一规范。

## 影响范围

- 新增文件: `skills/AGENTS.md`
