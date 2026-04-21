# 将 use-lock 重构为语义化的 use-interaction

> 状态: 已执行

## 目标

`@veltra/compositions` 中的 `useUpdateLock` 名义上是"更新锁"，但在组件中的真实语义是"用户正在交互，阻断由 `modelValue` 回流引起的同步副作用"。当前 API `{ update, updateAndLock }` 语义隐晦：`update(fn)` 实际是"未交互时才执行"，`updateAndLock(fn)` 是"标记交互中并执行"。调用方需要理解内部锁计数才能正确使用，易出错。

本次重构将其改名为 `useInteraction`，返回：

1. **闭包包装函数** `track(fn)`：把一次用户触发的业务函数包装为"执行期间标记为交互中"的新函数，调用方自然地在事件/watch 回调处包装
2. **状态查询函数** `isInteracting()`：副作用方自行判断，如 `if (isInteracting()) return`

以更贴近真实使用意图的表达，消除调用方对"锁"的心智负担，并在仓库内 6 个桌面组件的调用点全部切换。

## 内容

1. 新增 `packages/compositions/src/use-interaction/index.ts`：
   - 导出接口 `Interaction`，包含两个成员：
     - `track<F extends (...args: any[]) => any>(fn: F): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>`
     - `isInteracting(): boolean`
   - 导出函数 `useInteraction(): Interaction`，内部以 `interactingCount` 计数：
     - `track` 返回的异步函数在调用时先 `interactingCount++`，`try { return await fn(...args) } catch (e) { console.error(e); throw e }`，随后 `await nextTick()` 再 `interactingCount--`；对 `fn` 返回的 Promise 使用 `Awaited<ReturnType<F>>` 作为解包类型
     - `isInteracting()` 返回 `interactingCount > 0`
   - 顶部 JSDoc 说明用途、与 `modelValue` 同步副作用的典型搭配示例（`watch(() => props.modelValue, ...) + if (isInteracting()) return`）
   - 错误处理行为保留与原 `updateAndLock` 一致的 `console.error`，同时向外抛出，避免静默吞错导致包装函数的调用方 `await` 链断裂
2. 修改 `packages/compositions/src/index.ts`：将 `export * from './use-lock'` 替换为 `export * from './use-interaction'`
3. 删除目录 `packages/compositions/src/use-lock/`（含 `index.ts`）
4. 改造 `packages/desktop/src/components/slider/slider.vue`：
   - 导入替换为 `useInteraction`
   - `const { updateAndLock, update } = useUpdateLock()` → `const { track, isInteracting } = useInteraction()`
   - `watch(..., ([size, value, range]) => { update(() => { ... }) })` 改为先 `if (isInteracting()) return` 再执行原逻辑
   - `watch([offset1, offset2], (v) => { updateAndLock(() => { ...emit... }) })` 改为将 watch 回调整体用 `track(...)` 包装：`watch([offset1, offset2], track((v) => { ... }))`
5. 改造 `packages/desktop/src/components/slider/slider-thumb.vue`：
   - 导入替换，`{ updateAndLock, update } = useUpdateLock()` → `{ track } = useInteraction()`（此文件未使用 `update`）
   - `useDrag` 的 `onDrag` / `onDragEnd` 回调整体用 `track(...)` 包装（包装函数返回 Promise，`useDrag` 若不 await 也无妨；保持同步语义视觉一致：`onDrag: track(({ offsetX, offsetY }) => { updateModel(...) })`）
6. 改造 `packages/desktop/src/components/date-picker/date-picker.vue`：
   - 导入替换
   - `watch(() => props.modelValue, (modelValue) => { update(() => { currentDate.value = ... }) })` → `watch(..., (modelValue) => { if (isInteracting()) return; currentDate.value = modelValue ? date(modelValue) : undefined })`
   - `async function handleSelectDate(date) { await updateAndLock(() => {...}); dropdownRef...close() }` → 将 `handleSelectDate` 改为：先 `await track(() => { currentDate.value = date; emit('update:modelValue', date.format(formatStr.value)) })()` 再 `dropdownRef.value?.close()`
7. 改造 `packages/desktop/src/components/date-range-picker/date-range-picker.vue`：
   - 导入替换
   - `watch(() => props.modelValue, (val) => { update(() => {...}) }, { immediate: true })` → 同 step 6 的副作用写法
   - `async function handleSelect(rangeDate) { await updateAndLock(() => {...}); dropdownRef...close() }` → 同 step 6 的 `await track(...)()` 写法
8. 改造 `packages/desktop/src/components/palette/di.ts`：
   - `import type { Updater } from '@veltra/compositions'` → `import type { Interaction } from '@veltra/compositions'`
   - `PaletteDIKey` 中 `updater: Updater` 字段重命名为 `interaction: Interaction`，同步更新 JSDoc 注释为"交互追踪器"
9. 改造 `packages/desktop/src/components/palette/palette.vue`：
   - 导入替换
   - `const updater = useUpdateLock()` → `const interaction = useInteraction()`
   - `provide(PaletteDIKey, { ..., updater, ... })` 的注入值字段名改为 `interaction`（若当前文件以变量同名简写提供，需同步改名；查证后精确替换）
   - `function handleClear() { updater.updateAndLock(() => {...}) }` → `function handleClear() { interaction.track(() => {...})() }`
10. 改造 `packages/desktop/src/components/palette/palette-sv.vue`、`palette-hue.vue`、`palette-alpha.vue`：
    - 从 `inject(PaletteDIKey)!` 解构的 `updater` 全部改为 `interaction`
    - 调用处 `updater.updateAndLock(() => {...})` 全部替换为 `interaction.track(() => {...})()`
11. 改造 `packages/desktop/src/components/cascade/cascade.vue`：
    - 导入替换
    - `const updater = useUpdateLock()` → `const interaction = useInteraction()`
    - 传递给 `useSelect({..., updater, ...})` / `useCheck({..., updater, ...})` 的字段名改为 `interaction`
    - `updater.updateAndLock(() => {...})` 调用处改为 `interaction.track(() => {...})()`
12. 改造 `packages/desktop/src/components/cascade/use-select.ts` 与 `packages/desktop/src/components/cascade/use-check.ts`：
    - `import type { Updater } from '@veltra/compositions'` → `import type { Interaction } from '@veltra/compositions'`
    - 入参类型与字段 `updater: Updater` → `interaction: Interaction`
    - 函数体内使用点 `updater.updateAndLock(() => {...})` 改为 `interaction.track(() => {...})()`，其余 `updater` 引用统一改名
13. 更新 `packages/compositions/AGENTS.md`：
    - 模块列表表格中 `use-lock | useUpdateLock | 更新锁（防止并发更新）` 一行改为 `use-interaction | useInteraction | 交互追踪（阻断交互期的 modelValue 回流副作用）`
14. 更新 `skills/veltra-compositions/SKILL.md`：
    - "导入约定"代码块中 `useUpdateLock` 替换为 `useInteraction`
    - "函数速查"表格中对应行改为 `useInteraction | 交互期间阻断 modelValue 回流副作用 | 无 | { track, isInteracting }`
    - "按场景选用 > 状态与并发"条目中 `useUpdateLock` 条目改为 `useInteraction`，描述改为"用户交互期间阻断由 modelValue 引起的同步副作用"
15. 更新 `skills/veltra-compositions/references/api-map.md`：
    - "模块总览"列表中 `use-lock` 改为 `use-interaction`
16. 从仓库根运行 `bun run sync-veltra-compositions` 重新生成 `skills/veltra-compositions/generated/manifest.json` 与 `generated/modules/use-interaction.md`（原 `use-lock.md` 会被覆盖/移除，由同步脚本负责，不手动编辑）
17. 从仓库根运行 `bun run check-types` 校验全部包类型；运行 `bun run lint` 校验代码风格；存在错误则定位对应文件修正后重跑，直至通过

## 影响范围

- `packages/compositions/src/use-user-action/index.ts`（新增；由 `use-interaction` 重命名迁移）
- `packages/compositions/src/use-lock/index.ts`（删除，含目录）
- `packages/compositions/src/index.ts`
- `packages/compositions/AGENTS.md`
- `packages/desktop/src/components/slider/slider.vue`
- `packages/desktop/src/components/slider/slider-thumb.vue`
- `packages/desktop/src/components/date-picker/date-picker.vue`
- `packages/desktop/src/components/date-range-picker/date-range-picker.vue`
- `packages/desktop/src/components/palette/di.ts`
- `packages/desktop/src/components/palette/palette.vue`
- `packages/desktop/src/components/palette/palette-sv.vue`
- `packages/desktop/src/components/palette/palette-hue.vue`
- `packages/desktop/src/components/palette/palette-alpha.vue`
- `packages/desktop/src/components/cascade/cascade.vue`
- `packages/desktop/src/components/cascade/use-check.ts`
- `packages/desktop/src/components/cascade/use-select.ts`
- `skills/veltra-compositions/SKILL.md`
- `skills/veltra-compositions/references/api-map.md`
- `skills/veltra-compositions/generated/manifest.json`（`sync-skills` 自动生成）
- `skills/veltra-compositions/generated/modules/use-user-action.md`（`sync-skills` 自动生成；原 `use-lock.md` / `use-interaction.md` 被移除）

## 历史补丁

- patch-1: 重命名 useInteraction → useUserAction 并统一"包装而非自调用"风格
