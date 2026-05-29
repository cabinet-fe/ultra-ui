# Release

## 发布之前

确保在与 `origin/dev` 同步的 `dev` 分支上，并且工作区干净，有未提交的代码先提交代码。

确保 `.changeset/` 中至少存在一个非 `README.md` 的 changeset 文件。

## 发布

先演练，通过后再正式发版：

```bash
bun run release --dry-run   # 必须先跑：演练 changeset version + vp install 并回滚
bun run release             # 演练通过后执行
```

可选 `--force` 允许非 `dev` 分支执行。

推送后由 `.github/workflows/release.yml` 自动完成发布。
