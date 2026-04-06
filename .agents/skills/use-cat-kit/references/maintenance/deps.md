# maintenance — 依赖分析

```typescript
import {
  checkCircularDependencies,
  checkVersionConsistency,
  buildDependencyGraph,
  visualizeDependencyGraph
} from '@cat-kit/maintenance'
```

## checkCircularDependencies

Tarjan 算法，O(V+E)。

```typescript
const r = checkCircularDependencies(packages)
// { hasCircular, cycles: { chain, startIndex }[] }
```

## checkVersionConsistency

检测相同外部依赖的版本不一致。`workspace:*` 被跳过。

```typescript
const r = checkVersionConsistency(packages)
// { consistent, inconsistent: { name, versions: { version, usedBy }[] }[] }
```

## buildDependencyGraph / visualizeDependencyGraph

```typescript
const graph = buildDependencyGraph(packages)
const mermaid = visualizeDependencyGraph(graph, { includeExternal?, distinguishTypes? })
```

箭头类型：`-->` dependencies, `--->` devDeps, `-.->` peerDeps。
