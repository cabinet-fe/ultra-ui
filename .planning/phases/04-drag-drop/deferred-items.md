# Deferred Items

## Out-of-Scope Discoveries

- `bunx tsc -p ui/tsconfig.json --noEmit` fails on many pre-existing `TS2307` module resolution errors for `ui/components/**/index.ts` importing local `.vue` files (including but not limited to `ui/components/action/index.ts`, `ui/components/button/index.ts`, `ui/components/expression-editor/index.ts`).
- These errors are unrelated to Phase `04-01` drag-drop implementation scope and were not introduced by this plan execution.
