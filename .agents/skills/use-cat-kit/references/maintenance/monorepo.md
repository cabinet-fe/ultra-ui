# maintenance — Monorepo 与构建

## Monorepo 类

```typescript
import { Monorepo } from '@cat-kit/maintenance'

const repo = new Monorepo(rootDir?)  // 默认 cwd，必须绝对路径
repo.root       // { dir, pkg, workspacePatterns }
repo.workspaces // [{ name, dir, version, pkg, private }]
```

### validate

```typescript
const r = repo.validate()
// { valid, hasCircular, circularChains, inconsistentDeps }
```

### buildDependencyGraph

```typescript
const g = repo.buildDependencyGraph({ includeExternal? })
// { nodes, edges, mermaid }
```

## WorkspaceGroup

```typescript
const group = repo.group(['@cat-kit/core', '@cat-kit/fe'])
```

### build — 依赖感知分批并行构建

```typescript
await group.build({
  '@cat-kit/fe': {
    entry?, dts?, deps?: { neverBundle?: string[] },
    platform?: 'neutral' | 'node' | 'browser',
    output?: { dir?, sourcemap? }
  }
})
```

### bumpVersion

```typescript
await group.bumpVersion({
  type: 'major' | 'minor' | 'patch' | 'pre...',
  version?, preid?, syncPeer?, syncDeps?
})
```

### publish

```typescript
await group.publish({
  skipPrivate?, registry?, tag?, otp?, dryRun?,
  access?: 'public' | 'restricted', provenance?
})
```

## buildLib — 单包构建

```typescript
import { buildLib } from '@cat-kit/maintenance'

await buildLib({ dir, entry?, dts?, deps?, platform?, output? })
// { success, duration, error? }
```

产物：`index.js`(ESM)、`index.d.ts`、`index.js.map`、`stats.html`。
