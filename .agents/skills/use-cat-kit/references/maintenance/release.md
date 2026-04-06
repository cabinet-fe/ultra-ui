# maintenance — 发布与 Git

```typescript
import { createGitTag, commitAndPush, publishPackage } from '@cat-kit/maintenance'

await commitAndPush({
  cwd, message,
  addAll?, allowEmpty?, remote?, branch?, pushTags?
})
// { commitHash, branch }

await createGitTag({
  cwd, tag,
  message?, push?, remote?, force?
})

await publishPackage({
  cwd, registry?, tag?, otp?, dryRun?,
  access?, provenance?, workspace?, workspaces?
})
```

错误类型：`GitError`、`PublishError`。
