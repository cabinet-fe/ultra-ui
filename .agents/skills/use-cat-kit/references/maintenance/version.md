# maintenance — 版本管理

```typescript
import {
  parseSemver, isValidSemver, compareSemver,
  incrementVersion, bumpVersion,
  syncPeerDependencies, syncDependencies
} from '@cat-kit/maintenance'

parseSemver('1.2.3-alpha.1')
// { major, minor, patch, prerelease?, build?, raw }

isValidSemver('1.2.3')              // true
compareSemver('2.0.0', '1.0.0')    // 1
incrementVersion('1.2.3', 'minor')  // '1.3.0'

// BumpType: major | minor | patch | premajor | preminor | prepatch | prerelease

await bumpVersion('packages/core', { type: 'minor', preid? })
// { version, updated: { name, oldVersion, newVersion }[] }

await syncPeerDependencies(packages, '1.2.3')   // → >=1.2.3
await syncDependencies(packages, '1.2.3')        // workspace:* → ^1.2.3
```
