# 重命名 useInteraction → useUserAction 并统一"包装而非自调用"风格

## 补丁内容

用户在 `packages/compositions` 侧已自行将 `use-interaction/` 迁移为语义更贴切的 `use-user-action/`：

- 组合函数 `useInteraction` → `useUserAction`
- 返回接口 `Interaction { track, isInteracting }` → `UserActionResult { userAction, isUserActive }`
- 类型导出新增 `UserAction`（函数包装器的类型别名）

本补丁同步该迁移到所有调用点，并顺带修正之前 plan-29 里残留的"自调用"写法（`track(() => {...})()`）。新的使用风格统一为"解构 + 包装"：

```ts
const { userAction, isUserActive } = useUserAction()

// 事件处理：用 userAction 包装，不要自调用
const handleSelect = userAction((x) => { ... })

// 副作用侧：用 isUserActive() 早返
watch(() => props.modelValue, (v) => {
  if (isUserActive()) return
  ...
})
```

### 调用点逐一迁移

1. `slider.vue`
   - 导入 `useInteraction` → `useUserAction`
   - 解构改为 `{ userAction, isUserActive }`
   - watch 内部 `if (isInteracting()) return` → `if (isUserActive()) return`
   - `watch([offset1, offset2], track(...))` → `watch([offset1, offset2], userAction(...))`

2. `slider-thumb.vue`
   - 导入与解构替换
   - `useDrag` 的 `onDrag` / `onDragEnd` 处 `track(...)` → `userAction(...)`
   - `if (isInteracting()) return` → `if (isUserActive()) return`

3. `date-picker.vue`
   - 导入与解构替换
   - watch 内 `isInteracting()` → `isUserActive()`
   - 原 `await track(() => { ... })()` 自调用写法 → 抽出 `const commitSelectedDate = userAction((date) => { ... })`，`handleSelectDate` 内 `await commitSelectedDate(date)` 后再 `dropdownRef.close()`

4. `date-range-picker.vue`
   - 合并两条 `@veltra/compositions` 导入行
   - 同上 watch / `isUserActive()` 替换
   - 抽出 `const commitSelectedRange = userAction(...)`，`handleSelect` 中 `await` 之

5. `palette/di.ts`
   - `import type { Interaction }` → `import type { UserAction }`
   - DI Key 从单字段 `interaction: Interaction` 改为扁平化 `userAction: UserAction` + `isUserActive: () => boolean`（避免在子组件里多出一层 `xxx.track / xxx.isInteracting` 的别扭前缀）

6. `palette/palette.vue`
   - 导入替换；`const interaction = useInteraction()` → `const { userAction, isUserActive } = useUserAction()`
   - `handleClear` 原 `interaction.track(() => {...})()` 自调用 → `const handleClear = userAction(() => {...})`
   - watch 内 `interaction.isInteracting()` → `isUserActive()`
   - `provide(PaletteDIKey, { ..., interaction, ...rest })` → `{ ..., userAction, isUserActive, ...rest }`

7. `palette/palette-sv.vue` / `palette/palette-hue.vue`
   - `inject(PaletteDIKey)!` 解构改为 `{ ..., userAction }`
   - `interaction.track(...)` → `userAction(...)`

8. `palette/palette-alpha.vue`
   - 解构中补入 `isUserActive`，调用点 `interaction.track` / `interaction.isInteracting()` 同步替换

9. `cascade/cascade.vue`
   - 导入与解构替换
   - 传给 `useSelect` / `useCheck` 的字段 `updater` → `isUserActive`（只需查询能力即可，不需要传整个 result）
   - `handleClick` 内部条件分支的自调用 `interaction.track(() => {...})()` → 提取命名包装 `commitSingleSelect = userAction(...)`，再在 `handleClick` 中按条件调用
   - `handleCheck` 从普通函数+自调用 → 直接 `const handleCheck = userAction((item, checked) => { checkItem(item, checked) })`

10. `cascade/use-select.ts` / `cascade/use-check.ts`
    - 移除 `import type { Interaction } from '@veltra/compositions'`
    - 入参由 `interaction: Interaction` 收窄为 `isUserActive: () => boolean`
    - 内部 `interaction.isInteracting()` → `isUserActive()`

### 文档与技能

- `packages/compositions/AGENTS.md`：模块表 `use-interaction / useInteraction` 行更新为 `use-user-action / useUserAction`
- `skills/veltra-compositions/SKILL.md`：
  - 描述段落 "更新锁等逻辑" → "用户动作追踪等逻辑"
  - 导入约定代码块中 `useInteraction` → `useUserAction`
  - 函数速查表对应行：`useUserAction | 用户动作期间阻断 modelValue 回流副作用 | 无 | { userAction, isUserActive }`
  - 按场景选用里加粗条目补充使用规范：`userAction(fn)` 包装事件处理函数（不要自调用），副作用侧用 `isUserActive()` 早返
- `skills/veltra-compositions/references/api-map.md`：模块总览 `use-interaction` → `use-user-action`
- 运行 `bun tools/skills-sync/sync-veltra-compositions.ts`：自动删除 `generated/modules/use-interaction.md`、新建 `use-user-action.md`，并更新 `generated/manifest.json`

### 校验

- `bun run check-types`：16 tasks，全部通过
- `bun run lint`：0 errors（118 warnings 均为已存在的变量遮蔽等历史项，非本补丁引入）

## 影响范围

- 修改文件: `packages/desktop/src/components/slider/slider.vue`
- 修改文件: `packages/desktop/src/components/slider/slider-thumb.vue`
- 修改文件: `packages/desktop/src/components/date-picker/date-picker.vue`
- 修改文件: `packages/desktop/src/components/date-range-picker/date-range-picker.vue`
- 修改文件: `packages/desktop/src/components/palette/di.ts`
- 修改文件: `packages/desktop/src/components/palette/palette.vue`
- 修改文件: `packages/desktop/src/components/palette/palette-sv.vue`
- 修改文件: `packages/desktop/src/components/palette/palette-hue.vue`
- 修改文件: `packages/desktop/src/components/palette/palette-alpha.vue`
- 修改文件: `packages/desktop/src/components/cascade/cascade.vue`
- 修改文件: `packages/desktop/src/components/cascade/use-select.ts`
- 修改文件: `packages/desktop/src/components/cascade/use-check.ts`
- 修改文件: `packages/compositions/AGENTS.md`
- 修改文件: `skills/veltra-compositions/SKILL.md`
- 修改文件: `skills/veltra-compositions/references/api-map.md`
- 修改文件: `skills/veltra-compositions/generated/manifest.json`
- 新增文件: `skills/veltra-compositions/generated/modules/use-user-action.md`
- 删除文件: `skills/veltra-compositions/generated/modules/use-interaction.md`
